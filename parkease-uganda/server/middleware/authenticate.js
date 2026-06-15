const { supabaseAdmin } = require('../config/supabase');
const { errorResponse } = require('../utils/apiResponse');
const usersRepository = require('../modules/users/users.repository');
const logger = require('../utils/logger');

/**
 * Middleware to verify Supabase JWT token and attach user to request.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Authentication token is missing or invalid.'));
    }

    const token = authHeader.split(' ')[1];

    // Verify token using Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn('Failed JWT verification', { module: 'authenticate', error: error?.message });
      return res.status(401).json(errorResponse('Invalid or expired token.'));
    }

    // Fetch the user's role from our public.users table
    const dbUser = await usersRepository.findById(user.id);
    if (!dbUser || !dbUser.is_active) {
      return res.status(403).json(errorResponse('User profile not found or inactive.'));
    }

    // Attach user payload to request
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      fullName: dbUser.full_name
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
