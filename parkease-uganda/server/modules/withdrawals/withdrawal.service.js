const withdrawalRepository = require('./withdrawal.repository');
const { AppError } = require('../../middleware/errorHandler');
const crypto = require('crypto');
// Assuming makyPayService has a mock payout method or we mock it here
// const makyPayService = require('../payments/makypay.service');

exports.initiateWithdrawal = async (ownerId, data) => {
  const { amount, withdrawal_method, mobile_phone, bank_name, bank_account_number, bank_account_name } = data;

  if (amount < 1000) {
    throw new AppError('Minimum withdrawal amount is 1000 UGX', 400);
  }

  // Generate reference
  const reference = crypto.randomUUID();

  // Create withdrawal record, initially unverified
  const withdrawal = await withdrawalRepository.createWithdrawal({
    owner_id: ownerId,
    amount,
    currency: 'UGX',
    withdrawal_method,
    mobile_phone,
    bank_name,
    bank_account_number,
    bank_account_name,
    is_verified: false,
    makypay_reference: reference
  });

  return {
    withdrawal,
    message: withdrawal_method === 'mobile_money' 
      ? 'Please verify your phone number using the OTP sent via SMS.' 
      : 'Please verify your card/bank details.'
  };
};

exports.verifyAndProcessWithdrawal = async (ownerId, withdrawalId, verificationData) => {
  const withdrawal = await withdrawalRepository.findWithdrawalById(withdrawalId);
  if (!withdrawal) {
    throw new AppError('Withdrawal not found', 404);
  }

  if (withdrawal.owner_id !== ownerId) {
    throw new AppError('Unauthorized', 403);
  }

  if (withdrawal.is_verified) {
    throw new AppError('Withdrawal is already verified', 400);
  }

  if (withdrawal.status !== 'pending') {
    throw new AppError(`Cannot verify withdrawal with status: ${withdrawal.status}`, 400);
  }

  // 1. Mock Verification Logic
  const { otp, last4 } = verificationData;
  if (withdrawal.withdrawal_method === 'mobile_money') {
    if (!otp || otp !== '1234') { // Mock OTP check
      throw new AppError('Invalid OTP', 400);
    }
  } else if (withdrawal.withdrawal_method === 'bank') {
    if (!last4 || last4.length !== 4) {
      throw new AppError('Invalid card verification', 400);
    }
  }

  // 2. Mark as verified
  await withdrawalRepository.verifyWithdrawal(withdrawalId);

  // 3. Process the payout (Mock API call to MakyPay or payout provider)
  // Here we would call an API like makyPayService.initiatePayout(...)
  // For now, we simulate processing and then completing it.
  
  await withdrawalRepository.updateWithdrawalStatus(withdrawalId, 'processing');

  // Simulate success after a tiny delay or just complete it instantly for the mock
  setTimeout(async () => {
    try {
      await withdrawalRepository.updateWithdrawalStatus(withdrawalId, 'completed', 'mock-payout-ref-' + Date.now());
    } catch (e) {
      console.error('Mock payout completion failed', e);
    }
  }, 2000);

  return {
    success: true,
    message: 'Withdrawal verified and processing initiated.'
  };
};

exports.getOwnerWithdrawals = async (ownerId) => {
  return await withdrawalRepository.findWithdrawalsByOwner(ownerId);
};
