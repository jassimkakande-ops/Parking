const parkingService = require('./parking.service');
const { successResponse } = require('../../utils/apiResponse');

exports.createFacility = async (req, res, next) => {
  try {
    // req.user.id is populated by authenticate middleware
    const facility = await parkingService.createFacility(req.user.id, req.body);
    res.status(201).json(successResponse(facility));
  } catch (error) {
    next(error);
  }
};

exports.updateFacility = async (req, res, next) => {
  try {
    const facility = await parkingService.updateFacility(req.params.id, req.user.id, req.body);
    res.status(200).json(successResponse(facility));
  } catch (error) {
    next(error);
  }
};

exports.getPublicFacilities = async (req, res, next) => {
  try {
    const requireAvailable = req.query.available === 'true';
    const facilities = await parkingService.getPublicFacilities(requireAvailable);
    res.status(200).json(successResponse(facilities));
  } catch (error) {
    next(error);
  }
};

exports.getOwnerFacilities = async (req, res, next) => {
  try {
    const facilities = await parkingService.getOwnerFacilities(req.user.id);
    res.status(200).json(successResponse(facilities));
  } catch (error) {
    next(error);
  }
};

exports.getFacilityDetails = async (req, res, next) => {
  try {
    const details = await parkingService.getFacilityDetails(req.params.id);
    res.status(200).json(successResponse(details));
  } catch (error) {
    next(error);
  }
};

exports.getFacilityAvailability = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'start and end times are required' });
    }
    const availability = await parkingService.getFacilityAvailability(req.params.id, start, end);
    res.status(200).json(successResponse(availability));
  } catch (error) {
    next(error);
  }
};

exports.getSlotsForOwner = async (req, res, next) => {
  try {
    const slots = await parkingService.getSlotsForOwner(req.params.id, req.user.id);
    res.status(200).json(successResponse(slots));
  } catch (error) {
    next(error);
  }
};

exports.updateSlotStatus = async (req, res, next) => {
  try {
    const { is_occupied, vehicle_plate } = req.body;
    const slot = await parkingService.updateSlotStatus(req.params.id, is_occupied, vehicle_plate, req.user.id, req.user.role);
    res.status(200).json(successResponse(slot));
  } catch (error) {
    next(error);
  }
};

exports.addExtraSlot = async (req, res, next) => {
  try {
    const facilityId = req.params.id;
    const ownerId = req.user.id;
    const { type } = req.body;
    const slot = await parkingService.addExtraSlot(facilityId, type);
    res.status(201).json(successResponse(slot, 'Extra slot added'));
  } catch (error) {
    next(error);
  }
};

exports.getFacilityOwnerAnalytics = async (req, res, next) => {
  try {
    const facilityId = req.params.id;
    const analytics = await parkingService.getFacilityOwnerAnalytics(facilityId);
    res.status(200).json(successResponse(analytics));
  } catch (error) {
    next(error);
  }
};

exports.addAttendant = async (req, res, next) => {
  try {
    const facilityId = req.params.id;
    const ownerId = req.user.id;
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const result = await parkingService.addAttendantToFacility(facilityId, ownerId, email);
    res.status(201).json(successResponse(result, 'Attendant assigned successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getAttendants = async (req, res, next) => {
  try {
    const facilityId = req.params.id;
    const ownerId = req.user.id;
    const attendants = await parkingService.getFacilityAttendants(facilityId, ownerId);
    res.status(200).json(successResponse(attendants));
  } catch (error) {
    next(error);
  }
};

exports.removeAttendant = async (req, res, next) => {
  try {
    const facilityId = req.params.id;
    const attendantId = req.params.attendantId;
    const ownerId = req.user.id;
    await parkingService.removeAttendant(facilityId, ownerId, attendantId);
    res.status(200).json(successResponse(null, 'Attendant removed successfully'));
  } catch (error) {
    next(error);
  }
};
