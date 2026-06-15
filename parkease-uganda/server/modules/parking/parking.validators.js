const { body } = require('express-validator');

exports.createFacilityValidation = [
  body('name').trim().notEmpty().withMessage('Facility name is required.'),
  body('address').trim().notEmpty().withMessage('Address is required.'),
  body('district').optional().trim().notEmpty().withMessage('District cannot be empty if provided.'),
  body('plot_number').optional().trim().notEmpty().withMessage('Plot number cannot be empty if provided.'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required.'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required.'),
  body('total_slots').isInt({ min: 1 }).withMessage('Total slots must be at least 1.'),
  body('hourly_rate').isFloat({ min: 0 }).withMessage('Hourly rate cannot be negative.')
];

exports.updateFacilityValidation = [
  body('name').optional().trim().notEmpty().withMessage('Facility name cannot be empty.'),
  body('description').optional().trim(),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty.'),
  body('district').optional().trim().notEmpty().withMessage('District cannot be empty if provided.'),
  body('plot_number').optional().trim().notEmpty().withMessage('Plot number cannot be empty if provided.'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required.'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required.'),
  body('hourly_rate').optional().isFloat({ min: 0 }).withMessage('Hourly rate cannot be negative.'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean.')
];

exports.updateSlotValidation = [
  body('is_occupied').isBoolean().withMessage('is_occupied must be a boolean.'),
  body('vehicle_plate').optional({ nullable: true }).trim().isLength({ max: 50 })
];
