-- 1. Profile login-tracking columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;

-- 2. login_events table
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own login events" ON public.login_events;
CREATE POLICY "Users can view own login events"
  ON public.login_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own login events" ON public.login_events;
CREATE POLICY "Users can insert own login events"
  ON public.login_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at DESC);

-- 4. record_login_event RPC
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

-- 5. Force OWNER-only role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 6. Backfill missing OWNER roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'owner'::app_role
WHERE r.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Updated admin profile listing with login data
DROP FUNCTION IF EXISTS public.admin_panel_list_profiles();
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
  login_provider text,
  last_login_at timestamptz,
  login_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.email,
    p.subscription_plan, p.subscription_status,
    p.subscription_end_date, p.trial_end_date, p.trial_used,
    p.created_at, p.gym_name, p.login_provider,
    p.last_login_at, COALESCE(p.login_count, 0)
  FROM public.profiles p
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_panel_list_profiles() TO anon, authenticated;

-- 8. admin_panel_get_stats — aggregated KPIs and time-series
CREATE OR REPLACE FUNCTION public.admin_panel_get_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH p AS (SELECT * FROM public.profiles),
  signups AS (
    SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
    FROM p
    WHERE created_at > now() - interval '30 days'
    GROUP BY 1
  ),
  logins AS (
    SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
    FROM public.login_events
    WHERE created_at > now() - interval '30 days'
    GROUP BY 1
  ),
  plan_dist AS (
    SELECT COALESCE(subscription_plan, 'none') AS plan, COUNT(*)::int AS n
    FROM p GROUP BY 1
  )
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM p),
    'active_subs', (SELECT COUNT(*) FROM p WHERE subscription_status='active' AND (subscription_end_date IS NULL OR subscription_end_date > now())),
    'expired_subs', (SELECT COUNT(*) FROM p WHERE subscription_status NOT IN ('active','trialing') OR (subscription_end_date IS NOT NULL AND subscription_end_date < now() AND subscription_status='active')),
    'active_trials', (SELECT COUNT(*) FROM p WHERE subscription_status='trialing' AND trial_end_date > now()),
    'expired_trials', (SELECT COUNT(*) FROM p WHERE trial_used = true OR (trial_end_date IS NOT NULL AND trial_end_date < now() AND subscription_status='trialing')),
    'total_logins', (SELECT COUNT(*) FROM public.login_events),
    'dau', (SELECT COUNT(DISTINCT user_id) FROM public.login_events WHERE created_at > now() - interval '1 day'),
    'mau', (SELECT COUNT(DISTINCT user_id) FROM public.login_events WHERE created_at > now() - interval '30 days'),
    'new_today', (SELECT COUNT(*) FROM p WHERE created_at > now() - interval '1 day'),
    'new_week', (SELECT COUNT(*) FROM p WHERE created_at > now() - interval '7 days'),
    'new_month', (SELECT COUNT(*) FROM p WHERE created_at > now() - interval '30 days'),
    'paid_users', (SELECT COUNT(*) FROM p WHERE subscription_status='active' AND subscription_plan IS NOT NULL AND subscription_plan <> 'free'),
    'trial_started_total', (SELECT COUNT(*) FROM p WHERE trial_end_date IS NOT NULL),
    'signup_series', COALESCE((SELECT jsonb_agg(jsonb_build_object('day', day, 'n', n) ORDER BY day) FROM signups), '[]'::jsonb),
    'login_series', COALESCE((SELECT jsonb_agg(jsonb_build_object('day', day, 'n', n) ORDER BY day) FROM logins), '[]'::jsonb),
    'plan_distribution', COALESCE((SELECT jsonb_agg(jsonb_build_object('plan', plan, 'n', n)) FROM plan_dist), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_panel_get_stats() TO anon, authenticated;