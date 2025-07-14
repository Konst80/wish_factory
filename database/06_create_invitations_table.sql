-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Administrator', 'Redakteur')),
    token TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    CONSTRAINT invitations_email_unique UNIQUE (email)
);

-- Create index for token lookups
CREATE INDEX idx_invitations_token ON public.invitations(token);

-- Create index for email lookups
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view invitations
CREATE POLICY "Admins can view all invitations" ON public.invitations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Administrator'
        )
    );

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations" ON public.invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Administrator'
        )
        AND created_by = auth.uid()
    );

-- Only admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON public.invitations
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Administrator'
        )
    );

-- Allow anonymous users to read invitations by token (for accepting invites)
CREATE POLICY "Anyone can read invitation by token" ON public.invitations
    FOR SELECT
    TO anon
    USING (token IS NOT NULL);