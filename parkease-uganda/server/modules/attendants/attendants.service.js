const db = require('../../config/db');
const parkingRepository = require('../parking/parking.repository');
const { AppError } = require('../../middleware/errorHandler');

exports.getDashboardAnalytics = async (attendantId) => {
  // 1. Get facility ID for this attendant
  const facilityId = await parkingRepository.getAttendantFacilityId(attendantId);
  if (!facilityId) {
    throw new AppError('You are not assigned to any facility.', 403);
  }

  // 2. Fetch all analytics in parallel or one big query. 
  // For simplicity and clarity, we do separate queries or a combined JSON query.
  
  const todayCheckedInQuery = `
    SELECT (total_slots - available_slots) as count 
    FROM parking_facilities 
    WHERE id = $1
  `;
  
  const todayCheckedOutQuery = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE facility_id = $1 
      AND status = 'completed' 
      AND DATE(end_time) = CURRENT_DATE
  `;

  // Cars that have overstayed (active but past end_time)
  const overstayedQuery = `
    SELECT b.id, b.vehicle_plate, s.slot_number, b.end_time, 
           EXTRACT(EPOCH FROM (NOW() - b.end_time))/60 as overstay_minutes
    FROM bookings b
    JOIN parking_slots s ON b.slot_id = s.id
    WHERE b.facility_id = $1 
      AND b.status = 'active' 
      AND b.end_time < NOW()
  `;

  // Booked slots (upcoming or pending arrival)
  const bookedSlotsQuery = `
    SELECT b.id, b.vehicle_plate, s.slot_number, b.intended_arrival_time, b.status
    FROM bookings b
    JOIN parking_slots s ON b.slot_id = s.id
    WHERE b.facility_id = $1 
      AND b.status IN ('pending', 'confirmed') 
      AND b.end_time > NOW()
  `;

  // Slots with active holding fee 
  // Either they are active and paid a holding fee, or they are confirmed and late (accruing holding fee)
  const holdingFeeQuery = `
    SELECT b.id, b.vehicle_plate, s.slot_number, b.holding_fee_amount, b.status,
           EXTRACT(EPOCH FROM (NOW() - b.intended_arrival_time))/3600 as late_hours
    FROM bookings b
    JOIN parking_slots s ON b.slot_id = s.id
    WHERE b.facility_id = $1 
      AND (
        (b.status = 'active' AND b.holding_fee_amount > 0)
        OR 
        (b.status = 'confirmed' AND b.intended_arrival_time < NOW())
      )
  `;

  const facilityQuery = `SELECT * FROM parking_facilities WHERE id = $1`;

  const [
    checkedInRes, 
    checkedOutRes, 
    overstayedRes, 
    bookedRes, 
    holdingRes,
    facilityRes
  ] = await Promise.all([
    db.query(todayCheckedInQuery, [facilityId]),
    db.query(todayCheckedOutQuery, [facilityId]),
    db.query(overstayedQuery, [facilityId]),
    db.query(bookedSlotsQuery, [facilityId]),
    db.query(holdingFeeQuery, [facilityId]),
    db.query(facilityQuery, [facilityId])
  ]);

  return {
    facility: facilityRes.rows[0],
    total_checked_in: parseInt(checkedInRes.rows[0].count, 10),
    total_checked_out: parseInt(checkedOutRes.rows[0].count, 10),
    overstayed_cars: overstayedRes.rows,
    booked_slots: bookedRes.rows,
    holding_fee_slots: holdingRes.rows
  };
};
