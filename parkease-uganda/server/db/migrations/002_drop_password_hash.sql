-- 002_drop_password_hash.sql
-- We are using Supabase Auth natively, so the Express server no longer 
-- needs to hash or store passwords in the public.users table.
-- Supabase manages passwords securely in its own auth.users table.

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Note: We keep email and phone_number in the public.users table 
-- because it's convenient for profile lookups and joins, even though 
-- they are also stored in auth.users.
