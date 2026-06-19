const db = require('../../config/db');

/**
 * Gets global occupancy statistics.
 */
exports.getOccupancyStats = async () => {
  const query = `
    SELECT 
      COUNT(id) as total_facilities,
      SUM(total_slots) as total_slots_overall,
      SUM(available_slots) as total_available_slots,
      SUM(total_slots - available_slots) as total_occupied_slots
    FROM parking_facilities
    WHERE is_active = true
  `;
  const { rows } = await db.query(query);
  return rows[0];
};

/**
 * Gets total revenue aggregated by all time.
 */
exports.getRevenueAllTime = async () => {
  const query = `
    SELECT SUM(amount) as total_revenue
    FROM payments
    WHERE status = 'completed'
  `;
  const { rows } = await db.query(query);
  return rows[0];
};

/**
 * Gets revenue aggregated by Day, Month, Year.
 */
exports.getRevenueAggregates = async () => {
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN DATE(completed_at) = CURRENT_DATE THEN amount ELSE 0 END), 0) AS daily_revenue,
      COALESCE(SUM(CASE WHEN DATE_TRUNC('month', completed_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS monthly_revenue,
      COALESCE(SUM(CASE WHEN DATE_TRUNC('year', completed_at) = DATE_TRUNC('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS yearly_revenue
    FROM payments
    WHERE status = 'completed'
  `;
  const { rows } = await db.query(query);
  return rows[0];
};

/**
 * Retrieves payment records.
 */
exports.getPaymentRecords = async () => {
  const query = `
    SELECT p.*, u.full_name as driver_name, u.phone_number
    FROM payments p
    JOIN users u ON p.driver_id = u.id
    ORDER BY p.initiated_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
};

/**
 * Retrieves recent bookings for system activity
 */
exports.getRecentBookings = async (limit = 1000) => {
  const query = `
    SELECT b.id, b.status, b.total_amount, b.created_at, b.start_time, b.end_time,
           u.full_name as driver_name, f.name as facility_name
    FROM bookings b
    JOIN users u ON b.driver_id = u.id
    JOIN parking_facilities f ON b.facility_id = f.id
    ORDER BY b.created_at DESC
    LIMIT $1
  `;
  const { rows } = await db.query(query, [limit]);
  return rows;
};

/**
 * Retrieves recent payments for system activity
 */
exports.getRecentPayments = async (limit = 1000) => {
  const query = `
    SELECT p.id, p.amount, p.status, p.payment_method, p.initiated_at, p.completed_at,
           u.full_name as driver_name
    FROM payments p
    JOIN users u ON p.driver_id = u.id
    ORDER BY p.initiated_at DESC
    LIMIT $1
  `;
  const { rows } = await db.query(query, [limit]);
  return rows;
};

/**
 * Retrieves recent user registrations for system activity
 */
exports.getRecentUsers = async (limit = 1000) => {
  const query = `
    SELECT id, full_name, email, role, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const { rows } = await db.query(query, [limit]);
  return rows;
};

/**
 * Returns last 7 days of daily bookings + revenue for trend charts.
 * Also returns user role breakdown, booking status counts, and top facilities.
 */
exports.getAnalyticsTrend = async () => {
  const [trendRows, roleRows, statusRows, facilityRows, paymentMethodRows] = await Promise.all([
    // 7-day trend
    db.query(`
      SELECT
        TO_CHAR(day, 'DD Mon') AS label,
        COALESCE(b.bookings, 0) AS bookings,
        COALESCE(p.revenue, 0) AS revenue
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'
      ) AS day
      LEFT JOIN (
        SELECT DATE(created_at) AS d, COUNT(*) AS bookings
        FROM bookings
        GROUP BY d
      ) b ON b.d = day
      LEFT JOIN (
        SELECT DATE(completed_at) AS d, SUM(amount) AS revenue
        FROM payments WHERE status = 'completed'
        GROUP BY d
      ) p ON p.d = day
      ORDER BY day ASC
    `),
    // Role breakdown
    db.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `),
    // Booking status breakdown
    db.query(`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY count DESC
    `),
    // Top 5 facilities by booking count
    db.query(`
      SELECT f.name, COUNT(b.id) as bookings, f.available_slots, f.total_slots
      FROM parking_facilities f
      LEFT JOIN bookings b ON b.facility_id = f.id
      GROUP BY f.id
      ORDER BY bookings DESC
      LIMIT 5
    `),
    // Payment method breakdown
    db.query(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM payments
      WHERE status = 'completed'
      GROUP BY payment_method
    `),
  ]);

  return {
    trend: trendRows.rows,
    roles: roleRows.rows,
    bookingStatuses: statusRows.rows,
    topFacilities: facilityRows.rows,
    paymentMethods: paymentMethodRows.rows,
  };
};
