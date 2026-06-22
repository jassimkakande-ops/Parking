const db = require('../../config/db');

/**
 * Creates a new facility and automatically generates its slots inside a transaction.
 */
exports.createFacility = async (ownerId, data) => {
  const { name, description, address, district, plot_number, latitude, longitude, total_slots, hourly_rate } = data;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert facility<find why $>
    const facilityQuery = `
      INSERT INTO parking_facilities (owner_id, name, description, address, district, plot_number, latitude, longitude, total_slots, available_slots, hourly_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const facilityValues = [ownerId, name, description, address, district, plot_number, latitude, longitude, total_slots, total_slots, hourly_rate];
    const { rows: facilityRows } = await client.query(facilityQuery, facilityValues);
    const facility = facilityRows[0];

    // 2. Auto-generate slots
    if (total_slots > 0) {
      const slotValues = [];
      const placeholders = [];
      let paramIndex = 1;

      for (let i = 1; i <= total_slots; i++) {
        const slotNumber = `Slot ${i}`;
        placeholders.push(`($${paramIndex}, $${paramIndex + 1})`);
        slotValues.push(facility.id, slotNumber);
        paramIndex += 2;
      }

      const slotQuery = `
        INSERT INTO parking_slots (facility_id, slot_number)
        VALUES ${placeholders.join(', ')}
      `;
      await client.query(slotQuery, slotValues);
    }

    await client.query('COMMIT');
    return facility;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Updates an existing facility.
 */
exports.updateFacility = async (facilityId, ownerId, data) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(facilityId, ownerId);

  const query = `
    UPDATE parking_facilities 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex - 2} AND owner_id = $${paramIndex - 1}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  return rows[0] || null;
};

/**
 * Finds all active facilities, optionally filtering by those with available slots.
 */
exports.findFacilities = async (requireAvailable = false) => {
  let query = `
    SELECT id, name, address, district, plot_number, latitude, longitude, total_slots, available_slots, hourly_rate 
    FROM parking_facilities 
    WHERE is_active = true
  `;

  if (requireAvailable) {
    query += ` AND available_slots > 0`;
  }

  const { rows } = await db.query(query);
  return rows;
};

/**
 * Finds all facilities for a specific owner.
 */
