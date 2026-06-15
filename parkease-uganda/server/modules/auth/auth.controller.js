const authService = require('./auth.service');
const { successResponse } = require('../../utils/apiResponse');

/**
 * Handles user registration request.
 */
exports.register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login request.
 */
exports.login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
