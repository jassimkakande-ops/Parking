const express = require('express');
const adminController = require('./admin.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');

const router = express.Router();

// All admin routes are protected
router.use(authenticate);
router.use(authorize('admin'));

// User Management
router.get('/users', adminController.getUsers);

router.patch(
  '/users/:id/status', 
  [
    body('is_active').isBoolean().withMessage('is_active must be a boolean')
  ],
  validate,
  adminController.updateUserStatus
);

router.delete('/users/:id', adminController.deleteUser);

router.patch(
  '/users/:id/role',
  [
    body('role').isIn(['driver', 'owner', 'admin']).withMessage('Role must be driver, owner, or admin')
  ],
  validate,
  adminController.updateUserRole
);

// Reports
router.get('/reports/occupancy', adminController.getOccupancyReport);
router.get('/reports/revenue', adminController.getRevenueReport);

// System Activity
router.get('/activity', adminController.getSystemActivity);

module.exports = router;
