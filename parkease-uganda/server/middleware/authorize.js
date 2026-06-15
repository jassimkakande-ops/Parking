const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to restrict endpoint access based on user roles.
 * @param {...string} allowedRoles - List of roles that are allowed to access the endpoint.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json(errorResponse('Unauthorized access.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('You do not have permission to perform this action.'));
    }

    next();
  };
};

module.exports = authorize;
