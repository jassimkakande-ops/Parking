const crypto = require('crypto');
const paymentRepository = require('./payment.repository');
const bookingRepository = require('../booking/booking.repository');
const userRepository = require('../users/users.repository');
const makyPayService = require('./makypay.service');
const { normalizePhoneNumber } = require('../../utils/phone.helper');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Initiates a payment for a booking
 */
exports.processPayment = async (driverId, bookingId, paymentMethod, paymentDetails = {}) => {
  // 1. Get booking
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.driver_id !== driverId) {
    throw new AppError('You do not have permission to pay for this booking', 403);
  }

  if (booking.status !== 'pending') {
    throw new AppError(`Booking is already ${booking.status}`, 400);
  }

  // 2. Get user phone number
  const user = await userRepository.findById(driverId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const phoneNumber = paymentDetails.phone_number ? normalizePhoneNumber(paymentDetails.phone_number) : normalizePhoneNumber(user.phone_number);
  const amount = booking.total_amount;
  const reference = crypto.randomUUID();

  // 3. Initiate with MakyPay
  const isCard = paymentMethod === 'card';
  const apiMethod = isCard ? 'card' : undefined; // omit for mobile money

  const paymentResponse = await makyPayService.initiateCollection({
    amount,
    phoneNumber,
    method: apiMethod,
    reference,
    description: `Payment for booking ${bookingId}`
  });

  const transactionUuid = paymentResponse.data?.transaction?.uuid;
  const redirectUrl = paymentResponse.data?.redirect_url;

  // 4. Save payment record
  const paymentRecord = await paymentRepository.createPayment({
    bookingId,
    driverId,
    amount,
    currency: 'UGX',
    paymentMethod,
    makypayReference: reference,
    redirectUrl,
    transactionUuid,
    paymentType: 'initial'
  });

  return {
    payment: paymentRecord,
    redirectUrl
  };
};

/**
 * Handles incoming webhooks from MakyPay
 */
exports.handleWebhook = async (payload) => {
  const eventType = payload.event_type; // e.g. collection.completed, collection.failed
  const reference = payload.transaction?.reference;
  const status = payload.transaction?.status; // e.g. completed
  const transactionUuid = payload.transaction?.uuid;
  const providerReference = payload.collection?.provider_reference;

  if (!reference) {
    throw new AppError('Invalid webhook payload, missing reference', 400);
  }

  // 1. Get payment
  const payment = await paymentRepository.findPaymentByReference(reference);
  if (!payment) {
    throw new AppError('Payment not found for reference ' + reference, 404);
  }

  // 2. Update payment status
  const updatedPayment = await paymentRepository.updatePaymentStatus(
    reference, 
    status, 
    providerReference, 
    transactionUuid
  );

  // 3. If completed, update booking status based on payment_type
  if (status === 'completed' && eventType === 'collection.completed') {
    if (payment.payment_type === 'initial') {
      await bookingRepository.updateBookingStatus(payment.booking_id, 'confirmed');
    } else if (payment.payment_type === 'overstay') {
      const booking = await bookingRepository.findBookingById(payment.booking_id);
      if (booking && booking.status === 'active') {
        // Complete the booking and free the slot
        await bookingRepository.completeBooking(booking.id, booking.slot_id, booking.facility_id);
      }
    }
  } else if (status === 'failed' || status === 'cancelled') {
    // We could potentially cancel the booking and free the slot here, 
    // but typically we might just leave it pending and let the user try again, 
    // or run a cron job to expire unpaid pending bookings.
  }

  return updatedPayment;
};

/**
 * Initiates an overstay payment for an active booking
 */
exports.processOverstayPayment = async (driverId, bookingId, paymentMethod, paymentDetails = {}) => {
  // 1. Get booking
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.driver_id !== driverId) {
    throw new AppError('You do not have permission to pay for this booking', 403);
  }

  if (booking.status !== 'active') {
    throw new AppError(`Cannot pay overstay fee for booking with status: ${booking.status}`, 400);
  }

  // Calculate overstay fee
  const now = new Date();
  const endTime = new Date(booking.end_time);
  if (now <= endTime) {
    throw new AppError('No overstay fee required yet', 400);
  }

  const parkingRepository = require('../parking/parking.repository');
  const facility = await parkingRepository.findFacilityById(booking.facility_id);
  const overstayMs = now.getTime() - endTime.getTime();
  const overstayHours = Math.ceil(overstayMs / (1000 * 60 * 60));
  const overstayFee = overstayHours * parseFloat(facility.hourly_rate);

  // 2. Get user phone number
  const user = await userRepository.findById(driverId);
  const phoneNumber = paymentDetails.phone_number ? normalizePhoneNumber(paymentDetails.phone_number) : normalizePhoneNumber(user.phone_number);
  const reference = crypto.randomUUID();

  // 3. Initiate with MakyPay
  const isCard = paymentMethod === 'card';
  const apiMethod = isCard ? 'card' : undefined;

  const paymentResponse = await makyPayService.initiateCollection({
    amount: overstayFee,
    phoneNumber,
    method: apiMethod,
    reference,
    description: `Overstay Payment for booking ${bookingId}`
  });

  const transactionUuid = paymentResponse.data?.transaction?.uuid;
  const redirectUrl = paymentResponse.data?.redirect_url;

  // 4. Save payment record
  const paymentRecord = await paymentRepository.createPayment({
    bookingId,
    driverId,
    amount: overstayFee,
    currency: 'UGX',
    paymentMethod,
    makypayReference: reference,
    redirectUrl,
    transactionUuid,
    paymentType: 'overstay'
  });

  return {
    payment: paymentRecord,
    redirectUrl
  };
};

/**
 * Retrieves payment status for a given booking
 */
exports.getPaymentStatusByBooking = async (bookingId, driverId) => {
  const payments = await paymentRepository.findPaymentByBookingId(bookingId);
  if (payments.length === 0) {
    throw new AppError('No payments found for this booking', 404);
  }

  // Check the most recent payment
  const latestPayment = payments[0];
  
  if (latestPayment.driver_id !== driverId) {
    throw new AppError('You do not have permission to view this payment', 403);
  }

  // Optional: check real MakyPay API if it's still pending
  if (latestPayment.status === 'pending' && latestPayment.makypay_transaction_uuid) {
    const makypayStatus = await makyPayService.checkTransactionStatus(latestPayment.makypay_transaction_uuid);
    if (makypayStatus?.data?.transaction?.status && makypayStatus.data.transaction.status !== 'pending') {
      // Sync it
      await exports.handleWebhook({
        event_type: `collection.${makypayStatus.data.transaction.status}`,
        transaction: makypayStatus.data.transaction
      });
      latestPayment.status = makypayStatus.data.transaction.status;
    }
  }

  return latestPayment;
};

/**
 * Retrieves all payments for a given facility (Owner only)
 */
exports.getFacilityPayments = async (facilityId, ownerId) => {
  const parkingRepository = require('../parking/parking.repository');
  const facility = await parkingRepository.findFacilityById(facilityId);
  
  if (!facility) {
    throw new AppError('Facility not found', 404);
  }
  
  if (facility.owner_id !== ownerId) {
    throw new AppError('You do not have permission to view payments for this facility', 403);
  }

  return await paymentRepository.findPaymentsByFacilityId(facilityId);
};

/**
 * Retrieves all payments for a given driver
 */
exports.getUserPayments = async (driverId) => {
  return await paymentRepository.findPaymentsByDriverId(driverId);
};
