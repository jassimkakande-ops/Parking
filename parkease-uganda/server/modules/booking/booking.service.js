const bookingRepository = require('./booking.repository');
const parkingRepository = require('../parking/parking.repository');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Creates a booking
 */
exports.createBooking = async (driverId, data) => {
  const { facility_id, slot_id, vehicle_plate } = data;
  let { start_time, end_time, intended_arrival_time } = data;

  // 1. Validate facility exists
  const facility = await parkingRepository.findFacilityById(facility_id);
  if (!facility) {
    throw new AppError('Facility not found', 404);
  }

  // 2. Calculate time
  const start = new Date(intended_arrival_time || start_time);
  if (Number.isNaN(start.getTime())) {
    throw new AppError('Arrival date and time is required', 400);
  }
  let end;
  if (end_time) {
    end = new Date(end_time);
  } else {
    // Default duration: 1 hour
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  if (end <= start) {
    throw new AppError('End time must be after start time', 400);
  }

  const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  const paidDurationMinutes = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60));
  const totalAmount = durationHours * parseFloat(facility.hourly_rate);

  try {
    const result = await bookingRepository.createBooking(
      driverId, 
      facility_id, 
      slot_id, 
      start, 
      end, 
      totalAmount,
      vehicle_plate,
      paidDurationMinutes
    );
    
    return result;
  } catch (error) {
    if (
      error.message.includes('No available slots') ||
      error.message.includes('already occupied') ||
      error.message.includes('already booked') ||
      error.message.includes('Slot not found')
    ) {
      throw new AppError(error.message, 400);
    }
    throw error;
  }
};

exports.checkInBooking = async (bookingId, userId, userRole) => {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (userRole === 'attendant') {
    const isAssigned = await parkingRepository.isAttendantAssignedToFacility(userId, booking.facility_id);
    if (!isAssigned) {
      throw new AppError('You are not assigned to this facility', 403);
    }
  } else if (userRole === 'owner' && booking.owner_id !== userId) {
    throw new AppError('You do not have permission to check in this booking', 403);
  } else if (userRole !== 'owner' && userRole !== 'admin') {
    throw new AppError('Only owners, admins, and attendants can check in drivers', 403);
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(`Cannot check in booking with status: ${booking.status}`, 400);
  }

  const facility = await parkingRepository.findFacilityById(booking.facility_id);
  const checkedInAt = new Date();
  const paidMinutes = Number(booking.paid_duration_minutes || 60);
  const endTime = new Date(checkedInAt.getTime() + paidMinutes * 60 * 1000);

  const intendedArrival = new Date(booking.intended_arrival_time || booking.start_time);
  const lateMs = checkedInAt.getTime() - intendedArrival.getTime();
  const lateHours = lateMs > 0 ? Math.ceil(lateMs / (1000 * 60 * 60)) : 0;
  const holdingFee = lateHours * parseFloat(facility.hourly_rate || 0);

  try {
    const checkedIn = await bookingRepository.checkInBooking(
      bookingId,
      booking.slot_id,
      booking.facility_id,
      booking.vehicle_plate,
      checkedInAt,
      endTime,
      holdingFee
    );

    return {
      booking: checkedIn,
      holdingFee,
      lateHours
    };
  } catch (error) {
    if (error.message.includes('already occupied')) {
      throw new AppError(error.message, 400);
    }
    throw error;
  }
};

/**
 * Gets bookings for the authenticated user (driver)
 */
exports.getUserBookings = async (driverId) => {
  return await bookingRepository.findUserBookings(driverId);
};

/**
 * Gets bookings for a facility (must be owner)
 */
exports.getFacilityBookings = async (facilityId, ownerId) => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility) {
    throw new AppError('Facility not found', 404);
  }
  
  if (facility.owner_id !== ownerId) {
    throw new AppError('You do not have permission to view bookings for this facility', 403);
  }

  return await bookingRepository.findFacilityBookings(facilityId);
};

/**
 * Gets booking details
 */
exports.getBookingDetails = async (bookingId, userId, userRole) => {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Drivers can only see their own bookings. Owners can see bookings for their facilities. Admins can see all.
  if (userRole === 'driver' && booking.driver_id !== userId) {
    throw new AppError('You do not have permission to view this booking', 403);
  }
  
  if (userRole === 'owner' && booking.owner_id !== userId) {
    throw new AppError('You do not have permission to view this booking', 403);
  }

  return booking;
};

/**
 * Cancels a booking
 */
exports.cancelBooking = async (bookingId, userId, userRole) => {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.status === 'cancelled') {
    throw new AppError('Booking is already cancelled', 400);
  }

  if (booking.status === 'active' || booking.status === 'completed') {
    throw new AppError('Only bookings that have not started can be cancelled', 400);
  }

  // Authorization check
  if (userRole === 'driver' && booking.driver_id !== userId) {
    throw new AppError('You do not have permission to cancel this booking', 403);
  }
  
  if (userRole === 'owner' && booking.owner_id !== userId) {
    throw new AppError('You do not have permission to cancel this booking in your facility', 403);
  }

  return await bookingRepository.cancelBooking(bookingId, booking.slot_id, booking.facility_id);
};

/**
 * Checks out a booking
 * Calculates overstay fee if end_time has passed.
 * Otherwise completes the booking and frees the slot.
 */
exports.checkoutBooking = async (bookingId, userId, userRole, options = {}) => {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.status !== 'active') {
    throw new AppError(`Cannot checkout booking with status: ${booking.status}`, 400);
  }

  if (userRole === 'attendant') {
    const isAssigned = await parkingRepository.isAttendantAssignedToFacility(userId, booking.facility_id);
    if (!isAssigned) {
      throw new AppError('You are not assigned to this facility', 403);
    }
  } else if (userRole === 'owner' && booking.owner_id !== userId) {
    throw new AppError('You do not have permission to checkout this booking in your facility', 403);
  } else if (userRole === 'driver') {
    throw new AppError('Only owners, admins, and attendants can checkout drivers', 403);
  }

  const now = new Date();
  const endTime = new Date(booking.end_time);

  const overstayMs = now.getTime() - endTime.getTime();
  const overstayHours = overstayMs > 0 ? Math.ceil(overstayMs / (1000 * 60 * 60)) : 0;
  
  // Fetch facility rate
  const facility = await parkingRepository.findFacilityById(booking.facility_id);
  const hourlyRate = parseFloat(facility.hourly_rate);
  const overstayFee = overstayHours * hourlyRate;
  const holdingFee = parseFloat(booking.holding_fee_amount || 0);

  const totalFeeDue = overstayFee + holdingFee;

  if (totalFeeDue === 0 || options.force_cash) {
    // If no fee due or owner forced cash payment, complete it now
    const completed = await bookingRepository.completeBooking(bookingId, booking.slot_id, booking.facility_id, now);
    return {
      booking: completed,
      overstayFee,
      holdingFee,
      totalFeeDue: 0,
      forcedCash: options.force_cash || false
    };
  } else {
    // The booking is not completed yet. We return the fee required.
    // The user must initiate an overstay/holding payment.
    return {
      booking,
      overstayFee,
      holdingFee,
      totalFeeDue,
      overstayHours
    };
  }
};
