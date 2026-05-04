-- =============================================================
-- GymFlow — COMPLETE DATABASE REPAIR
-- Fixes: broken triggers, missing functions, trial plan bug
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================================
-- SAFE: No references to inventory/members tables
-- IDEMPOTENT: Safe to run multiple times
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Ensure all required columns exist on profiles
-- ─────────────────────────────────────────────────────────────
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
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
  ADD COLUMN IF NOT EXISTS last_login_at         timestamptz,
  ADD COLUMN IF NOT EXISTS login_count           integer NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Login events table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own login events" ON public.login_events;
CREATE POLICY "Users can view own login events"
  ON public.login_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own login events" ON public.login_events;
CREATE POLICY "Users can insert own login events"
  ON public.login_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Ensure profiles RLS policies exist
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Recreate ALL core functions
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

-- 4b. handle_new_user — creates profile + 7-day PRO trial on signup
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
    id, email, name, gym_name,
    subscription_status, subscription_plan,
    trial_start_date, trial_end_date,
    trial_used, login_provider
  ) VALUES (
    NEW.id,
    NEW.email,
    _name,
    COALESCE(NEW.raw_user_meta_data->>'gym_name', ''),
    'trialing',
    'pro_trial',
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

-- 4c. handle_new_user_role — assigns 'owner' role on signup
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

-- 4d. auto_grant_master_pro — permanent pro for master admins
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

-- 4e. check_and_lock_trial — auto-expires trials
CREATE OR REPLACE FUNCTION public.check_and_lock_trial()
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
    RETURN NEW;
  END IF;

  IF NEW.subscription_status = 'trialing'
     AND NEW.trial_end_date IS NOT NULL
     AND NEW.trial_end_date < now() THEN
    NEW.subscription_status := 'expired';
    NEW.trial_used          := true;
  END IF;

  IF NEW.subscription_status IN ('expired', 'blocked') THEN
    NEW.trial_used := true;
  END IF;

  RETURN NEW;
END;
$$;

-- 4f. record_login_event
CREATE OR REPLACE FUNCTION public.record_login_event()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  INSERT INTO public.login_events (user_id, email) VALUES (_uid, _email);
  UPDATE public.profiles
     SET last_login_at = now(),
         login_count = COALESCE(login_count, 0) + 1
   WHERE id = _uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_login_event() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Admin panel functions
-- ─────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.admin_panel_list_profiles();
CREATE OR REPLACE FUNCTION public.admin_panel_list_profiles()
RETURNS TABLE (
  id uuid, name text, email text,
  subscription_plan text, subscription_status text,
  subscription_end_date timestamptz, trial_end_date timestamptz,
  trial_used boolean, created_at timestamptz, gym_name text,
  login_provider text, last_login_at timestamptz, login_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.email, p.subscription_plan, p.subscription_status,
    p.subscription_end_date, p.trial_end_date, p.trial_used,
    p.created_at, p.gym_name, p.login_provider,
    p.last_login_at, COALESCE(p.login_count, 0)
  FROM public.profiles p ORDER BY p.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_panel_get_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  WITH p AS (SELECT * FROM public.profiles),
  signups AS (
    SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
    FROM p WHERE created_at > now() - interval '30 days' GROUP BY 1
  ),
  logins AS (
    SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
    FROM public.login_events WHERE created_at > now() - interval '30 days' GROUP BY 1
  ),
  plan_dist AS (
    SELECT COALESCE(subscription_plan, 'none') AS plan, COUNT(*)::int AS n FROM p GROUP BY 1
  )
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM p),
    'active_subs', (SELECT COUNT(*) FROM p WHERE subscription_status='active'),
    'expired_subs', (SELECT COUNT(*) FROM p WHERE subscription_status IN ('expired','blocked')),
    'active_trials', (SELECT COUNT(*) FROM p WHERE subscription_status='trialing' AND (trial_end_date IS NULL OR trial_end_date > now())),
    'expired_trials', (SELECT COUNT(*) FROM p WHERE subscription_status='trialing' AND trial_end_date IS NOT NULL AND trial_end_date < now()),
    'total_logins', (SELECT COUNT(*) FROM public.login_events),
    'dau', (SELECT COUNT(DISTINCT user_id) FROM public.login_events WHERE created_at > now() - interval '1 day'),
    'mau', (SELECT COUNT(DISTINCT user_id) FROM public.login_events WHERE created_at > now() - interval '30 days'),
    'new_today', (SELECT COUNT(*) FROM p WHERE created_at > now() - interval '1 day'),
    'new_week', (SELECT COUNT(*) FROM p WHERE created_at > now() - interval '7 days'),
    'new_month', (SELECT COUNT(*) FROM p WHERE created_at > now() - interval '30 days'),
    'signup_series', COALESCE((SELECT jsonb_agg(jsonb_build_object('day',day,'n',n) ORDER BY day) FROM signups),'[]'::jsonb),
    'login_series', COALESCE((SELECT jsonb_agg(jsonb_build_object('day',day,'n',n) ORDER BY day) FROM logins),'[]'::jsonb),
    'plan_distribution', COALESCE((SELECT jsonb_agg(jsonb_build_object('plan',plan,'n',n)) FROM plan_dist),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_panel_get_stats() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id uuid, new_status text, new_plan text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN (
    'mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET
    subscription_status = new_status,
    subscription_plan   = COALESCE(new_plan, subscription_plan),
    trial_used = CASE WHEN new_status IN ('expired','blocked') THEN true ELSE trial_used END
  WHERE id = target_user_id;
END;
$$;

-- admin_list_profiles (compatibility)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN (
    'mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ─────────────────────────────────────────────────────────────
-- STEP 6: DROP & RECREATE ALL TRIGGERS (safely)
-- ─────────────────────────────────────────────────────────────

-- Drop triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created      ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Drop triggers on profiles
DROP TRIGGER IF EXISTS on_profile_insert_master_pro  ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_update_check_trial ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_update_trial_check ON public.profiles;

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

-- Recreate core triggers
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

-- Safely create triggers on optional tables
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
-- STEP 7: Fix existing user data
-- ─────────────────────────────────────────────────────────────

-- Fix users with plan='free' while trialing
UPDATE public.profiles SET subscription_plan = 'pro_trial'
WHERE subscription_status = 'trialing'
  AND (subscription_plan IS NULL OR subscription_plan IN ('free','free_trial',''))
  AND email NOT IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com');

-- Fix users with no status
UPDATE public.profiles SET
  subscription_status='trialing', subscription_plan='pro_trial',
  trial_start_date=COALESCE(trial_start_date,created_at),
  trial_end_date=COALESCE(trial_end_date,created_at+interval '7 days'),
  trial_used=false
WHERE (subscription_status IS NULL OR subscription_status IN ('','incomplete'))
  AND email NOT IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com');

-- Auto-expire overdue trials
UPDATE public.profiles SET subscription_status='expired', trial_used=true
WHERE subscription_status='trialing' AND trial_end_date IS NOT NULL AND trial_end_date < now()
  AND email NOT IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com');

-- Ensure master admins have active pro
UPDATE public.profiles SET
  subscription_status='active', subscription_plan='pro_yearly',
  subscription_end_date=now()+interval '100 years', trial_used=true
WHERE email IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com');

-- ─────────────────────────────────────────────────────────────
-- STEP 8: Verification
-- ─────────────────────────────────────────────────────────────

-- Check all functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema='public' AND routine_name IN (
  'handle_new_user','handle_new_user_role','auto_grant_master_pro',
  'check_and_lock_trial','record_login_event','admin_panel_list_profiles',
  'admin_panel_get_stats','admin_update_profile','has_role'
) ORDER BY routine_name;

-- Check all triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema IN ('public','auth')
  AND trigger_name IN (
    'on_auth_user_created','on_auth_user_created_role',
    'on_profile_insert_master_pro','on_profile_update_check_trial'
  ) ORDER BY trigger_name;

-- Show profile status summary
SELECT email, subscription_status, subscription_plan, trial_used
FROM public.profiles ORDER BY created_at DESC;
