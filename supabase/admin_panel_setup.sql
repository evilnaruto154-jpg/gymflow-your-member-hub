-- ============================================================
-- GymFlow Admin Panel — Supabase Setup
-- ============================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This creates a SECURITY DEFINER function that the admin panel
-- can call to fetch all profiles without needing a user session.
-- ============================================================

-- 1. Create admin panel function (bypasses RLS safely)
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
  FROM profiles p
  ORDER BY p.created_at DESC;
$$;

-- 2. Grant execute permission to anon role (so it works without login)
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO authenticated;
