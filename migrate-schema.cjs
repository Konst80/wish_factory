#!/usr/bin/env node

// Schema migration using Supabase Management API
const SUPABASE_ACCESS_TOKEN = 'sbp_da54d9d95a96494a426fb4358f6365801bccf3c3';

// const DEV_PROJECT_REF = 'kgowrcgwzqfeiqitavdc'; // Currently not used
const PROD_PROJECT_REF = 'bnbzkfwowcqnecrdqdas';

// Basic schema SQL for the wish factory
const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'editor' CHECK (role IN ('editor', 'administrator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    avatar_url TEXT
);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    language VARCHAR(2) DEFAULT 'de',
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    new_wish_alerts BOOLEAN DEFAULT true,
    approval_requests BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT false,
    weekly_report BOOLEAN DEFAULT true,
    theme VARCHAR(20) DEFAULT 'light',
    dashboard_layout VARCHAR(20) DEFAULT 'grid',
    wishes_per_page INTEGER DEFAULT 25,
    auto_save BOOLEAN DEFAULT true,
    confirm_before_delete BOOLEAN DEFAULT true,
    api_access BOOLEAN DEFAULT false,
    export_format VARCHAR(10) DEFAULT 'json',
    backup_frequency VARCHAR(20) DEFAULT 'daily',
    data_retention INTEGER DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_prompt_system TEXT DEFAULT 'Du bist ein Experte für das Schreiben von Glückwünschen. Antworte immer im exakten JSON-Format ohne zusätzlichen Text.',
    ai_model TEXT DEFAULT 'anthropic/claude-3.5-sonnet',
    ai_temperature DECIMAL DEFAULT 0.8,
    ai_max_tokens INTEGER DEFAULT 2000,
    ai_top_p DECIMAL DEFAULT 0.9,
    ai_frequency_penalty DECIMAL DEFAULT 0.1,
    ai_presence_penalty DECIMAL DEFAULT 0.1,
    ai_prompt_template TEXT,
    ai_json_structure TEXT,
    specific_values_birthday_de TEXT DEFAULT '16,18,21,30,40,50,60,65,70,80,90,100',
    specific_values_birthday_en TEXT DEFAULT '16,18,21,30,40,50,60,65,70,80,90,100',
    specific_values_anniversary_de TEXT DEFAULT '1,5,10,15,20,25,30,40,50,60,70',
    specific_values_anniversary_en TEXT DEFAULT '1,5,10,15,20,25,30,40,50,60,70',
    specific_values_custom_de TEXT DEFAULT '5,10,15,20,25,30',
    specific_values_custom_en TEXT DEFAULT '5,10,15,20,25,30',
    ai_prompt_age_young TEXT DEFAULT '',
    ai_prompt_age_middle TEXT DEFAULT '',
    ai_prompt_age_senior TEXT DEFAULT '',
    ai_prompt_relation_friend TEXT DEFAULT '',
    ai_prompt_relation_family TEXT DEFAULT '',
    ai_prompt_relation_partner TEXT DEFAULT '',
    ai_prompt_relation_colleague TEXT DEFAULT '',
    ai_prompt_batch TEXT DEFAULT '',
    ai_prompt_belated TEXT DEFAULT ''
);

-- Wishes table
CREATE TABLE IF NOT EXISTS public.wishes (
    id TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('normal', 'funny')),
    event_type TEXT CHECK (event_type IN ('birthday', 'anniversary', 'custom')),
    relations TEXT[],
    age_groups TEXT[],
    specific_values INTEGER[],
    text TEXT,
    belated TEXT,
    status TEXT DEFAULT 'Entwurf' CHECK (status IN ('Entwurf', 'Zur Freigabe', 'Freigegeben', 'Archiviert')),
    language TEXT CHECK (language IN ('de', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    length TEXT CHECK (length IN ('short', 'medium', 'long'))
);

-- Released wishes table (public snapshots)
CREATE TABLE IF NOT EXISTS public.released_wishes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_wish_id TEXT REFERENCES public.wishes(id),
    type TEXT,
    event_type TEXT,
    relations TEXT[],
    age_groups TEXT[],
    specific_values INTEGER[],
    text TEXT NOT NULL,
    belated TEXT,
    language TEXT,
    length TEXT,
    released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_by UUID REFERENCES auth.users(id)
);

-- API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    allowed_endpoints TEXT[],
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_requests INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.released_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wishes" ON public.wishes FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create wishes" ON public.wishes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own wishes" ON public.wishes FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Released wishes are public" ON public.released_wishes FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Users can view own API keys" ON public.api_keys FOR SELECT USING (auth.uid() = created_by);

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wish ID generator function
CREATE OR REPLACE FUNCTION public.generate_wish_id(wish_language TEXT)
RETURNS TEXT AS $$
DECLARE
    counter INTEGER;
    prefix TEXT;
BEGIN
    IF wish_language = 'en' THEN
        prefix := 'WEN';
    ELSE
        prefix := 'WDE';
    END IF;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)), 0) + 1
    INTO counter
    FROM public.wishes
    WHERE id LIKE prefix || '%';
    
    RETURN prefix || LPAD(counter::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
`;

async function executeSQL(projectRef, sql) {
	const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: sql
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`SQL execution failed: ${response.status} ${response.statusText} - ${error}`);
	}

	return await response.json();
}

async function main() {
	console.log('🚀 Starting schema migration to production...');
	console.log(`📥 Target: ${PROD_PROJECT_REF}`);
	console.log('');

	try {
		console.log('📊 Creating schema in production...');
		await executeSQL(PROD_PROJECT_REF, SCHEMA_SQL);
		console.log('✅ Schema created successfully!');

		console.log('');
		console.log('🎉 Schema migration completed!');
		console.log('');
		console.log('Next step: Run data migration');
	} catch (error) {
		console.error('💥 Schema migration failed:', error.message);
		process.exit(1);
	}
}

main();
