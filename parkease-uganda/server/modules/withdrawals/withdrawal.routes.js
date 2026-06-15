const express = require('express');
const withdrawalController = require('./withdrawal.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');

const router = express.Router();

const initiateValidation = [
  body('amount').isNumeric().withMessage('Amount must be numeric'),
  body('withdrawal_method').isIn(['mobile_money', 'bank']).withMessage('Method must be mobile_money or bank')
];

router.use(authenticate);
router.use(authorize('owner', 'admin'));

router.post('/initiate', validate(initiateValidation), withdrawalController.initiateWithdrawal);
router.post('/:id/verify', withdrawalController.verifyWithdrawal);
router.get('/', withdrawalController.getWithdrawals);

module.exports = router;
