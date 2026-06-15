const paymentService = require('./payment.service');
const { successResponse } = require('../../utils/apiResponse');
const logger = require('../../utils/logger');

exports.initiatePayment = async (req, res, next) => {
  try {
    const driverId = req.user.id;
    const { booking_id, payment_method, ...paymentDetails } = req.body;
    
    const result = await paymentService.processPayment(driverId, booking_id, payment_method, paymentDetails);
    
    let message = 'Payment initiated successfully.';
    if (result.redirectUrl) {
      message = 'Please complete the card payment at the redirect URL.';
    }

    res.status(201).json(successResponse(result, message));
  } catch (error) {
    next(error);
  }
};

exports.initiateOverstayPayment = async (req, res, next) => {
  try {
    const driverId = req.user.id;
    const { booking_id, payment_method, ...paymentDetails } = req.body;
    
    const result = await paymentService.processOverstayPayment(driverId, booking_id, payment_method, paymentDetails);
    
    let message = 'Overstay payment initiated successfully.';
    if (result.redirectUrl) {
      message = 'Please complete the card payment at the redirect URL.';
    }

    res.status(201).json(successResponse(result, message));
  } catch (error) {
    next(error);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    logger.info('MakyPay webhook received', { payload: req.body });
    
    await paymentService.handleWebhook(req.body);
    
    res.status(200).send('OK');
  } catch (error) {
    logger.error('MakyPay webhook error', { error: error.message });
    // Still return 200 to prevent retries from provider if it's a non-retryable error, 
    // but typically providers like 200 OK.
    res.status(200).send('Error processed');
  }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    const driverId = req.user.id;

    const payment = await paymentService.getPaymentStatusByBooking(bookingId, driverId);
    
    res.status(200).json(successResponse(payment));
  } catch (error) {
    next(error);
  }
};

exports.getFacilityPayments = async (req, res, next) => {
  try {
    const facilityId = req.params.facilityId;
    const ownerId = req.user.id;
    
    const payments = await paymentService.getFacilityPayments(facilityId, ownerId);
    res.status(200).json(successResponse(payments));
  } catch (error) {
    next(error);
  }
};

exports.getUserPayments = async (req, res, next) => {
  try {
    const driverId = req.user.id;
    const payments = await paymentService.getUserPayments(driverId);
    res.status(200).json(successResponse(payments));
  } catch (error) {
    next(error);
  }
};
