const express = require('express');
const bookingController = require('./booking.controller');
const { createBookingValidation } = require('./booking.validators');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

// --- Protected Routes ---
router.use(authenticate);

// POST /api/v1/bookings - Driver creates a booking
router.post(
  '/', 
  authorize('driver', 'admin'), 
  validate(createBookingValidation), 
  bookingController.createBooking
);

// GET /api/v1/bookings - Driver gets their bookings
router.get(
  '/', 
  authorize('driver', 'admin'), 
  bookingController.getUserBookings
);

// GET /api/v1/bookings/facility/:facilityId - Owner gets bookings for their facility
router.get(
  '/facility/:facilityId', 
  authorize('owner', 'admin'), 
  bookingController.getFacilityBookings
);

// GET /api/v1/bookings/:id - View specific booking details (driver/owner/admin)
router.get(
  '/:id', 
  bookingController.getBookingDetails
);

// PATCH /api/v1/bookings/:id/cancel - Cancel a booking
router.patch(
  '/:id/cancel', 
  authorize('driver', 'owner', 'admin'),
  bookingController.cancelBooking
);

// POST /api/v1/bookings/:id/checkin - Owner or Attendant checks in a driver and starts paid time
router.post(
  '/:id/checkin',
  authorize('owner', 'admin', 'attendant'),
  bookingController.checkInBooking
);

// POST /api/v1/bookings/:id/checkout - Checkout a booking and check for overstay
router.post(
  '/:id/checkout', 
  authorize('owner', 'admin', 'attendant'),
  bookingController.checkoutBooking
);

// GET /api/v1/bookings/facility/:facilityId/drivers - Owner gets unique drivers
router.get(
  '/facility/:facilityId/drivers',
  authorize('owner', 'admin'),
  bookingController.getFacilityDrivers
);

module.exports = router;
