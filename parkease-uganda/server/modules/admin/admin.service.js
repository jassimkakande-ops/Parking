const usersRepository = require('../users/users.repository');
const adminRepository = require('./admin.repository');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Gets all registered users
 */
exports.getAllUsers = async () => {
  return await usersRepository.findAllUsers();
};

/**
 * Toggles a user's active status
 */
exports.toggleUserStatus = async (userId, isActive) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent an admin from disabling themselves to avoid lockouts
  // (In a real app, you'd pass the requesterId down to check this, but for now we just toggle)

  const updatedUser = await usersRepository.updateUserStatus(userId, isActive);
  return updatedUser;
};

/**
 * Generates occupancy reports
 */
exports.getOccupancyReports = async () => {
  const stats = await adminRepository.getOccupancyStats();
  
  // Calculate percentage
  let occupancyRate = 0;
  if (stats.total_slots_overall > 0) {
    occupancyRate = (stats.total_occupied_slots / stats.total_slots_overall) * 100;
  }

  return {
    ...stats,
    occupancy_rate_percent: parseFloat(occupancyRate.toFixed(2))
  };
};

/**
 * Generates revenue reports
 */
exports.getRevenueReports = async () => {
  const allTime = await adminRepository.getRevenueAllTime();
  const aggregates = await adminRepository.getRevenueAggregates();
  const records = await adminRepository.getPaymentRecords();

  return {
    summary: {
      total_revenue_all_time: allTime.total_revenue || 0,
      revenue_today: aggregates.daily_revenue || 0,
      revenue_this_month: aggregates.monthly_revenue || 0,
      revenue_this_year: aggregates.yearly_revenue || 0
    },
    records: records
  };
};

/**
 * Gets combined system activity
 */
exports.getSystemActivity = async () => {
  const [bookings, payments, users] = await Promise.all([
    adminRepository.getRecentBookings(20),
    adminRepository.getRecentPayments(20),
    adminRepository.getRecentUsers(20)
  ]);

  // Transform and combine into a single feed
  const activity = [
    ...bookings.map(b => ({
      type: 'booking',
      id: b.id,
      description: `New booking by ${b.driver_name} at ${b.facility_name}`,
      status: b.status,
      amount: b.total_amount,
      timestamp: b.created_at
    })),
    ...payments.map(p => ({
      type: 'payment',
      id: p.id,
      description: `Payment of UGX ${p.amount} by ${p.driver_name}`,
      status: p.status,
      method: p.payment_method,
      timestamp: p.initiated_at
    })),
    ...users.map(u => ({
      type: 'registration',
      id: u.id,
      description: `New user registered: ${u.full_name} (${u.role})`,
      status: 'success',
      timestamp: u.created_at
    }))
  ];

  // Sort descending by timestamp
  activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return activity.slice(0, 50); // Return latest 50 activities
};
