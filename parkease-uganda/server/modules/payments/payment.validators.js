const { body } = require('express-validator');

exports.initiatePaymentValidation = [
  body('booking_id').trim().isUUID().withMessage('Valid booking_id is required.'),
  body('payment_method')
    .trim()
    .isIn(['mtn_momo', 'airtel_money', 'card', 'cash'])
    .withMessage('Valid payment_method is required (mtn_momo, airtel_money, card, cash).'),
  body('phone_number').optional().trim().isString(),
  body('card_number').optional().trim().isString(),
  body('card_expiry').optional().trim().isString(),
  body('card_cvv').optional().trim().isString(),
  body('bank_account').optional().trim().isString()
];
