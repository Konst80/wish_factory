-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Profile settings
    language TEXT DEFAULT 'de',
    timezone TEXT DEFAULT 'Europe/Berlin',
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    new_wish_alerts BOOLEAN DEFAULT true,
    approval_requests BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT false,
    weekly_report BOOLEAN DEFAULT true,
    
    -- Preference settings
    theme TEXT DEFAULT 'light',
    dashboard_layout TEXT DEFAULT 'grid',
    wishes_per_page INTEGER DEFAULT 25,
    auto_save BOOLEAN DEFAULT true,
    confirm_before_delete BOOLEAN DEFAULT true,
    
    -- System settings (admin only)
    api_access BOOLEAN DEFAULT false,
    export_format TEXT DEFAULT 'json',
    backup_frequency TEXT DEFAULT 'daily',
    data_retention INTEGER DEFAULT 365,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one settings record per user
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own settings
CREATE POLICY "Users can access their own settings" ON user_settings
    FOR ALL
    USING (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);