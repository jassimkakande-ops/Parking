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

exports.updateSlotStatus = async (slotId, isOccupied, vehiclePlate, ownerId) => {
  // 1. Verify slot exists and belongs to owner
  const slot = await parkingRepository.findSlotById(slotId);
  if (!slot) {
    const err = new Error('Slot not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const facility = await parkingRepository.findFacilityById(slot.facility_id);
  if (!facility || facility.owner_id !== ownerId) {
    const err = new Error('Access denied to update this slot.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
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
