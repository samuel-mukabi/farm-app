-- Fix Auth Trigger and Schema Discrepancy

-- 1. Align public.users table with the codebase
DO $$ 
BEGIN
    -- Rename user_id to id if necessary
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'user_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') THEN
        ALTER TABLE public.users RENAME COLUMN user_id TO id;
    END IF;

    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'farm_name') THEN
        ALTER TABLE public.users ADD COLUMN farm_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, created_at)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = now();
    RETURN new;
END;
$$;

-- 3. Re-create the trigger to ensure it's AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_auth_user_upsert_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_upsert ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Clean up old function name
DROP FUNCTION IF EXISTS public.handle_auth_user_upsert();
