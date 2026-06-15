-- 004_add_payment_type_and_withdrawals.sql

-- Enum for distinguishing initial booking payment from overstay fee payment
CREATE TYPE payment_type AS ENUM ('initial', 'overstay');

-- Add payment_type to existing payments table (default 'initial' for all existing rows)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_type payment_type NOT NULL DEFAULT 'initial';

-- Enum for withdrawal status
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Enum for withdrawal method
CREATE TYPE withdrawal_method AS ENUM ('mobile_money', 'bank');

-- Withdrawals table for owner payouts
CREATE TABLE withdrawals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Amount and currency
    amount              DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency            VARCHAR(10) NOT NULL DEFAULT 'UGX',

    -- Method
    withdrawal_method   withdrawal_method NOT NULL,

    -- Mobile money fields (used when withdrawal_method = 'mobile_money')
    mobile_phone        VARCHAR(50),

    -- Bank fields (used when withdrawal_method = 'bank')
    bank_name           VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_account_name   VARCHAR(255),

    -- Verification
    -- For mobile money: OTP verified flag
    -- For bank: card last 4 digits verified flag
    is_verified         BOOLEAN NOT NULL DEFAULT false,

    -- MakyPay / gateway references
    makypay_reference   VARCHAR(255) UNIQUE,
    provider_reference  VARCHAR(255),

    -- Status tracking
    status              withdrawal_status NOT NULL DEFAULT 'pending',
    initiated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP WITH TIME ZONE,

    -- Audit note (e.g. reason for failure)
    note                TEXT
);

CREATE TRIGGER update_withdrawals_modtime
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
