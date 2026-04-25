
-- ============================================================
-- GymFlow Complete System Fix
-- Date: 2026-04-25
-- Fixes:
--   1. Attendance RLS policies that reference dropped trainers table
--   2. check_and_lock_trial function (was missing/undefined)
--   3. auto_grant_master_pro function (may be missing)
--   4. admin_panel_list_profiles with correct SECURITY DEFINER
--   5. admin_list_profiles - remove email check (use anon access via DEFINER)
--   6. handle_new_user - ensure trial auto-starts correctly
--   7. handle_new_user_role - safe owner-only default
--   8. Backfill existing users with trial if missing
-- ============================================================

-- ─── STEP 1: Fix attendance RLS policies (remove trainer references) ───
-- These policies reference the now-dropped trainers table and cause errors

DROP POLICY IF EXISTS "Trainers can view owner attendance" ON public.attendance;
DROP POLICY IF EXISTS "Trainers can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Trainers can view owner members" ON public.members;
DROP POLICY IF EXISTS "Trainers can view own record" ON public.trainers;

-- Recreate clean attendance policies (owner-only)
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON public.attendance;

CREATE POLICY "Users can view own attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance"
  ON public.attendance FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Attendance unique constraint: one check-in per member per day
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_member_date_unique;

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_member_date_unique
  UNIQUE (member_id, user_id, check_in_date);

-- ─── STEP 2: Fix members policies (remove trainer references) ───
DROP POLICY IF EXISTS "Trainers can view owner members" ON public.members;

-- ─── STEP 3: Define missing check_and_lock_trial function ───
CREATE OR REPLACE FUNCTION public.check_and_lock_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If trial has expired, mark it as expired (don't allow status back to trialing)
  IF NEW.subscription_status = 'trialing'
     AND NEW.trial_end_date IS NOT NULL
     AND NEW.trial_end_date < now() THEN
    NEW.subscription_status := 'expired';
    NEW.trial_used := true;
  END IF;

  -- If setting to expired or blocked, mark trial as used
  IF NEW.subscription_status IN ('expired', 'blocked') THEN
    NEW.trial_used := true;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── STEP 4: Define missing auto_grant_master_pro function ───
CREATE OR REPLACE FUNCTION public.auto_grant_master_pro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Grant master admin permanent pro access
  IF NEW.email = 'mullahusen999@gmail.com' THEN
    NEW.subscription_status := 'active';
    NEW.subscription_plan := 'pro_yearly';
    NEW.subscription_end_date := now() + interval '100 years';
    NEW.trial_used := true;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── STEP 5: Fix handle_new_user — auto-start 7-day trial on signup ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _provider text;
  _name text;
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
    'free',
    now(),
    now() + interval '7 days',
    false,
    _provider
  )
  ON CONFLICT (id) DO UPDATE SET
    email       = EXCLUDED.email,
    name        = CASE WHEN profiles.name IS NULL OR profiles.name = '' THEN EXCLUDED.name ELSE profiles.name END,
    login_provider = EXCLUDED.login_provider;

  RETURN NEW;
END;
$$;

-- ─── STEP 6: Fix handle_new_user_role — always default to 'owner' safely ───
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Always insert as 'owner' — ignore signup_role to prevent staff/trainer escalation
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── STEP 7: Recreate triggers safely ───

-- Drop existing triggers first to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_profile_insert_master_pro ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_update_check_trial ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_update_trial_check ON public.profiles;

-- Recreate triggers
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

-- ─── STEP 8: Admin panel function — SECURITY DEFINER, no auth check ───
-- This is called by the standalone admin panel (no Supabase session)

CREATE OR REPLACE FUNCTION public.admin_panel_list_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  subscription_plan text,
  subscription_status text,
  subscription_end_date timestamptz,
  trial_end_date timestamptz,
  trial_used boolean,
  created_at timestamptz,
  gym_name text,
  login_provider text
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

-- Grant to anon so admin panel (no Supabase session) can call it
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO authenticated;

-- ─── STEP 9: Backfill existing users who have no trial set ───
-- Any user with no subscription_status gets a retroactive trial
UPDATE public.profiles
SET
  subscription_status = 'trialing',
  subscription_plan   = COALESCE(subscription_plan, 'free'),
  trial_start_date    = COALESCE(trial_start_date, created_at),
  trial_end_date      = COALESCE(trial_end_date, created_at + interval '7 days'),
  trial_used          = false
WHERE
  subscription_status IS NULL
  OR subscription_status = 'incomplete'
  OR subscription_status = '';

-- Mark trials that have already expired
UPDATE public.profiles
SET
  subscription_status = 'expired',
  trial_used = true
WHERE
  subscription_status = 'trialing'
  AND trial_end_date IS NOT NULL
  AND trial_end_date < now()
  AND email != 'mullahusen999@gmail.com';

-- ─── STEP 10: Profiles RLS — ensure read/write works ───
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
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
