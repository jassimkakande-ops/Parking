const db = require('../../config/db');

exports.createWithdrawal = async (withdrawalData) => {
  const {
    owner_id,
    amount,
    currency,
    withdrawal_method,
    mobile_phone,
    bank_name,
    bank_account_number,
    bank_account_name,
    is_verified,
    makypay_reference
  } = withdrawalData;

  const query = `
    INSERT INTO withdrawals (
      owner_id, amount, currency, withdrawal_method, mobile_phone, 
      bank_name, bank_account_number, bank_account_name, is_verified, makypay_reference
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const values = [
    owner_id, amount, currency || 'UGX', withdrawal_method, mobile_phone,
    bank_name, bank_account_number, bank_account_name, is_verified || false, makypay_reference
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
};

exports.findWithdrawalById = async (id) => {
  const query = `SELECT * FROM withdrawals WHERE id = $1`;
  const { rows } = await db.query(query, [id]);
  return rows[0] || null;
};

exports.findWithdrawalByReference = async (reference) => {
  const query = `SELECT * FROM withdrawals WHERE makypay_reference = $1`;
  const { rows } = await db.query(query, [reference]);
  return rows[0] || null;
};

exports.findWithdrawalsByOwner = async (ownerId) => {
  const query = `SELECT * FROM withdrawals WHERE owner_id = $1 ORDER BY initiated_at DESC`;
  const { rows } = await db.query(query, [ownerId]);
  return rows;
};

exports.updateWithdrawalStatus = async (id, status, providerReference = null, note = null) => {
  const completedAt = status === 'completed' ? new Date() : null;
  const query = `
    UPDATE withdrawals
    SET status = $1,
        provider_reference = COALESCE($2, provider_reference),
        completed_at = COALESCE($3, completed_at),
        note = COALESCE($4, note)
    WHERE id = $5
    RETURNING *
  `;
  const { rows } = await db.query(query, [status, providerReference, completedAt, note, id]);
  return rows[0] || null;
};

exports.verifyWithdrawal = async (id) => {
  const query = `
    UPDATE withdrawals
    SET is_verified = true
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await db.query(query, [id]);
  return rows[0] || null;
};
