const bookingRepository = require('./booking.repository');
const parkingRepository = require('../parking/parking.repository');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Creates a booking
 */
exports.createBooking = async (driverId, data) => {
  const { facility_id, slot_id, vehicle_plate } = data;
  let { start_time, end_time } = data;

  // 1. Validate facility exists
  const facility = await parkingRepository.findFacilityById(facility_id);
  if (!facility) {
    throw new AppError('Facility not found', 404);
  }

  // 2. Calculate time
  const start = start_time ? new Date(start_time) : new Date();
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

  // 3. Calculate amount
  const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  const totalAmount = durationHours * parseFloat(facility.hourly_rate);

  // 4. Create booking (transaction handles slot assignment and decrement)
  try {
    const result = await bookingRepository.createBooking(
      driverId, 
      facility_id, 
      slot_id, 
      start, 
      end, 
      totalAmount,
      vehicle_plate
    );
    
    return result;
  } catch (error) {
    if (error.message.includes('No available slots') || error.message.includes('already occupied') || error.message.includes('Slot not found')) {
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

  if (userRole === 'driver' && booking.driver_id !== userId) {
    throw new AppError('You do not have permission to checkout this booking', 403);
  }
  
  if (userRole === 'owner' && booking.owner_id !== userId) {
    throw new AppError('You do not have permission to checkout this booking in your facility', 403);
  }

  const now = new Date();
  const endTime = new Date(booking.end_time);

  if (now <= endTime || options.force_cash) {
    // If no overstay or owner forced cash payment, complete it now
    const completed = await bookingRepository.completeBooking(bookingId, booking.slot_id, booking.facility_id, now);
    return {
      booking: completed,
      overstayFee: 0,
      forcedCash: options.force_cash || false
    };
  } else {
    // Calculate overstay fee
    const overstayMs = now.getTime() - endTime.getTime();
    const overstayHours = Math.ceil(overstayMs / (1000 * 60 * 60));
    
    // Fetch facility rate
    const facility = await parkingRepository.findFacilityById(booking.facility_id);
    const hourlyRate = parseFloat(facility.hourly_rate);
    const overstayFee = overstayHours * hourlyRate;

    // The booking is not completed yet. We return the fee required.
    // The user must initiate an overstay payment.
    return {
      booking,
      overstayFee,
      overstayHours
    };
  }
};
