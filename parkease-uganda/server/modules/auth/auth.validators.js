const { body } = require('express-validator');

exports.registerValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^256[0-9]{9}$/).withMessage('Phone number must be in the format 256XXXXXXXXX (12 digits).'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('role')
    .optional()
    .isIn(['driver', 'owner']).withMessage('Role must be either driver or owner.')
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
];
