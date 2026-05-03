-- =============================================================
-- GymFlow — FIX SCHEMA + CREATE 3 MASTER ADMIN ACCOUNTS
-- =============================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- IDEMPOTENT — Safe to run multiple times
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- STEP 1: ADD MISSING COLUMNS TO profiles TABLE
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email                    text,
  ADD COLUMN IF NOT EXISTS name                     text,
  ADD COLUMN IF NOT EXISTS gym_name                 text DEFAULT '',
  ADD COLUMN IF NOT EXISTS subscription_end_date    timestamptz,
  ADD COLUMN IF NOT EXISTS login_provider           text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS razorpay_customer_id     text,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;

-- Ensure created_at exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 2: NOTIFY POSTGREST TO RELOAD SCHEMA CACHE
-- (Fixes "Database error querying schema" immediately)
-- ─────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';


-- ─────────────────────────────────────────────────────────────
-- STEP 3: BACKFILL email from auth.users for existing profiles
-- ─────────────────────────────────────────────────────────────

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Safely backfill name from first_name/last_name if those columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    EXECUTE '
      UPDATE public.profiles
      SET name = TRIM(COALESCE(first_name, '''') || '' '' || COALESCE(last_name, ''''))
      WHERE (name IS NULL OR name = '''')
        AND (first_name IS NOT NULL OR last_name IS NOT NULL)
    ';
    RAISE NOTICE 'Backfilled name from first_name + last_name';
  ELSE
    RAISE NOTICE 'No first_name column found, skipping name backfill';
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 4: CREATE 3 MASTER ADMIN AUTH USERS + PROFILES + ROLES
-- ─────────────────────────────────────────────────────────────
-- CREDENTIALS:
--   admin1@gymflow.com / GymFlow@Admin#2026!
--   admin2@gymflow.com / GymFlow@Secure#2026!
--   admin3@gymflow.com / GymFlow@Master#2026!
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  _id1 uuid;
  _id2 uuid;
  _id3 uuid;
  _now timestamptz := now();
  _sub_end timestamptz := now() + interval '365 days';
BEGIN

  -- ── Look up existing users ──
  SELECT id INTO _id1 FROM auth.users WHERE email = 'admin1@gymflow.com';
  SELECT id INTO _id2 FROM auth.users WHERE email = 'admin2@gymflow.com';
  SELECT id INTO _id3 FROM auth.users WHERE email = 'admin3@gymflow.com';

  -- ══════════════ ADMIN 1 ══════════════
  IF _id1 IS NULL THEN
    _id1 := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at
    ) VALUES (
      _id1, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin1@gymflow.com',
      crypt('GymFlow@Admin#2026!', gen_salt('bf', 10)),
      _now, _now,
      jsonb_build_object('provider', 'email', 'providers', array['email']::text[]),
      jsonb_build_object('full_name', 'Rajesh Kumar', 'signup_role', 'owner'),
      false, _now, _now
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _id1, jsonb_build_object('sub', _id1::text, 'email', 'admin1@gymflow.com'), 'email', _id1::text, _now, _now, _now);
    RAISE NOTICE '✅ ADMIN 1 created in auth.users';
  ELSE
    RAISE NOTICE '⚠️ ADMIN 1 already exists (ID: %)', _id1;
  END IF;

  -- ══════════════ ADMIN 2 ══════════════
  IF _id2 IS NULL THEN
    _id2 := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at
    ) VALUES (
      _id2, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin2@gymflow.com',
      crypt('GymFlow@Secure#2026!', gen_salt('bf', 10)),
      _now, _now,
      jsonb_build_object('provider', 'email', 'providers', array['email']::text[]),
      jsonb_build_object('full_name', 'Priya Sharma', 'signup_role', 'owner'),
      false, _now, _now
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _id2, jsonb_build_object('sub', _id2::text, 'email', 'admin2@gymflow.com'), 'email', _id2::text, _now, _now, _now);
    RAISE NOTICE '✅ ADMIN 2 created in auth.users';
  ELSE
    RAISE NOTICE '⚠️ ADMIN 2 already exists (ID: %)', _id2;
  END IF;

  -- ══════════════ ADMIN 3 ══════════════
  IF _id3 IS NULL THEN
    _id3 := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at
    ) VALUES (
      _id3, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin3@gymflow.com',
      crypt('GymFlow@Master#2026!', gen_salt('bf', 10)),
      _now, _now,
      jsonb_build_object('provider', 'email', 'providers', array['email']::text[]),
      jsonb_build_object('full_name', 'Vikram Patel', 'signup_role', 'owner'),
      false, _now, _now
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _id3, jsonb_build_object('sub', _id3::text, 'email', 'admin3@gymflow.com'), 'email', _id3::text, _now, _now, _now);
    RAISE NOTICE '✅ ADMIN 3 created in auth.users';
  ELSE
    RAISE NOTICE '⚠️ ADMIN 3 already exists (ID: %)', _id3;
  END IF;

  -- ─── CREATE PROFILES ───
  INSERT INTO public.profiles (id, email, name, gym_name, subscription_status, subscription_plan, subscription_end_date, trial_start_date, trial_end_date, trial_used, login_provider)
  VALUES (_id1, 'admin1@gymflow.com', 'Rajesh Kumar', 'GymFlow HQ', 'active', 'pro_yearly', _sub_end, _now, _now, true, 'email')
  ON CONFLICT (id) DO UPDATE SET
    email = 'admin1@gymflow.com', name = 'Rajesh Kumar',
    subscription_status = 'active', subscription_plan = 'pro_yearly',
    subscription_end_date = _sub_end, trial_used = true;

  INSERT INTO public.profiles (id, email, name, gym_name, subscription_status, subscription_plan, subscription_end_date, trial_start_date, trial_end_date, trial_used, login_provider)
  VALUES (_id2, 'admin2@gymflow.com', 'Priya Sharma', 'GymFlow HQ', 'active', 'pro_yearly', _sub_end, _now, _now, true, 'email')
  ON CONFLICT (id) DO UPDATE SET
    email = 'admin2@gymflow.com', name = 'Priya Sharma',
    subscription_status = 'active', subscription_plan = 'pro_yearly',
    subscription_end_date = _sub_end, trial_used = true;

  INSERT INTO public.profiles (id, email, name, gym_name, subscription_status, subscription_plan, subscription_end_date, trial_start_date, trial_end_date, trial_used, login_provider)
  VALUES (_id3, 'admin3@gymflow.com', 'Vikram Patel', 'GymFlow HQ', 'active', 'pro_yearly', _sub_end, _now, _now, true, 'email')
  ON CONFLICT (id) DO UPDATE SET
    email = 'admin3@gymflow.com', name = 'Vikram Patel',
    subscription_status = 'active', subscription_plan = 'pro_yearly',
    subscription_end_date = _sub_end, trial_used = true;

  RAISE NOTICE '✅ All 3 profiles created with Premium (pro_yearly) active for 365 days';

  -- ─── ASSIGN OWNER ROLES ───
  INSERT INTO public.user_roles (user_id, role) VALUES (_id1, 'owner'::public.app_role) ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_id2, 'owner'::public.app_role) ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_id3, 'owner'::public.app_role) ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE '✅ All 3 roles assigned: owner';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '  ALL 3 MASTER ADMIN ACCOUNTS CREATED SUCCESSFULLY';
  RAISE NOTICE '══════════════════════════════════════════════════';
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 5: UPDATE TRIGGER FUNCTIONS
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_grant_master_pro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com') THEN
    NEW.subscription_status   := 'active';
    NEW.subscription_plan     := 'pro_yearly';
    NEW.subscription_end_date := now() + interval '365 days';
    NEW.trial_used            := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_lock_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com') THEN
    RETURN NEW;
  END IF;
  IF NEW.subscription_status = 'trialing' AND NEW.trial_end_date IS NOT NULL AND NEW.trial_end_date < now() THEN
    NEW.subscription_status := 'expired';
    NEW.trial_used := true;
  END IF;
  IF NEW.subscription_status IN ('expired', 'blocked') THEN
    NEW.trial_used := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_profile(target_user_id uuid, new_status text, new_plan text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) NOT IN ('mullahusen999@gmail.com','admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET
    subscription_status = new_status,
    subscription_plan = COALESCE(new_plan, subscription_plan),
    trial_used = CASE WHEN new_status IN ('expired','blocked') THEN true ELSE trial_used END
  WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_panel_list_profiles()
RETURNS TABLE (
  id uuid, name text, email text,
  subscription_plan text, subscription_status text,
  subscription_end_date timestamptz, trial_end_date timestamptz,
  trial_used boolean, created_at timestamptz,
  gym_name text, login_provider text
) LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.email, p.subscription_plan, p.subscription_status,
    p.subscription_end_date, p.trial_end_date, p.trial_used, p.created_at,
    p.gym_name, p.login_provider
  FROM public.profiles p ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _provider text;
  _name text;
BEGIN
  _provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  INSERT INTO public.profiles (id, email, name, gym_name, subscription_status, subscription_plan, trial_start_date, trial_end_date, trial_used, login_provider)
  VALUES (NEW.id, NEW.email, _name, COALESCE(NEW.raw_user_meta_data->>'gym_name',''), 'trialing', 'free', now(), now() + interval '7 days', false, _provider)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE WHEN profiles.name IS NULL OR profiles.name = '' THEN EXCLUDED.name ELSE profiles.name END,
    login_provider = EXCLUDED.login_provider;
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- STEP 6: FORCE PREMIUM FOR ALL MASTER ADMINS (final safety net)
-- ─────────────────────────────────────────────────────────────

UPDATE public.profiles SET
  subscription_status   = 'active',
  subscription_plan     = 'pro_yearly',
  subscription_end_date = now() + interval '365 days',
  trial_used            = true
WHERE email IN ('admin1@gymflow.com','admin2@gymflow.com','admin3@gymflow.com','mullahusen999@gmail.com');


-- ─────────────────────────────────────────────────────────────
-- STEP 7: RELOAD POSTGREST SCHEMA CACHE (CRITICAL!)
-- This fixes "Database error querying schema"
-- ─────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';


-- ─────────────────────────────────────────────────────────────
-- STEP 8: VERIFY
-- ─────────────────────────────────────────────────────────────

SELECT p.id, p.email, p.name, p.subscription_status, p.subscription_plan, p.subscription_end_date, p.trial_used
FROM public.profiles p
WHERE p.email IN ('admin1@gymflow.com', 'admin2@gymflow.com', 'admin3@gymflow.com')
ORDER BY p.email;
