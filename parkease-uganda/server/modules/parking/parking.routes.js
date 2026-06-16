const express = require('express');
const parkingController = require('./parking.controller');
const { createFacilityValidation, updateFacilityValidation, updateSlotValidation } = require('./parking.validators');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

// --- Public Routes ---
// GET /api/v1/facilities
router.get('/facilities', parkingController.getPublicFacilities);

// GET /api/v1/facilities/my
router.get(
  '/facilities/my',
  authenticate,
  authorize('owner', 'admin'),
  parkingController.getOwnerFacilities
);

// GET /api/v1/facilities/:id
router.get('/facilities/:id', parkingController.getFacilityDetails);

// --- Protected Routes (Owners Only) ---

// POST /api/v1/facilities
router.post(
  '/facilities',
  authenticate,
  authorize('owner', 'admin'),
  validate(createFacilityValidation),
  parkingController.createFacility
);

// PATCH /api/v1/facilities/:id
router.patch(
  '/facilities/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(updateFacilityValidation),
  parkingController.updateFacility
);

// GET /api/v1/facilities/:id/slots
router.get(
  '/facilities/:id/slots',
  authenticate,
  authorize('owner', 'admin'),
  parkingController.getSlotsForOwner
);

// PATCH /api/v1/slots/:id
router.patch(
  '/slots/:id',
  authenticate,
  authorize('owner', 'admin'), // Also 'attendant' could be added here in the future
  validate(updateSlotValidation),
  parkingController.updateSlotStatus
);

// POST /api/v1/facilities/:id/slots
router.post(
  '/facilities/:id/slots',
  authenticate,
  authorize('owner', 'admin'),
  parkingController.addExtraSlot
);

module.exports = router;

//This file contains parking routes.