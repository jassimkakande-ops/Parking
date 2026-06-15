const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware runner for express-validator validation chains.
 * Rejects the request with 400 Bad Request if any validation errors are found.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Extract the first error message to display a clean message to the user
    const firstErrorMessage = errors.array()[0].msg;
    return res.status(400).json(errorResponse(firstErrorMessage));
  };
};

module.exports = validate;
