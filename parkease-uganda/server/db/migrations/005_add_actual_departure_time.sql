-- Add actual_departure_time to bookings table
ALTER TABLE bookings
ADD COLUMN actual_departure_time TIMESTAMP WITH TIME ZONE;
