const express = require('express');
const attendantsController = require('./attendants.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

router.get(
  '/dashboard',
  authenticate,
  authorize('attendant'),
  attendantsController.getDashboardAnalytics
);

module.exports = router;
