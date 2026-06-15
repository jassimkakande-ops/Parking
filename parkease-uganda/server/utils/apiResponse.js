/**
 * Formats a successful API response.
 * @param {object} data - The payload to return.
 * @returns {object} Formatted success response.
 */
exports.successResponse = (data) => {
  return {
    success: true,
    data,
  };
};

/**
 * Formats an error API response.
 * @param {string} message - User-friendly error message.
 * @returns {object} Formatted error response.
 */
exports.errorResponse = (message) => {
  return {
    success: false,
    message,
  };
};
