const db = require('../../config/db');

/**
 * Creates a new booking in a transaction.
 * The slot is reserved for the requested time window, but it is not marked
 * occupied until an owner checks the driver in.
 */
exports.createBooking = async (driverId, facilityId, slotId, intendedArrivalTime, endTime, totalAmount, vehiclePlate, paidDurationMinutes) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const facilityQuery = `SELECT * FROM parking_facilities WHERE id = $1 FOR UPDATE`;
    const facilityRes = await client.query(facilityQuery, [facilityId]);
    if (facilityRes.rowCount === 0) throw new Error('Facility not found');

    let targetSlotId = slotId;

    if (targetSlotId) {
      const slotQuery = `SELECT * FROM parking_slots WHERE id = $1 AND facility_id = $2 FOR UPDATE`;
      const slotRes = await client.query(slotQuery, [targetSlotId, facilityId]);
      if (slotRes.rowCount === 0) throw new Error('Slot not found in this facility');
      if (slotRes.rows[0].is_occupied) throw new Error('Selected slot is already occupied');
    } else {
      const availableSlotQuery = `
        SELECT * FROM parking_slots 
        WHERE facility_id = $1 AND is_occupied = false 
        ORDER BY slot_number ASC LIMIT 1 FOR UPDATE
      `;
      const slotRes = await client.query(availableSlotQuery, [facilityId]);
      if (slotRes.rowCount === 0) throw new Error('No available slots found despite facility count');
      targetSlotId = slotRes.rows[0].id;
    }

    const conflictQuery = `
      SELECT 1
      FROM bookings
      WHERE slot_id = $1
        AND status IN ('pending', 'confirmed', 'active')
        AND tstzrange(intended_arrival_time, end_time, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
      LIMIT 1
    `;
    const conflictRes = await client.query(conflictQuery, [targetSlotId, intendedArrivalTime, endTime]);
    if (conflictRes.rowCount > 0) {
      throw new Error('Selected slot is already booked for that date and time');
    }

    const bookingQuery = `
      INSERT INTO bookings (
        driver_id, slot_id, facility_id, start_time, intended_arrival_time, end_time,
        status, total_amount, paid_duration_minutes, vehicle_plate
      )
      VALUES ($1, $2, $3, $4, $4, $5, 'pending', $6, $7, $8)
      RETURNING *
    `;
    const bookingValues = [driverId, targetSlotId, facilityId, intendedArrivalTime, endTime, totalAmount, paidDurationMinutes, vehiclePlate || null];
    const { rows: bookingRows } = await client.query(bookingQuery, bookingValues);

    await client.query('COMMIT');
    
    return {
      booking: bookingRows[0],
      autoAssigned: !slotId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Gets all bookings for a specific driver
 */
exports.findUserBookings = async (driverId) => {
  const query = `
    SELECT b.*, f.name as facility_name, f.address, s.slot_number
    FROM bookings b
    JOIN parking_facilities f ON b.facility_id = f.id
    LEFT JOIN parking_slots s ON b.slot_id = s.id
    WHERE b.driver_id = $1
    ORDER BY b.created_at DESC
  `;
  const { rows } = await db.query(query, [driverId]);
  return rows;
};

/**
 * Gets all bookings for a specific facility
 */
exports.findFacilityBookings = async (facilityId) => {
  const query = `
    SELECT b.*, u.full_name as driver_name, u.phone_number, s.slot_number
    FROM bookings b
    JOIN users u ON b.driver_id = u.id
    LEFT JOIN parking_slots s ON b.slot_id = s.id
    WHERE b.facility_id = $1
    ORDER BY b.created_at DESC
  `;
  const { rows } = await db.query(query, [facilityId]);
  return rows;
};

/**
 * Gets a specific booking by ID
 */
exports.findBookingById = async (bookingId) => {
  const query = `
    SELECT b.*, f.owner_id, f.name as facility_name, s.slot_number
    FROM bookings b
    JOIN parking_facilities f ON b.facility_id = f.id
    LEFT JOIN parking_slots s ON b.slot_id = s.id
    WHERE b.id = $1
  `;
  const { rows } = await db.query(query, [bookingId]);
  return rows[0] || null;
};

/**
 * Cancels a booking, freeing up the slot in a transaction
 */
exports.cancelBooking = async (bookingId, slotId, facilityId) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update booking status
    const cancelQuery = `
      UPDATE bookings 
      SET status = 'cancelled' 
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await client.query(cancelQuery, [bookingId]);

    if (slotId && facilityId) {
      // 2. Free up the slot
      const updateSlotQuery = `
        UPDATE parking_slots 
        SET is_occupied = false, vehicle_plate = null, occupied_since = null
        WHERE id = $1 AND is_occupied = true
      `;
      const slotRes = await client.query(updateSlotQuery, [slotId]);
      
      // 3. Increment facility available_slots only if the slot was actually occupied and we freed it
      if (slotRes.rowCount > 0) {
        const updateFacilityQuery = `
          UPDATE parking_facilities 
          SET available_slots = available_slots + 1 
          WHERE id = $1
        `;
        await client.query(updateFacilityQuery, [facilityId]);
      }
    }

    await client.query('COMMIT');

    try {
      if (slotId && facilityId) {
        const io = require('../../utils/socket').getIO();
        io.to(`facility_${facilityId}`).emit('slot_updated', { id: slotId, is_occupied: false });
        io.to(`facility_${facilityId}`).emit('facility_updated', { facilityId, modifier: 1 });
      }
    } catch (err) {
      // Socket might not be initialized yet
    }

    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Updates a booking's status field (lightweight, no slot changes).
 * Used by the payment webhook to transition pending → active, etc.
 */
exports.updateBookingStatus = async (bookingId, status) => {
  const query = `
    UPDATE bookings 
    SET status = $1 
    WHERE id = $2 
    RETURNING *
  `;
  const { rows } = await db.query(query, [status, bookingId]);
  return rows[0] || null;
};

exports.checkInBooking = async (bookingId, slotId, facilityId, vehiclePlate, checkedInAt, endTime, holdingFeeAmount) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const slotRes = await client.query(
      `UPDATE parking_slots
       SET is_occupied = true, vehicle_plate = $1, occupied_since = $2
       WHERE id = $3 AND is_occupied = false
       RETURNING *`,
      [vehiclePlate || null, checkedInAt, slotId]
    );

    if (slotRes.rowCount === 0) {
      throw new Error('Selected slot is already occupied');
    }

    await client.query(
      `UPDATE parking_facilities
       SET available_slots = GREATEST(available_slots - 1, 0)
       WHERE id = $1`,
      [facilityId]
    );

    const { rows } = await client.query(
      `UPDATE bookings
       SET status = 'active',
           checked_in_at = $2,
           start_time = $2,
           end_time = $3,
           holding_fee_amount = $4
       WHERE id = $1
       RETURNING *`,
      [bookingId, checkedInAt, endTime, holdingFeeAmount]
    );

    await client.query('COMMIT');

    try {
      const io = require('../../utils/socket').getIO();
      io.to(`facility_${facilityId}`).emit('slot_updated', { id: slotId, is_occupied: true, vehicle_plate: vehiclePlate });
      io.to(`facility_${facilityId}`).emit('facility_updated', { facilityId, modifier: -1 });
    } catch (err) {
      // Socket might not be initialized yet
    }

    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Completes a booking, freeing up its slot in a transaction.
 * Mirrors cancelBooking but sets status to 'completed'.
 */
exports.completeBooking = async (bookingId, slotId, facilityId, actualDepartureTime = new Date()) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update booking status and actual_departure_time
    const completeQuery = `
      UPDATE bookings 
      SET status = 'completed', actual_departure_time = $2
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await client.query(completeQuery, [bookingId, actualDepartureTime]);

    if (slotId && facilityId) {
      // 2. Free up the slot
      const updateSlotQuery = `
        UPDATE parking_slots 
        SET is_occupied = false, vehicle_plate = null, occupied_since = null
        WHERE id = $1 AND is_occupied = true
      `;
      const slotRes = await client.query(updateSlotQuery, [slotId]);

      // 3. Increment facility available_slots only if the slot was actually freed
      if (slotRes.rowCount > 0) {
        const updateFacilityQuery = `
          UPDATE parking_facilities 
          SET available_slots = available_slots + 1 
          WHERE id = $1
        `;
        await client.query(updateFacilityQuery, [facilityId]);
      }
    }

    await client.query('COMMIT');

    try {
      if (slotId && facilityId) {
        const io = require('../../utils/socket').getIO();
        io.to(`facility_${facilityId}`).emit('slot_updated', { id: slotId, is_occupied: false });
        io.to(`facility_${facilityId}`).emit('facility_updated', { facilityId, modifier: 1 });
      }
    } catch (err) {
      // Socket might not be initialized yet
    }

    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
