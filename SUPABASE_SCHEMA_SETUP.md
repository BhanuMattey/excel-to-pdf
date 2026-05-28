# Supabase Database Schema Setup Guide

## Complete Setup for ExcelfromPDF Authentication & User Management

This guide provides the complete SQL schema for setting up your Supabase database with authentication, user profiles, conversion tracking, and email marketing capabilities.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Complete SQL Schema](#complete-sql-schema)
3. [Table Descriptions](#table-descriptions)
4. [Authentication Setup](#authentication-setup)
5. [Testing the Setup](#testing-the-setup)
6. [Environment Variables](#environment-variables)

---

## Prerequisites

Before running this schema:

1. Create a Supabase project at https://supabase.com
2. Note down your:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for admin access)

---

## Complete SQL Schema

Copy and paste this entire SQL script into your Supabase SQL Editor:

```sql
-- ============================================
-- ExcelfromPDF Supabase Database Schema
-- Complete setup for Authentication & Data
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (User Information)
-- ============================================

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

COMMENT ON TABLE public.profiles IS 'User profile information extending auth.users';
COMMENT ON COLUMN public.profiles.email IS 'User email - visible for marketing purposes';
COMMENT ON COLUMN public.profiles.marketing_consent IS 'Whether user consents to marketing emails';
COMMENT ON COLUMN public.profiles.email_verified IS 'Whether email has been verified';

-- ============================================
-- 2. CONVERSIONS TABLE (Track User Activity)
-- ============================================

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

COMMENT ON TABLE public.conversions IS 'Track all file conversions by users';
COMMENT ON COLUMN public.conversions.conversion_type IS 'Type of conversion performed';
COMMENT ON COLUMN public.conversions.status IS 'Current status of the conversion';

-- ============================================
-- 3. MARKETING CAMPAIGNS TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_name TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.marketing_campaigns IS 'Track email marketing campaigns';

-- ============================================
-- 4. INDEXES (Performance Optimization)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON public.profiles(marketing_consent);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON public.conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON public.conversions(conversion_type);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
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

-- Conversions Policies
CREATE POLICY "Users can view their own conversions"
    ON public.conversions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions"
    ON public.conversions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions"
    ON public.conversions FOR UPDATE
    USING (auth.uid() = user_id);

-- Marketing Campaigns Policies (admin only)
CREATE POLICY "Service role can manage campaigns"
    ON public.marketing_campaigns FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 6. TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Auto-create profile on user signup
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

-- Trigger: Call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update email verification status
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

-- Trigger: Update on email verification
DROP TRIGGER IF EXISTS on_user_email_verified ON auth.users;
CREATE TRIGGER on_user_email_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_verified();

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Update timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at
    BEFORE UPDATE ON public.conversions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. VIEWS (Easy Data Access)
-- ============================================

-- Marketing List View
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

COMMENT ON VIEW public.marketing_list IS 'List of all users who consented to marketing';

-- Grant permissions on the view
GRANT SELECT ON public.marketing_list TO authenticated;
GRANT SELECT ON public.marketing_list TO service_role;

-- ============================================
-- 8. UTILITY FUNCTIONS
-- ============================================

-- Function: Get marketing statistics
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

COMMENT ON FUNCTION public.get_marketing_stats() IS 'Get statistics for marketing dashboard';
```

---

## Table Descriptions

### 1. `profiles` Table

Stores user profile information with email for marketing purposes.

| Column              | Type      | Description                             |
| ------------------- | --------- | --------------------------------------- |
| `id`                | UUID      | Primary key, references auth.users      |
| `email`             | TEXT      | User email (visible for marketing)      |
| `full_name`         | TEXT      | User's full name                        |
| `avatar_url`        | TEXT      | Profile picture URL                     |
| `marketing_consent` | BOOLEAN   | Marketing email consent (default: true) |
| `email_verified`    | BOOLEAN   | Email verification status               |
| `created_at`        | TIMESTAMP | Account creation date                   |
| `updated_at`        | TIMESTAMP | Last update date                        |

### 2. `conversions` Table

Tracks all file conversions performed by users.

| Column            | Type      | Description                             |
| ----------------- | --------- | --------------------------------------- |
| `id`              | UUID      | Primary key                             |
| `user_id`         | UUID      | References profiles.id                  |
| `file_name`       | TEXT      | Name of converted file                  |
| `conversion_type` | TEXT      | Type of conversion (pdf_to_excel, etc.) |
| `status`          | TEXT      | Status (processing, completed, failed)  |
| `output_url`      | TEXT      | URL to download result                  |
| `file_size`       | BIGINT    | File size in bytes                      |
| `pages_count`     | INTEGER   | Number of pages                         |
| `created_at`      | TIMESTAMP | Conversion start time                   |
| `updated_at`      | TIMESTAMP | Last update time                        |

### 3. `marketing_campaigns` Table

Tracks email marketing campaigns (optional).

| Column             | Type      | Description            |
| ------------------ | --------- | ---------------------- |
| `id`               | UUID      | Primary key            |
| `campaign_name`    | TEXT      | Campaign name          |
| `sent_at`          | TIMESTAMP | When campaign was sent |
| `recipients_count` | INTEGER   | Number of recipients   |
| `opened_count`     | INTEGER   | Email opens            |
| `clicked_count`    | INTEGER   | Link clicks            |

---

## Authentication Setup

### 1. Supabase Auth Configuration

In your Supabase Dashboard:

1. **Go to Authentication → Settings**
2. **Enable Email Provider:**
   - Toggle ON "Enable Email provider"
   - Set "Confirm email" to ON (recommended)
   - Configure email templates

3. **Configure Email Templates** (Optional):
   - Customize signup confirmation email
   - Customize password reset email
   - Add your branding

4. **Set Site URL:**
   - Add your production URL: `https://yourdomain.com`
   - Add redirect URLs for local development: `http://localhost:3000`

### 2. Application Configuration

Create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For admin/marketing access
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
VITE_FREE_CONVERSION_LIMIT=500
VITE_MAX_FILE_SIZE=52428800
```

⚠️ **Security Note:** Never commit `.env` to git! Add it to `.gitignore`

---

## Testing the Setup

### Test 1: User Registration

```javascript
import { authService } from "./services/supabase";

// Sign up a new user
const { data, error } = await authService.signUp(
  "test@example.com",
  "SecurePassword123!",
  "John Doe",
);

if (error) {
  console.error("Signup error:", error);
} else {
  console.log("User created:", data);
  // Check profiles table - should auto-create profile
}
```

### Test 2: User Login

```javascript
// Sign in existing user
const { data, error } = await authService.signIn(
  "test@example.com",
  "SecurePassword123!",
);

if (error) {
  console.error("Login error:", error);
} else {
  console.log("Logged in:", data);
}
```

### Test 3: Verify Data

Run in Supabase SQL Editor:

```sql
-- Check if profile was created
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Check auth user
SELECT id, email, email_confirmed_at FROM auth.users
WHERE email = 'test@example.com';
```

### Test 4: Create Conversion

```javascript
import { conversionService } from "./services/supabase";

// Track a conversion
const conversion = await conversionService.createConversion(
  userId,
  "test-document.pdf",
  "processing",
);

console.log("Conversion tracked:", conversion);
```

---

## Troubleshooting

### Issue: Profile not created automatically

**Solution:** Check trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Re-run trigger creation if missing.

### Issue: RLS blocking access

**Solution:** Verify user is authenticated:

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Session:", session);
```

### Issue: Email not visible

**Solution:** Ensure you're querying the `profiles` table, not `auth.users`:

```sql
-- ✅ Correct
SELECT email FROM public.profiles;

-- ❌ Wrong - auth.users emails are not directly accessible
SELECT email FROM auth.users;
```

---

## Security Best Practices

1. ✅ **Never expose service_role key** in client code
2. ✅ **Use RLS policies** for data access control
3. ✅ **Enable email verification** in production
4. ✅ **Use HTTPS** for all API calls
5. ✅ **Implement rate limiting** for auth endpoints
6. ✅ **Add CAPTCHA** for signup (optional)
7. ✅ **Comply with GDPR** for email marketing

---

## Next Steps

1. ✅ Run the SQL schema in Supabase
2. ✅ Configure environment variables
3. ✅ Test user registration and login
4. ✅ Verify profile creation
5. ✅ Test conversion tracking
6. ✅ Access marketing emails (see MARKETING_SETUP.md)

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs/guides/auth
- **Auth Helpers:** https://supabase.com/docs/guides/auth/auth-helpers
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Marketing Setup:** See `MARKETING_SETUP.md` in this project

---

## Schema Version

**Version:** 1.0.0  
**Last Updated:** February 6, 2026  
**Compatible With:** Supabase PostgreSQL 15+
