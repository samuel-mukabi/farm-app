-- Add farm_name field to users table
-- This allows users to customize their farm name displayed on the dashboard

-- 1. Add the farm_name column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS farm_name text;

-- 2. Add a comment for documentation
COMMENT ON COLUMN public.users.farm_name IS 'Custom farm name displayed on dashboard header';
