const express = require('express');
const authController = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validators');
const validate = require('../../middleware/validate');

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerValidation), authController.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginValidation), authController.login);

// GET /api/v1/auth/public-config
router.get('/public-config', authController.publicConfig);

// POST /api/v1/auth/oauth-profile
router.post('/oauth-profile', authController.oauthProfile);

module.exports = router;
