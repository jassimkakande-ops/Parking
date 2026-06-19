-- Booking timing fields for arrival/check-in/checkout based parking.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS intended_arrival_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS paid_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS holding_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(50);

-- Existing bookings used start_time as the intended start. Backfill so older
-- rows still render correctly after the new flow is deployed.
UPDATE bookings
SET intended_arrival_time = COALESCE(intended_arrival_time, start_time),
    paid_duration_minutes = COALESCE(
      paid_duration_minutes,
      GREATEST(60, CEIL(EXTRACT(EPOCH FROM (COALESCE(end_time, start_time + INTERVAL '1 hour') - start_time)) / 60)::INT)
    )
WHERE intended_arrival_time IS NULL OR paid_duration_minutes IS NULL;

ALTER TABLE bookings
  ALTER COLUMN intended_arrival_time SET NOT NULL,
  ALTER COLUMN paid_duration_minutes SET NOT NULL;

-- Google OAuth accounts may not provide a phone number at sign-in time.
ALTER TABLE users
  ALTER COLUMN phone_number DROP NOT NULL;
