-- 001_initial_schema_rollback.sql
-- Run this to completely undo the changes made by 001_initial_schema.sql

-- 1. Drop Tables (in reverse order of creation due to foreign key dependencies)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS parking_facilities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Drop Enum Types
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 3. Drop Functions (Triggers are automatically dropped when the tables are dropped)
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;

-- Note: We generally do NOT drop the "uuid-ossp" extension because it might 
-- be used by other parts of your database or was already installed. 
-- However, if you are absolutely sure you want to drop it, uncomment the line below:
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
