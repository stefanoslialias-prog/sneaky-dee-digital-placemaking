-- ✅ Fix RLS for Registration & Opt-in: Comprehensive Audit and Repair (Corrected)
-- Goal: Remove conflicting policies and create minimal, secure RLS that allows registration + opt-in

-- Step 1: Print current RLS policies for review
DO $$
DECLARE 
  r record;
BEGIN
  RAISE NOTICE 'Current RLS policies:';
  FOR r IN
    SELECT policyname, schemaname, tablename, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE (schemaname, tablename) IN (('public','user_emails'), ('public','users'), ('public','profiles'))
    ORDER BY schemaname, tablename, policyname
  LOOP
    RAISE NOTICE 'Policy: % on %.% - CMD: % - USING: % - WITH CHECK: %', 
      r.policyname, r.schemaname, r.tablename, r.cmd, r.qual, r.with_check;
  END LOOP;
END $$;

-- Step 2: Remove ALL conflicting deny-all policies (idempotent)
DO $$
DECLARE r record;
BEGIN
  RAISE NOTICE 'Removing conflicting policies...';
  
  -- Drop any policies that might be causing conflicts
  FOR r IN
    SELECT policyname, schemaname, tablename
    FROM pg_policies
    WHERE (schemaname, tablename) IN (('public','user_emails'), ('public','users'), ('public','profiles'))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped policy: % on %.%', r.policyname, r.schemaname, r.tablename;
  END LOOP;
END $$;

-- Step 3: Ensure RLS is enabled on relevant tables
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create profiles table if it doesn't exist (adapting to current schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_touch ON public.profiles;
CREATE TRIGGER trg_profiles_touch
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Step 5: Create secure, minimal policies for profiles
CREATE POLICY profiles_select_self
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY profiles_insert_self
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_self
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 6: Create secure policies for user_emails (allow anonymous opt-ins)
CREATE POLICY user_emails_insert_open
ON public.user_emails
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Allow anonymous opt-ins (user_id is NULL) or authenticated users (user_id = auth.uid())
  (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY user_emails_select_owner
ON public.user_emails
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY user_emails_update_owner
ON public.user_emails
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 7: Create secure policies for users table
CREATE POLICY users_select_self
ON public.users
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY users_insert_self
ON public.users
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY users_update_self
ON public.users
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 8: Verification - Print final policies
DO $$
DECLARE 
  r record;
BEGIN
  RAISE NOTICE 'Final RLS policies after cleanup:';
  FOR r IN
    SELECT policyname, schemaname, tablename, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE (schemaname, tablename) IN (('public','user_emails'), ('public','users'), ('public','profiles'))
    ORDER BY schemaname, tablename, policyname
  LOOP
    RAISE NOTICE 'Policy: % on %.% - CMD: % - USING: % - WITH CHECK: %', 
      r.policyname, r.schemaname, r.tablename, r.cmd, r.qual, r.with_check;
  END LOOP;
END $$;