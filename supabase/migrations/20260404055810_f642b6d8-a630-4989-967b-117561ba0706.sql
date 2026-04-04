
-- Admin function to list all profiles (master admin only)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only master admin can call this
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != 'mullahusen999@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

-- Admin function to update a user's subscription status
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
    subscription_plan = COALESCE(new_plan, subscription_plan),
    trial_used = CASE WHEN new_status IN ('expired', 'blocked') THEN true ELSE trial_used END
  WHERE id = target_user_id;
END;
$$;
