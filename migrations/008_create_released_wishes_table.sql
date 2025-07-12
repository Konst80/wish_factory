-- Migration: Create released_wishes table
-- This migration creates a separate table for wishes that have been released for public access by WishSnapp

-- Create released_wishes table
CREATE TABLE IF NOT EXISTS released_wishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('normal', 'herzlich', 'humorvoll')),
    event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'anniversary', 'custom')),
    relations TEXT[] NOT NULL CHECK (array_length(relations, 1) > 0),
    age_groups TEXT[] NOT NULL CHECK (array_length(age_groups, 1) > 0),
    specific_values INTEGER[] DEFAULT '{}',
    text TEXT NOT NULL CHECK (length(text) >= 10 AND length(text) <= 1000),
    belated BOOLEAN NOT NULL DEFAULT false,
    language TEXT NOT NULL CHECK (language IN ('de', 'en')),
    length TEXT NOT NULL CHECK (length IN ('short', 'medium', 'long')),
    released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_by UUID NOT NULL,
    
    -- Ensure no duplicate releases of the same wish
    UNIQUE(original_wish_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_released_wishes_type ON released_wishes(type);
CREATE INDEX IF NOT EXISTS idx_released_wishes_event_type ON released_wishes(event_type);
CREATE INDEX IF NOT EXISTS idx_released_wishes_language ON released_wishes(language);
CREATE INDEX IF NOT EXISTS idx_released_wishes_length ON released_wishes(length);
CREATE INDEX IF NOT EXISTS idx_released_wishes_belated ON released_wishes(belated);
CREATE INDEX IF NOT EXISTS idx_released_wishes_released_at ON released_wishes(released_at DESC);

-- Create GIN indexes for array columns for efficient filtering
CREATE INDEX IF NOT EXISTS idx_released_wishes_relations ON released_wishes USING GIN(relations);
CREATE INDEX IF NOT EXISTS idx_released_wishes_age_groups ON released_wishes USING GIN(age_groups);
CREATE INDEX IF NOT EXISTS idx_released_wishes_specific_values ON released_wishes USING GIN(specific_values);

-- Add comment to table
COMMENT ON TABLE released_wishes IS 'Immutable snapshots of wishes released for public access by WishSnapp';
COMMENT ON COLUMN released_wishes.original_wish_id IS 'Reference to the original wish that was released';
COMMENT ON COLUMN released_wishes.released_at IS 'Timestamp when the wish was released';
COMMENT ON COLUMN released_wishes.released_by IS 'User who released the wish';