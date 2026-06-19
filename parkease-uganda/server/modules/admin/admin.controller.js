const adminService = require('./admin.service');
const { successResponse } = require('../../utils/apiResponse');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json(successResponse(users));
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { is_active } = req.body;

    const user = await adminService.toggleUserStatus(userId, is_active);

    res.status(200).json(successResponse(user, `User status updated to ${is_active ? 'active' : 'inactive'}`));
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await adminService.deleteUser(userId);
    res.status(200).json(successResponse(null, 'User successfully deleted'));
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    const user = await adminService.updateUserRole(userId, role);
    res.status(200).json(successResponse(user, `User role updated to ${role}`));
  } catch (error) {
    next(error);
  }
};

exports.getOccupancyReports = async (req, res, next) => {
  try {
    const report = await adminService.getOccupancyReports();
    res.status(200).json(successResponse(report));
  } catch (error) {
    next(error);
  }
};

exports.getRevenueReports = async (req, res, next) => {
  try {
    const report = await adminService.getRevenueReports();
    res.status(200).json(successResponse(report));
  } catch (error) {
    next(error);
  }
};

exports.getAnalyticsTrend = async (req, res, next) => {
  try {
    const data = await adminService.getAnalyticsTrend();
    res.status(200).json(successResponse(data));
  } catch (error) {
    next(error);
  }
};

exports.getSystemActivity = async (req, res, next) => {
  try {
    const activity = await adminService.getSystemActivity();
    res.status(200).json(successResponse(activity));
  } catch (error) {
    next(error);
  }
};
