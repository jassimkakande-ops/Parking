-- 007_add_attendant_role.sql

CREATE TABLE IF NOT EXISTS facility_attendants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES parking_facilities(id) ON DELETE CASCADE,
    attendant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attendant_id) -- An attendant can only be assigned to ONE facility
);

-- We don't use ALTER TYPE inside a standard transaction block safely in older Postgres, 
-- so it's done via alter_enum_attendant.js.
