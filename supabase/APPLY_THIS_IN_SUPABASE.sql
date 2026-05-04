-- =============================================================
-- GymFlow — MASTER FIX SQL
-- Project: uaoinfmfnlshyrqwsmlx
-- Run this ENTIRE file in:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================================
-- This script is IDEMPOTENT — safe to run multiple times.
-- Uses IF NOT EXISTS / CREATE OR REPLACE / ALTER TABLE IF NOT EXISTS
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- SECTION 1: VERIFY & FIX profiles TABLE STRUCTURE
-- ─────────────────────────────────────────────────────────────

-- Add any missing columns (ALTER is safe, won't break existing data)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status   text DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS subscription_plan     text DEFAULT 'pro_trial',
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS trial_start_date      timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date        timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gym_name              text DEFAULT '',
  ADD COLUMN IF NOT EXISTS login_provider        text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS razorpay_customer_id  text,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;

-- ─────────────────────────────────────────────────────────────
-- SECTION 2: VERIFY & FIX attendance TABLE STRUCTURE
-- ─────────────────────────────────────────────────────────────

-- Create attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL,
  user_id       uuid NOT NULL,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Add foreign key to members (only if not already there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'attendance_member_id_fkey'
    AND table_name = 'attendance'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_member_id_fkey
      FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint (one check-in per member per day)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'attendance_member_date_unique'
    AND table_name = 'attendance'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_member_date_unique
      UNIQUE (member_id, user_id, check_in_date);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- SECTION 3: DROP & RECREATE ALL RLS POLICIES (CLEAN STATE)
-- ─────────────────────────────────────────────────────────────

-- === profiles ===
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- === attendance ===
-- Drop ALL old policies including any that reference the dropped trainers table
DROP POLICY IF EXISTS "Users can view own attendance"         ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance"       ON public.attendance;
DROP POLICY IF EXISTS "Users can delete own attendance"       ON public.attendance;
DROP POLICY IF EXISTS "Trainers can view owner attendance"    ON public.attendance;
DROP POLICY IF EXISTS "Trainers can insert attendance"        ON public.attendance;

CREATE POLICY "Users can view own attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance"
  ON public.attendance FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === members ===
DROP POLICY IF EXISTS "Users can view their own members"   ON public.members;
DROP POLICY IF EXISTS "Users can create their own members" ON public.members;
DROP POLICY IF EXISTS "Users can update their own members" ON public.members;
DROP POLICY IF EXISTS "Users can delete their own members" ON public.members;
DROP POLICY IF EXISTS "Trainers can view owner members"    ON public.members;

CREATE POLICY "Users can view their own members"
  ON public.members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own members"
  ON public.members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own members"
  ON public.members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === expenses ===
DROP POLICY IF EXISTS "Users can view own expenses"   ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses"   ON public.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- === inventory ===
DROP POLICY IF EXISTS "Users can view own inventory"   ON public.inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;

CREATE POLICY "Users can view own inventory"   ON public.inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON public.inventory FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- SECTION 4: CORE FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- 4a. update_updated_at_column (utility)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4b. auto_grant_master_pro — gives master admin permanent pro on profile insert
CREATE OR REPLACE FUNCTION public.auto_grant_master_pro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN (
    'mullahusen999@gmail.com',
    'admin1@gymflow.com',
    'admin2@gymflow.com',
    'admin3@gymflow.com'
  ) THEN
    NEW.subscription_status    := 'active';
    NEW.subscription_plan      := 'pro_yearly';
    NEW.subscription_end_date  := now() + interval '100 years';
    NEW.trial_used             := true;
  END IF;
  RETURN NEW;
END;
$$;

-- 4c. check_and_lock_trial — marks expired trials automatically
CREATE OR REPLACE FUNCTION public.check_and_lock_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Never touch master admin accounts
  IF NEW.email IN (
    'mullahusen999@gmail.com',
    'admin1@gymflow.com',
    'admin2@gymflow.com',
    'admin3@gymflow.com'
  ) THEN
    RETURN NEW;
  END IF;

  -- If still "trialing" but end date has passed → expire it
  IF NEW.subscription_status = 'trialing'
     AND NEW.trial_end_date IS NOT NULL
     AND NEW.trial_end_date < now() THEN
    NEW.subscription_status := 'expired';
    NEW.trial_used          := true;
  END IF;

  -- If setting to expired/blocked → mark trial as used
  IF NEW.subscription_status IN ('expired', 'blocked') THEN
    NEW.trial_used := true;
  END IF;

  RETURN NEW;
END;
$$;

-- 4d. handle_new_user — auto-creates profile + starts 7-day trial on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _provider text;
  _name     text;
BEGIN
  _provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  _name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  INSERT INTO public.profiles (
    id,
    email,
    name,
    gym_name,
    subscription_status,
    subscription_plan,
    trial_start_date,
    trial_end_date,
    trial_used,
    login_provider
  ) VALUES (
    NEW.id,
    NEW.email,
    _name,
    COALESCE(NEW.raw_user_meta_data->>'gym_name', ''),
    'trialing',
    'pro_trial',           -- FIXED: was 'free', must be 'pro_trial' for full PRO access during trial
    now(),
    now() + interval '7 days',
    false,
    _provider
  )
  ON CONFLICT (id) DO UPDATE SET
    email          = EXCLUDED.email,
    name           = CASE
                       WHEN profiles.name IS NULL OR profiles.name = ''
                       THEN EXCLUDED.name
                       ELSE profiles.name
                     END,
    login_provider = EXCLUDED.login_provider;

  RETURN NEW;
END;
$$;

-- 4e. handle_new_user_role — always assigns 'owner' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- SECTION 5: ADMIN FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- 5a. admin_panel_list_profiles
-- SECURITY DEFINER = bypasses RLS completely
-- No auth check = works from standalone admin panel (no Supabase session)
-- Granted to anon = callable without login
CREATE OR REPLACE FUNCTION public.admin_panel_list_profiles()
RETURNS TABLE (
  id                    uuid,
  name                  text,
  email                 text,
  subscription_plan     text,
  subscription_status   text,
  subscription_end_date timestamptz,
  trial_end_date        timestamptz,
  trial_used            boolean,
  created_at            timestamptz,
  gym_name              text,
  login_provider        text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.email,
    p.subscription_plan,
    p.subscription_status,
    p.subscription_end_date,
    p.trial_end_date,
    p.trial_used,
    p.created_at,
    p.gym_name,
    p.login_provider
  FROM public.profiles p
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO authenticated;

-- 5b. admin_list_profiles (used by old AdminPanel.tsx — kept for compatibility)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only master admins can call this
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN (
    'mullahusen999@gmail.com',
    'admin1@gymflow.com',
    'admin2@gymflow.com',
    'admin3@gymflow.com'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

-- 5c. admin_update_profile (used by AdminPanel.tsx Activate/Block actions)
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id uuid,
  new_status     text,
  new_plan       text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN (
    'mullahusen999@gmail.com',
    'admin1@gymflow.com',
    'admin2@gymflow.com',
    'admin3@gymflow.com'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles SET
    subscription_status = new_status,
    subscription_plan   = COALESCE(new_plan, subscription_plan),
    trial_used = CASE
                   WHEN new_status IN ('expired', 'blocked') THEN true
                   ELSE trial_used
                 END
  WHERE id = target_user_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- SECTION 6: RECREATE TRIGGERS (drop first to avoid duplicates)
-- ─────────────────────────────────────────────────────────────

-- Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created           ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_role_created      ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role      ON auth.users;
DROP TRIGGER IF EXISTS on_profile_insert_master_pro   ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_update_check_trial  ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_update_trial_check  ON public.profiles;
-- Safely drop triggers on tables that may not exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='members') THEN
    DROP TRIGGER IF EXISTS on_members_updated_at ON public.members;
    DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inventory') THEN
    DROP TRIGGER IF EXISTS on_inventory_updated_at ON public.inventory;
    DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
  END IF;
END $$;

-- Re-create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TRIGGER on_profile_insert_master_pro
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_master_pro();

CREATE TRIGGER on_profile_update_check_trial
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_and_lock_trial();

-- Only create triggers on tables that exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='members') THEN
    CREATE TRIGGER on_members_updated_at
      BEFORE UPDATE ON public.members
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='inventory') THEN
    CREATE TRIGGER on_inventory_updated_at
      BEFORE UPDATE ON public.inventory
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- SECTION 7: BACKFILL EXISTING USERS
-- ─────────────────────────────────────────────────────────────

-- Give trial to users who have no subscription status set
UPDATE public.profiles SET
  subscription_status = 'trialing',
  subscription_plan   = 'pro_trial',
  trial_start_date    = COALESCE(trial_start_date, created_at),
  trial_end_date      = COALESCE(trial_end_date, created_at + interval '7 days'),
  trial_used          = false
WHERE
  subscription_status IS NULL
  OR subscription_status = ''
  OR subscription_status = 'incomplete';

-- Mark trials that have already expired as expired
UPDATE public.profiles SET
  subscription_status = 'expired',
  trial_used          = true
WHERE
  subscription_status = 'trialing'
  AND trial_end_date IS NOT NULL
  AND trial_end_date < now()
  AND (email NOT IN ('mullahusen999@gmail.com', 'admin1@gymflow.com', 'admin2@gymflow.com', 'admin3@gymflow.com') OR email IS NULL);

-- Ensure all master admins always have active pro
UPDATE public.profiles SET
  subscription_status   = 'active',
  subscription_plan     = 'pro_yearly',
  subscription_end_date = now() + interval '100 years',
  trial_used            = true
WHERE email IN (
  'mullahusen999@gmail.com',
  'admin1@gymflow.com',
  'admin2@gymflow.com',
  'admin3@gymflow.com'
);

-- ─────────────────────────────────────────────────────────────
-- SECTION 8: VERIFICATION QUERIES
-- (These return data to confirm everything worked)
-- ─────────────────────────────────────────────────────────────

-- Show all functions created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'admin_panel_list_profiles',
    'admin_list_profiles',
    'admin_update_profile',
    'handle_new_user',
    'handle_new_user_role',
    'auto_grant_master_pro',
    'check_and_lock_trial'
  )
ORDER BY routine_name;

-- Show all triggers on auth.users and profiles
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
  AND trigger_name IN (
    'on_auth_user_created',
    'on_auth_user_created_role',
    'on_profile_insert_master_pro',
    'on_profile_update_check_trial'
  )
ORDER BY trigger_name;

-- Show all profiles (your users)
SELECT
  id,
  email,
  name,
  subscription_status,
  subscription_plan,
  trial_end_date,
  trial_used,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Count by subscription status
SELECT
  subscription_status,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY subscription_status
ORDER BY user_count DESC;

-- Show all attendance records
SELECT
  a.id,
  a.user_id,
  a.member_id,
  a.check_in_date,
  a.created_at
FROM public.attendance a
ORDER BY a.created_at DESC
LIMIT 20;
