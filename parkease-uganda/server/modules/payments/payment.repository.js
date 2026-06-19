const db = require('../../config/db');

exports.createPayment = async ({ bookingId, driverId, amount, currency, paymentMethod, makypayReference, redirectUrl, transactionUuid, paymentType = 'initial' }) => {
  const query = `
    INSERT INTO payments (booking_id, driver_id, amount, currency, payment_method, makypay_reference, redirect_url, makypay_transaction_uuid, status, payment_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
    RETURNING *
  `;
  const values = [bookingId, driverId, amount, currency || 'UGX', paymentMethod, makypayReference, redirectUrl, transactionUuid, paymentType];
  
  const { rows } = await db.query(query, values);
  return rows[0];
};

exports.findPaymentByReference = async (reference) => {
  const query = `SELECT * FROM payments WHERE makypay_reference = $1`;
  const { rows } = await db.query(query, [reference]);
  return rows[0] || null;
};

exports.findPaymentByBookingId = async (bookingId) => {
  const query = `SELECT * FROM payments WHERE booking_id = $1 ORDER BY initiated_at DESC`;
  const { rows } = await db.query(query, [bookingId]);
  return rows;
};

exports.updatePaymentStatus = async (reference, status, providerReference, makypayTransactionUuid) => {
  const completedAt = status === 'completed' ? new Date() : null;
  const query = `
    UPDATE payments
    SET status = $1, 
        provider_reference = COALESCE($2, provider_reference), 
        makypay_transaction_uuid = COALESCE($3, makypay_transaction_uuid),
        completed_at = COALESCE($4, completed_at)
    WHERE makypay_reference = $5
    RETURNING *
  `;
  const { rows } = await db.query(query, [status, providerReference, makypayTransactionUuid, completedAt, reference]);
  return rows[0] || null;
};

exports.findPaymentsByFacilityId = async (facilityId) => {
  const query = `
    SELECT p.*, u.full_name as driver_name, u.phone_number, b.start_time, b.end_time, s.slot_number
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    JOIN users u ON p.driver_id = u.id
    LEFT JOIN parking_slots s ON b.slot_id = s.id
    WHERE b.facility_id = $1
    ORDER BY p.initiated_at DESC
  `;
  const { rows } = await db.query(query, [facilityId]);
  return rows;
};

exports.findPaymentsByDriverId = async (driverId) => {
  const query = `
    SELECT p.*, b.start_time, b.end_time, s.slot_number, f.name as facility_name
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    LEFT JOIN parking_slots s ON b.slot_id = s.id
    LEFT JOIN parking_facilities f ON b.facility_id = f.id
    WHERE p.driver_id = $1
    ORDER BY p.initiated_at DESC
  `;
  const { rows } = await db.query(query, [driverId]);
  return rows;
};

/**
 * Automatically set pending payments older than 1 minute to 'timedout'
 */
exports.timeoutPendingPayments = async () => {
  const query = `
    UPDATE payments
    SET status = 'timedout'
    WHERE status = 'pending' AND initiated_at < NOW() - INTERVAL '1 minute'
  `;
  await db.query(query);
};
