const { body } = require('express-validator');

exports.createBookingValidation = [
  body('facility_id').trim().isUUID().withMessage('Valid facility_id is required.'),
  body('slot_id').optional().isUUID().withMessage('Valid slot_id must be a UUID.'),
  body('vehicle_plate').optional().trim(),
  body('intended_arrival_time')
    .optional()
    .isISO8601().toDate().withMessage('Valid intended_arrival_time is required.'),
  body('start_time').optional().isISO8601().toDate().withMessage('Valid start_time is required.'),
  body('end_time').optional().isISO8601().toDate().withMessage('Valid end_time is required.'),
  body().custom((value) => {
    if (!value.intended_arrival_time && !value.start_time) {
      throw new Error('Arrival date and time is required.');
    }
    return true;
  })
];
