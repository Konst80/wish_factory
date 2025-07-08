-- Create user_settings table for storing user preferences
CREATE TABLE user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile settings
    language VARCHAR(2) DEFAULT 'de',
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    new_wish_alerts BOOLEAN DEFAULT true,
    approval_requests BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT false,
    weekly_report BOOLEAN DEFAULT true,
    
    -- Preference settings
    theme VARCHAR(20) DEFAULT 'light',
    dashboard_layout VARCHAR(20) DEFAULT 'grid',
    wishes_per_page INTEGER DEFAULT 25,
    auto_save BOOLEAN DEFAULT true,
    confirm_before_delete BOOLEAN DEFAULT true,
    
    -- System settings
    api_access BOOLEAN DEFAULT false,
    export_format VARCHAR(10) DEFAULT 'json',
    backup_frequency VARCHAR(20) DEFAULT 'daily',
    data_retention INTEGER DEFAULT 365,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient user lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Create unique constraint to ensure one settings record per user
ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user settings
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();