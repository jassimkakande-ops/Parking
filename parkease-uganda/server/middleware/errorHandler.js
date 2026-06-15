const logger = require('../utils/logger');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Centralized error handler middleware.
 * All errors must flow through here.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error internally
  logger.error(err.message || 'Internal Server Error', {
    module: 'errorHandler',
    userId: req.user?.id,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Determine the status code
  const statusCode = err.statusCode || 500;
  
  // Provide a sanitized user-friendly message
  let userFriendlyMessage = err.isOperational 
    ? err.message 
    : 'Something went wrong on our end. Please try again later.';

  // If it's a known database error or similar, we might map it to a specific message, 
  // but by default, operational errors pass their message, others get a generic message.

  res.status(statusCode).json(errorResponse(userFriendlyMessage));
};

const AppError = require('../utils/AppError');

module.exports = errorHandler;
module.exports.AppError = AppError;
