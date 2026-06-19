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

exports.publicConfig = async (req, res, next) => {
  try {
    const result = authService.getPublicConfig();
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

exports.oauthProfile = async (req, res, next) => {
  try {
    const result = await authService.getOrCreateOAuthProfile(req.body.access_token, req.body.role);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
