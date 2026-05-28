-- ExcelfromPDF Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users) with email for marketing
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    marketing_consent BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create conversions table
CREATE TABLE IF NOT EXISTS public.conversions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    conversion_type TEXT DEFAULT 'pdf_to_excel' CHECK (conversion_type IN ('pdf_to_excel', 'auto_correct', 'auto_flip', 'split_excel', 'rotate_pages')),
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    output_url TEXT,
    file_size BIGINT,
    pages_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create marketing_campaigns table (optional, for tracking campaigns)
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_name TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON public.profiles(marketing_consent);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON public.conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON public.conversions(conversion_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Admin can view all profiles (for marketing)
CREATE POLICY "Service role can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (auth.jwt()->>'role' = 'service_role');

-- Conversions policies
CREATE POLICY "Users can view their own conversions" 
    ON public.conversions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions" 
    ON public.conversions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions" 
    ON public.conversions FOR UPDATE 
    USING (auth.uid() = user_id);

-- Marketing campaigns policies (admin only)
CREATE POLICY "Service role can manage campaigns" 
    ON public.marketing_campaigns FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, email_verified)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update email verification status
CREATE OR REPLACE FUNCTION public.handle_user_email_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.profiles
        SET email_verified = true
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for email verification
DROP TRIGGER IF EXISTS on_user_email_verified ON auth.users;
CREATE TRIGGER on_user_email_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_verified();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at
    BEFORE UPDATE ON public.conversions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View for marketing list (emails with consent)
CREATE OR REPLACE VIEW public.marketing_list AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.email_verified,
    p.marketing_consent,
    p.created_at,
    COUNT(DISTINCT c.id) as total_conversions,
    MAX(c.created_at) as last_conversion_date
FROM public.profiles p
LEFT JOIN public.conversions c ON c.user_id = p.id
WHERE p.marketing_consent = true
GROUP BY p.id, p.email, p.full_name, p.email_verified, p.marketing_consent, p.created_at
ORDER BY p.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON public.marketing_list TO authenticated;
GRANT SELECT ON public.marketing_list TO service_role;

-- Function to get marketing stats
CREATE OR REPLACE FUNCTION public.get_marketing_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', COUNT(*),
        'marketing_consent_users', COUNT(*) FILTER (WHERE marketing_consent = true),
        'verified_emails', COUNT(*) FILTER (WHERE email_verified = true),
        'total_conversions', (SELECT COUNT(*) FROM public.conversions)
    )
    INTO result
    FROM public.profiles;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
