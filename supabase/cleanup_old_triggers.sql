-- ============================================================================
-- FIX: Remove old trigger that's causing delete errors
-- ============================================================================
-- This script removes the old sync_auth_users_to_public_users trigger
-- that references the wrong column name (user_id instead of id)
-- ============================================================================

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS sync_auth_users_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS public.sync_auth_users_to_public_users() CASCADE;

-- Verify the correct trigger exists
-- This should show: on_auth_user_created
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- Verify the correct function exists
-- This should show: handle_new_user
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%user%' 
AND pronamespace = 'public'::regnamespace;
