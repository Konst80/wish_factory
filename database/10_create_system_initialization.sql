-- System Initialization Table
-- Tracks whether the system has been initialized with an admin user
-- This ensures the setup process can only be completed once

CREATE TABLE IF NOT EXISTS system_initialization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    admin_email TEXT NOT NULL,
    admin_full_name TEXT NOT NULL,
    setup_completed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure only one initialization record can exist
    CONSTRAINT single_initialization CHECK (id IS NOT NULL)
);

-- Create unique index to enforce single initialization
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_initialization_singleton 
ON system_initialization ((1));

-- Enable RLS for security
ALTER TABLE system_initialization ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated users can read initialization status
CREATE POLICY "Allow authenticated users to read initialization status"
ON system_initialization FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Only service role can insert initialization records
CREATE POLICY "Allow service role to insert initialization"
ON system_initialization FOR INSERT
TO service_role
WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE system_initialization IS 'Tracks system initialization status to ensure admin setup is only performed once';
COMMENT ON COLUMN system_initialization.admin_user_id IS 'References the first admin user created during setup';
COMMENT ON COLUMN system_initialization.setup_completed IS 'Always true - existence of record indicates setup completion';