const express = require('express');
const paymentController = require('./payment.controller');
const { initiatePaymentValidation } = require('./payment.validators');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

// --- Public Routes ---
// Webhook endpoint (MakyPay calls this, so no token authentication)
router.post('/webhook', paymentController.webhook);

// --- Protected Routes ---
router.use(authenticate);

// POST /api/v1/payments/initiate - Driver initiates payment
router.post(
  '/initiate', 
  authorize('driver', 'admin'), 
  validate(initiatePaymentValidation), 
  paymentController.initiatePayment
);

// POST /api/v1/payments/initiate-overstay - Driver initiates overstay payment
router.post(
  '/initiate-overstay', 
  authorize('driver', 'admin'), 
  validate(initiatePaymentValidation), 
  paymentController.initiateOverstayPayment
);

// GET /api/v1/payments/booking/:bookingId - Driver views payment status
router.get(
  '/booking/:bookingId', 
  authorize('driver', 'admin'), 
  paymentController.getPaymentStatus
);

// GET /api/v1/payments/me - Driver views all payments
router.get(
  '/me',
  authorize('driver', 'admin'),
  paymentController.getUserPayments
);

// GET /api/v1/payments/facility/:facilityId - Owner views facility payments
router.get(
  '/facility/:facilityId',
  authorize('owner', 'admin'),
  paymentController.getFacilityPayments
);

module.exports = router;
