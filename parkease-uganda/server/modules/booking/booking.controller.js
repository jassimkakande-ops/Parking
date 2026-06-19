const bookingService = require('./booking.service');
const { successResponse } = require('../../utils/apiResponse');
const logger = require('../../utils/logger');

exports.createBooking = async (req, res, next) => {
  try {
    const driverId = req.user.id;
    const result = await bookingService.createBooking(driverId, req.body);
    
    let message = 'Booking created successfully';
    if (result.autoAssigned) {
      message += '. A slot was automatically assigned to you.';
    }

    res.status(201).json(successResponse(result.booking, message));
  } catch (error) {
    next(error);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const driverId = req.user.id;
    const bookings = await bookingService.getUserBookings(driverId);
    res.status(200).json(successResponse(bookings));
  } catch (error) {
    next(error);
  }
};

exports.getFacilityBookings = async (req, res, next) => {
  try {
    const facilityId = req.params.facilityId;
    const ownerId = req.user.id;
    const bookings = await bookingService.getFacilityBookings(facilityId, ownerId);
    res.status(200).json(successResponse(bookings));
  } catch (error) {
    next(error);
  }
};

exports.getBookingDetails = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await bookingService.getBookingDetails(bookingId, req.user.id, req.user.role);
    res.status(200).json(successResponse(booking));
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const canceledBooking = await bookingService.cancelBooking(bookingId, userId, userRole);
    res.status(200).json(successResponse(canceledBooking, 'Booking cancelled successfully'));
  } catch (error) {
    next(error);
  }
};

exports.checkInBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const result = await bookingService.checkInBooking(bookingId, req.user.id, req.user.role);

    let message = 'Driver checked in successfully.';
    if (result.holdingFee > 0) {
      message = `Driver checked in successfully. Holding fee due: ${result.holdingFee} UGX.`;
    }

    res.status(200).json(successResponse(result, message));
  } catch (error) {
    next(error);
  }
};

exports.checkoutBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const options = {
      force_cash: req.body.force_cash || false
    };

    const result = await bookingService.checkoutBooking(bookingId, userId, userRole, options);
    
    let message = 'Checkout successful.';
    if (result.totalFeeDue > 0) {
      message = `Checkout initiated. Please pay the total fee of ${result.totalFeeDue} UGX to complete.`;
    }

    res.status(200).json(successResponse(result, message));
  } catch (error) {
    next(error);
  }
};

exports.getFacilityDrivers = async (req, res, next) => {
  try {
    const facilityId = req.params.facilityId;
    const ownerId = req.user.id;

    // Verify facility ownership
    const parkingRepository = require('../parking/parking.repository');
    const facility = await parkingRepository.findFacilityById(facilityId);
    
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }
    
    if (facility.owner_id !== ownerId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view drivers for this facility' });
    }

    const usersRepository = require('../users/users.repository');
    const drivers = await usersRepository.findDriversByFacility(facilityId);
    
    res.status(200).json(successResponse(drivers));
  } catch (error) {
    next(error);
  }
};
