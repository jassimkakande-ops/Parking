const parkingRepository = require('./parking.repository');

exports.createFacility = async (ownerId, data) => {
  return await parkingRepository.createFacility(ownerId, data);
};

exports.updateFacility = async (facilityId, ownerId, data) => {
  const facility = await parkingRepository.updateFacility(facilityId, ownerId, data);
  if (!facility) {
    const err = new Error('Facility not found or you do not have permission to update it.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }
  return facility;
};

exports.getPublicFacilities = async (requireAvailable) => {
  return await parkingRepository.findFacilities(requireAvailable);
};

exports.getOwnerFacilities = async (ownerId) => {
  return await parkingRepository.findFacilitiesByOwnerId(ownerId);
};

exports.getFacilityDetails = async (facilityId) => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility || !facility.is_active) {
    const err = new Error('Facility not found or inactive.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Also fetch slots to provide a complete view
  const slots = await parkingRepository.getFacilitySlots(facilityId);
  return { ...facility, slots };
};

exports.getFacilityAvailability = async (facilityId, startTime, endTime) => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility || !facility.is_active) {
    const err = new Error('Facility not found or inactive.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }
  return await parkingRepository.getFacilityAvailability(facilityId, startTime, endTime);
};

exports.getSlotsForOwner = async (facilityId, ownerId) => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility || facility.owner_id !== ownerId) {
    const err = new Error('Facility not found or access denied.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }
  return await parkingRepository.getFacilitySlots(facilityId);
};

exports.updateSlotStatus = async (slotId, isOccupied, vehiclePlate, userId, userRole) => {
  // 1. Verify slot exists
  const slot = await parkingRepository.findSlotById(slotId);
  if (!slot) {
    const err = new Error('Slot not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const facility = await parkingRepository.findFacilityById(slot.facility_id);
  if (!facility) {
    const err = new Error('Facility not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (userRole === 'owner' && facility.owner_id !== userId) {
    const err = new Error('Access denied to update this slot.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }

  if (userRole === 'attendant') {
    const isAssigned = await parkingRepository.isAttendantAssignedToFacility(userId, facility.id);
    if (!isAssigned) {
      const err = new Error('You are not assigned to manage this facility.');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }
  }

  // 2. Perform the update
  return await parkingRepository.updateSlotStatus(slotId, facility.id, isOccupied, vehiclePlate);
};

exports.addExtraSlot = async (facilityId, ownerId, type = 'car') => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility || facility.owner_id !== ownerId) {
    const err = new Error('Facility not found or access denied.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }
  return await parkingRepository.addExtraSlot(facilityId, type);
};

exports.getFacilityOwnerAnalytics = async (facilityId) => {
  return await parkingRepository.getFacilityOwnerAnalytics(facilityId);
};

exports.addAttendantToFacility = async (facilityId, ownerId, email) => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility || facility.owner_id !== ownerId) {
    const err = new Error('Facility not found or access denied.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }
  const usersRepository = require('../users/users.repository');
  const user = await usersRepository.findByEmail(email);
  if (!user) {
    const err = new Error('User with this email not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }
  // Change their role to attendant if they are a driver
  if (user.role === 'driver') {
    await usersRepository.updateUserRole(user.id, 'attendant');
  } else if (user.role !== 'attendant' && user.role !== 'owner' && user.role !== 'admin') {
    const err = new Error(`Cannot assign user with role ${user.role} as attendant.`);
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  return await parkingRepository.assignAttendant(facilityId, user.id, ownerId);
};

exports.getFacilityAttendants = async (facilityId, ownerId) => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility || facility.owner_id !== ownerId) {
    const err = new Error('Facility not found or access denied.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }
  return await parkingRepository.getFacilityAttendants(facilityId);
};

exports.removeAttendant = async (facilityId, ownerId, attendantId) => {
  const facility = await parkingRepository.findFacilityById(facilityId);
  if (!facility || facility.owner_id !== ownerId) {
    const err = new Error('Facility not found or access denied.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }
  return await parkingRepository.removeAttendant(facilityId, attendantId);
};
