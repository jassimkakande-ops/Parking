const express = require('express');
const authController = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validators');
const validate = require('../../middleware/validate');

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerValidation), authController.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginValidation), authController.login);

module.exports = router;