exports.findFacilitiesByOwnerId = async (ownerId) => {
  const query = `
    SELECT id, name, address, district, plot_number, latitude, longitude, total_slots, available_slots, hourly_rate, is_active 
    FROM parking_facilities 
    WHERE owner_id = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [ownerId]);
  return rows;
};

/**
 * Finds a facility by ID.
 */
exports.findFacilityById = async (facilityId) => {
  const query = `SELECT * FROM parking_facilities WHERE id = $1`;
  const { rows } = await db.query(query, [facilityId]);
  return rows[0] || null;
};

/**
 * Gets all slots for a specific facility, including upcoming and active booking windows.
 * Each slot now has an `active_bookings` array with { id, start_time, end_time, vehicle_plate, status }.
 */
exports.getFacilitySlots = async (facilityId) => {
  const query = `
    SELECT 
      s.id, 
      s.slot_number, 
      s.is_occupied, 
      s.vehicle_plate, 
      s.occupied_since,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', b.id,
            'start_time', b.intended_arrival_time,
            'end_time', b.end_time,
            'vehicle_plate', b.vehicle_plate,
            'status', b.status
          ) ORDER BY b.intended_arrival_time ASC
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'
      ) AS active_bookings
    FROM parking_slots s
    LEFT JOIN bookings b 
      ON b.slot_id = s.id 
      AND b.status IN ('pending', 'confirmed', 'active')
      AND b.end_time > NOW()
    WHERE s.facility_id = $1
    GROUP BY s.id, s.slot_number, s.is_occupied, s.vehicle_plate, s.occupied_since
    ORDER BY s.slot_number
  `;
  const { rows } = await db.query(query, [facilityId]);
  return rows;
};

/**
 * Gets a specific slot by ID.
 */
exports.findSlotById = async (slotId) => {
  const query = `SELECT * FROM parking_slots WHERE id = $1`;
  const { rows } = await db.query(query, [slotId]);
  return rows[0] || null;
};

/**
 * Gets slot availability for a facility within a specific time window.
 */
exports.getFacilityAvailability = async (facilityId, startTime, endTime) => {
  const query = `
    SELECT s.id, s.slot_number,
           EXISTS (
             SELECT 1 FROM bookings b
             WHERE b.slot_id = s.id
               AND b.status IN ('pending', 'confirmed', 'active')
               AND tstzrange(b.intended_arrival_time, b.end_time, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
           ) as is_occupied
    FROM parking_slots s
    WHERE s.facility_id = $1
    ORDER BY s.slot_number
  `;
  const { rows } = await db.query(query, [facilityId, startTime, endTime]);
  return rows;
};

/**
 * Updates a slot status and adjusts the facility's available_slots count atomically.
 */
exports.updateSlotStatus = async (slotId, facilityId, isOccupied, vehiclePlate) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get current slot state to see if it's actually changing
    const checkQuery = `SELECT is_occupied FROM parking_slots WHERE id = $1 FOR UPDATE`;
    const checkRes = await client.query(checkQuery, [slotId]);
    if (checkRes.rowCount === 0) throw new Error('Slot not found');

    const wasOccupied = checkRes.rows[0].is_occupied;

    if (wasOccupied !== isOccupied) {
      // 2. Update the slot
      const updateSlotQuery = `
        UPDATE parking_slots 
        SET is_occupied = $1, 
            vehicle_plate = $2, 
            occupied_since = $3 
        WHERE id = $4
        RETURNING *
      `;
      const occupiedSince = isOccupied ? new Date() : null;
      const slotRes = await client.query(updateSlotQuery, [isOccupied, isOccupied ? vehiclePlate : null, occupiedSince, slotId]);

      // 3. Update the facility's available_slots count
      const modifier = isOccupied ? -1 : 1;
      const updateFacilityQuery = `
        UPDATE parking_facilities 
        SET available_slots = available_slots + $1 
        WHERE id = $2
      `;
      await client.query(updateFacilityQuery, [modifier, facilityId]);

      await client.query('COMMIT');

      // Emit real-time events
      try {
        const io = require('../../utils/socket').getIO();
        io.to(`facility_${facilityId}`).emit('slot_updated', slotRes.rows[0]);
        // We can optionally fetch the new available_slots count to emit, or just let clients know a change happened.
        io.to(`facility_${facilityId}`).emit('facility_updated', { facilityId, modifier });
      } catch (err) {
        // Socket might not be initialized yet during tests
      }

      return slotRes.rows[0];
    } else {
      // No change in status, just update plate if provided
      const updateSlotQuery = `
        UPDATE parking_slots 
        SET vehicle_plate = COALESCE($1, vehicle_plate)
        WHERE id = $2
        RETURNING *
      `;
      const slotRes = await client.query(updateSlotQuery, [vehiclePlate, slotId]);
      await client.query('COMMIT');
      return slotRes.rows[0];
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Adds an extra slot to an existing facility.
 */
exports.addExtraSlot = async (facilityId, type = 'car') => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Increment total_slots and available_slots
    const updateFacilityQuery = `
      UPDATE parking_facilities 
      SET total_slots = total_slots + 1,
          available_slots = available_slots + 1
      WHERE id = $1
      RETURNING total_slots
    `;
    const facilityRes = await client.query(updateFacilityQuery, [facilityId]);
    const newTotalSlots = facilityRes.rows[0].total_slots;
    
    // Insert new slot
    const prefix = type === 'bike' ? 'Bike' : 'Slot';
    const slotNumber = `${prefix} ${newTotalSlots}`;
    const insertSlotQuery = `
      INSERT INTO parking_slots (facility_id, slot_number)
      VALUES ($1, $2)
      RETURNING *
    `;
    const slotRes = await client.query(insertSlotQuery, [facilityId, slotNumber]);
    
    await client.query('COMMIT');

    // Emit facility_updated and slot_added
    try {
      const io = require('../../utils/socket').getIO();
      io.to(`facility_${facilityId}`).emit('facility_updated', { facilityId, modifier: 1 });
      io.to(`facility_${facilityId}`).emit('slot_added', slotRes.rows[0]);
    } catch (err) {
      // Socket might not be initialized
    }

    return slotRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Gets analytics for an owner's facility
 */
exports.getFacilityOwnerAnalytics = async (facilityId) => {
  const query = `
    SELECT 
      (SELECT total_slots - available_slots FROM parking_facilities WHERE id = $1) as occupied_slots,
      (SELECT available_slots FROM parking_facilities WHERE id = $1) as free_slots,
      (SELECT COUNT(DISTINCT slot_id) FROM bookings WHERE facility_id = $1 AND status IN ('pending', 'confirmed', 'active') AND end_time > NOW()) as booked_slots,
      (SELECT COUNT(*) FROM bookings WHERE facility_id = $1 AND status = 'completed' AND DATE(end_time) = CURRENT_DATE) as checked_out_today
  `;
  const { rows } = await db.query(query, [facilityId]);
  return rows[0];
};

/**
 * Checks if an attendant is assigned to a specific facility
 */
exports.isAttendantAssignedToFacility = async (attendantId, facilityId) => {
  const query = `SELECT id FROM facility_attendants WHERE attendant_id = $1 AND facility_id = $2`;
  const { rows } = await db.query(query, [attendantId, facilityId]);
  return rows.length > 0;
};

/**
 * Gets the facility ID an attendant is assigned to
 */
exports.getAttendantFacilityId = async (attendantId) => {
  const query = `SELECT facility_id FROM facility_attendants WHERE attendant_id = $1`;
  const { rows } = await db.query(query, [attendantId]);
  return rows[0]?.facility_id || null;
};

/**
 * Assigns an attendant to a facility
 */
exports.assignAttendant = async (facilityId, attendantId, ownerId) => {
  const query = `
    INSERT INTO facility_attendants (facility_id, attendant_id, assigned_by)
    VALUES ($1, $2, $3)
    ON CONFLICT (attendant_id) 
    DO UPDATE SET facility_id = $1, assigned_by = $3
    RETURNING *
  `;
  const { rows } = await db.query(query, [facilityId, attendantId, ownerId]);
  return rows[0];
};

/**
 * Gets attendants for a facility
 */
exports.getFacilityAttendants = async (facilityId) => {
  const query = `
    SELECT u.id, u.full_name, u.email, u.phone_number, fa.created_at as assigned_at
    FROM facility_attendants fa
    JOIN users u ON fa.attendant_id = u.id
    WHERE fa.facility_id = $1
  `;
  const { rows } = await db.query(query, [facilityId]);
  return rows;
};

/**
 * Removes an attendant from a facility
 */
exports.removeAttendant = async (facilityId, attendantId) => {
  const query = `DELETE FROM facility_attendants WHERE facility_id = $1 AND attendant_id = $2 RETURNING *`;
  const { rows } = await db.query(query, [facilityId, attendantId]);
  return rows[0];
};
