-- ============================================================
-- GymFlow Admin Panel — Complete Supabase Setup
-- ============================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This is the COMPLETE setup — run if you're setting up fresh
-- OR if users are not showing in the admin panel.
-- ============================================================

-- 1. admin_panel_list_profiles — bypasses RLS, works WITHOUT login
--    Used by the standalone admin panel (no Supabase session required)
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

-- Grant to anon (admin panel has no Supabase session)
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO authenticated;

-- 2. admin_update_profile — update user subscription (requires Supabase session as master)
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id uuid,
  new_status text,
  new_plan text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only master admin can call this
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != 'mullahusen999@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
  SET
    subscription_status = new_status,
    subscription_plan   = COALESCE(new_plan, subscription_plan),
    trial_used = CASE WHEN new_status IN ('expired', 'blocked') THEN true ELSE trial_used END
  WHERE id = target_user_id;
END;
$$;
