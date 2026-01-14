-- ============================================================================
-- FARM MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This script creates the complete database schema from scratch
-- WARNING: This will DROP ALL EXISTING TABLES and their data
-- ============================================================================

-- ============================================================================
-- PART 1: CLEANUP - Drop all existing objects
-- ============================================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.reset_all_rls_to_authenticated() CASCADE;

-- Drop all tables (cascade will drop all dependent objects including policies)
DROP TABLE IF EXISTS public.chick_sources CASCADE;
DROP TABLE IF EXISTS public.daily_logs CASCADE;
DROP TABLE IF EXISTS public.feed_logs CASCADE;
DROP TABLE IF EXISTS public.vaccinations CASCADE;
DROP TABLE IF EXISTS public.feed_types CASCADE;
DROP TABLE IF EXISTS public.crops CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- PART 2: CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table (synced with auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    farm_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.users IS 'User profiles synced with auth.users';
COMMENT ON COLUMN public.users.farm_name IS 'Custom farm name displayed on dashboard';

-- ----------------------------------------------------------------------------
-- Crops Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.crops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    total_chicks integer NOT NULL CHECK (total_chicks > 0),
    arrival_date date NOT NULL,
    expected_harvest_date date,
    actual_harvest_date date,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Archived')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.crops IS 'Poultry crop/batch management';
CREATE INDEX idx_crops_user_id ON public.crops(user_id);
CREATE INDEX idx_crops_status ON public.crops(status);

-- ----------------------------------------------------------------------------
-- Chick Sources Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.chick_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    supplier_name text NOT NULL,
    count integer NOT NULL CHECK (count > 0),
    unit_price numeric,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.chick_sources IS 'Track chick suppliers per crop (e.g., ANIRITA, KENCHICK)';
CREATE INDEX idx_chick_sources_crop_id ON public.chick_sources(crop_id);

-- ----------------------------------------------------------------------------
-- Feed Types Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.feed_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    brand text,
    description text,
    current_stock_kg numeric DEFAULT 0 CHECK (current_stock_kg >= 0),
    reorder_level_kg numeric,
    unit text DEFAULT 'kg',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, name)
);

COMMENT ON TABLE public.feed_types IS 'Feed inventory types (C1, C2, C3, etc.)';
COMMENT ON COLUMN public.feed_types.current_stock_kg IS 'Current stock in kilograms';
COMMENT ON COLUMN public.feed_types.reorder_level_kg IS 'Reorder threshold in kilograms';
CREATE INDEX idx_feed_types_user_id ON public.feed_types(user_id);

-- ----------------------------------------------------------------------------
-- Feed Logs Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.feed_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_type_id uuid REFERENCES public.feed_types(id) ON DELETE SET NULL,
    crop_id uuid REFERENCES public.crops(id) ON DELETE CASCADE,
    action text NOT NULL CHECK (action IN ('Restock', 'Usage')),
    c1_bags integer DEFAULT 0 CHECK (c1_bags >= 0),
    c2_bags integer DEFAULT 0 CHECK (c2_bags >= 0),
    c3_bags integer DEFAULT 0 CHECK (c3_bags >= 0),
    log_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.feed_logs IS 'Track feed restock and usage events';
COMMENT ON COLUMN public.feed_logs.c1_bags IS 'Number of C1 feed bags (50kg each)';
COMMENT ON COLUMN public.feed_logs.c2_bags IS 'Number of C2 feed bags (50kg each)';
COMMENT ON COLUMN public.feed_logs.c3_bags IS 'Number of C3 feed bags (50kg each)';
CREATE INDEX idx_feed_logs_crop_id ON public.feed_logs(crop_id);
CREATE INDEX idx_feed_logs_log_date ON public.feed_logs(log_date);

-- ----------------------------------------------------------------------------
-- Daily Logs Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.daily_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    mortality integer DEFAULT 0 CHECK (mortality >= 0),
    feed_consumed_kg numeric DEFAULT 0 CHECK (feed_consumed_kg >= 0),
    water_consumed_liters numeric,
    avg_weight_g numeric,
    notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(crop_id, log_date)
);

COMMENT ON TABLE public.daily_logs IS 'Daily tracking of mortality, feed, water, and growth';
CREATE INDEX idx_daily_logs_crop_id ON public.daily_logs(crop_id);
CREATE INDEX idx_daily_logs_log_date ON public.daily_logs(log_date);

-- ----------------------------------------------------------------------------
-- Vaccinations Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.vaccinations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    vaccine_name text NOT NULL,
    standard_day integer,
    target_date date NOT NULL,
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Administered', 'Missed')),
    administered_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.vaccinations IS 'Vaccination schedules and tracking';
CREATE INDEX idx_vaccinations_crop_id ON public.vaccinations(crop_id);
CREATE INDEX idx_vaccinations_status ON public.vaccinations(status);
CREATE INDEX idx_vaccinations_target_date ON public.vaccinations(target_date);

-- ============================================================================
-- PART 3: TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger Function: Sync auth.users to public.users
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = now();
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically sync new auth.users to public.users';

-- ----------------------------------------------------------------------------
-- Trigger: On auth.users insert/update
-- ----------------------------------------------------------------------------
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chick_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Users Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Crops Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own crops"
    ON public.crops FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crops"
    ON public.crops FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crops"
    ON public.crops FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crops"
    ON public.crops FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Chick Sources Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage chick sources of their crops"
    ON public.chick_sources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE public.crops.id = public.chick_sources.crop_id
            AND public.crops.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Feed Types Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own feed types"
    ON public.feed_types FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feed types"
    ON public.feed_types FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feed types"
    ON public.feed_types FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feed types"
    ON public.feed_types FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Feed Logs Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage feed logs"
    ON public.feed_logs FOR ALL
    USING (
        -- Allow if crop_id is null (general restock) or if user owns the crop
        crop_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE public.crops.id = public.feed_logs.crop_id
            AND public.crops.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Daily Logs Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage daily logs of their crops"
    ON public.daily_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE public.crops.id = public.daily_logs.crop_id
            AND public.crops.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Vaccinations Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage vaccinations of their crops"
    ON public.vaccinations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.crops
            WHERE public.crops.id = public.vaccinations.crop_id
            AND public.crops.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 5: BACKFILL EXISTING DATA
-- ============================================================================

-- Populate public.users from existing auth.users
INSERT INTO public.users (id, email, full_name)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 6: GRANTS (Optional - for service role access)
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges on all tables to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant select on all tables to anon (for public read-only access if needed)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify the schema after running
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT * FROM public.users;
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
