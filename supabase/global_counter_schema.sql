-- Add global settings table for tracking free conversions
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial free conversions count
INSERT INTO public.global_settings (setting_key, setting_value)
VALUES ('free_conversions_remaining', '{"count": 500, "initial": 500}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read global settings
CREATE POLICY "Anyone can read global settings"
  ON public.global_settings
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can update (for conversion tracking)
CREATE POLICY "Authenticated users can update global settings"
  ON public.global_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Function to decrement free conversions
CREATE OR REPLACE FUNCTION decrement_free_conversions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get current count
  SELECT (setting_value->>'count')::INTEGER INTO current_count
  FROM public.global_settings
  WHERE setting_key = 'free_conversions_remaining';
  
  -- Only decrement if count is greater than 0
  IF current_count > 0 THEN
    UPDATE public.global_settings
    SET 
      setting_value = jsonb_set(setting_value, '{count}', to_jsonb(current_count - 1)),
      updated_at = NOW()
    WHERE setting_key = 'free_conversions_remaining';
    
    RETURN current_count - 1;
  END IF;
  
  RETURN current_count;
END;
$$;

-- Function to get remaining free conversions
CREATE OR REPLACE FUNCTION get_free_conversions_remaining()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT (setting_value->>'count')::INTEGER INTO remaining
  FROM public.global_settings
  WHERE setting_key = 'free_conversions_remaining';
  
  RETURN COALESCE(remaining, 0);
END;
$$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON public.global_settings(setting_key);

-- Add comment
COMMENT ON TABLE public.global_settings IS 'Global application settings including free conversion counter';
