const withdrawalService = require('./withdrawal.service');
const { successResponse } = require('../../utils/apiResponse');

exports.initiateWithdrawal = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const result = await withdrawalService.initiateWithdrawal(ownerId, req.body);
    res.status(201).json(successResponse(result, result.message));
  } catch (error) {
    next(error);
  }
};

exports.verifyWithdrawal = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const withdrawalId = req.params.id;
    const verificationData = req.body;

    const result = await withdrawalService.verifyAndProcessWithdrawal(ownerId, withdrawalId, verificationData);
    res.status(200).json(successResponse(result, result.message));
  } catch (error) {
    next(error);
  }
};

exports.getWithdrawals = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const withdrawals = await withdrawalService.getOwnerWithdrawals(ownerId);
    res.status(200).json(successResponse(withdrawals));
  } catch (error) {
    next(error);
  }
};
