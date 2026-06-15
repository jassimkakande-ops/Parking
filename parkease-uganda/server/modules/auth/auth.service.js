const { supabaseAdmin } = require('../../config/supabase');
const usersRepository = require('../users/users.repository');

/**
 * Registers a new user via Supabase Auth and creates their profile in public.users.
 */
exports.registerUser = async (userData) => {
  const { email, password, full_name, phone_number, role = 'driver' } = userData;

  // 1. Check if user already exists in our public schema to avoid orphans
  const exists = await usersRepository.existsByEmailOrPhone(email, phone_number);
  if (exists) {
    const err = new Error('A user with this email or phone number already exists.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  // 2. Sign up via Supabase
  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    phone: phone_number,
  });

  if (error) {
    const err = new Error(`Registration failed: ${error.message}`);
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const userId = data.user.id;

  // 3. Insert into our public.users table
  const userProfile = await usersRepository.createUserProfile({
    id: userId,
    full_name,
    email,
    phone_number,
    role
  });

  // Supabase returns a session only if email confirmations are turned off, 
  // otherwise they need to confirm their email first. Assuming auto-confirm is on for now.
  return {
    user: userProfile,
    session: data.session
  };
};

/**
 * Logs in a user via Supabase Auth and returns the JWT session.
 */
exports.loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Sign in via Supabase Admin (or regular client depending on setup)
  // We use signInWithPassword for standard email/password flow
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    err.isOperational = true;
    throw err;
  }

  // Fetch their role from our public table
  const userProfile = await usersRepository.findById(data.user.id);

  if (!userProfile || !userProfile.is_active) {
    const err = new Error('Your account is deactivated or not found.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }

  return {
    user: userProfile,
    session: data.session
  };
};
