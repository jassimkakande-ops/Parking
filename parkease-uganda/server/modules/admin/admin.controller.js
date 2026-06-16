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

exports.getOccupancyReport = async (req, res, next) => {
  try {
    const report = await adminService.getOccupancyReports();
    res.status(200).json(successResponse(report));
  } catch (error) {
    next(error);
  }
};

exports.getRevenueReport = async (req, res, next) => {
  try {
    const report = await adminService.getRevenueReports();
    res.status(200).json(successResponse(report));
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
