-- Migration: Create API Keys table for securing public endpoints
-- File: 009_create_api_keys_table.sql

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL, -- First 8 characters for identification
    description TEXT,
    
    -- Permissions & Limits
    is_active BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    allowed_endpoints TEXT[] DEFAULT ARRAY['/api/public/wishes'],
    
    -- Usage tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_requests INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration
);

-- Indexes for performance
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- RLS Policies (only admins can manage API keys)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view API keys" ON api_keys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Administrator'
        )
    );

CREATE POLICY "Only admins can manage API keys" ON api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Administrator'
        )
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- Create a default API key for WishSnap app (example)
INSERT INTO api_keys (
    name, 
    key_hash, 
    key_prefix, 
    description,
    rate_limit_per_hour
) VALUES (
    'WishSnap Mobile App',
    '$2b$10$placeholder.hash.will.be.replaced.by.real.implementation',
    'wsk_demo',
    'Official WishSnap mobile application API access',
    2000
) ON CONFLICT DO NOTHING;