-- ============================================================================
-- COMPLETE RESET - Delete ALL data including auth.users
-- ============================================================================
-- WARNING: This will DELETE ALL USERS and ALL DATA permanently!
-- This is a complete nuclear option - use with extreme caution
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all triggers first to prevent cascading issues
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_auth_users_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS handle_auth_user_upsert_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_upsert ON auth.users;

-- ============================================================================
-- STEP 2: Drop all functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_users_to_public_users() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_upsert() CASCADE;
DROP FUNCTION IF EXISTS public.reset_all_rls_to_authenticated() CASCADE;

-- ============================================================================
-- STEP 3: Drop all public schema tables (cascade will remove policies)
-- ============================================================================

DROP TABLE IF EXISTS public.chick_sources CASCADE;
DROP TABLE IF EXISTS public.daily_logs CASCADE;
DROP TABLE IF EXISTS public.feed_logs CASCADE;
DROP TABLE IF EXISTS public.vaccinations CASCADE;
DROP TABLE IF EXISTS public.feed_types CASCADE;
DROP TABLE IF EXISTS public.crops CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- STEP 4: Delete ALL auth.users (THIS DELETES ALL USER ACCOUNTS!)
-- ============================================================================

-- This will permanently delete all user accounts
-- Users will need to sign up again
DELETE FROM auth.users;

-- Also clean up related auth tables
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that all users are deleted
SELECT COUNT(*) as remaining_auth_users FROM auth.users;

-- Check that all public tables are dropped
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================================================
-- NEXT STEP: Run complete_schema.sql to recreate everything fresh
-- ============================================================================
