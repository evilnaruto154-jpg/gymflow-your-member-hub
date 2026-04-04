
-- 1. Add login_provider column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_provider text DEFAULT 'email';

-- 2. Update handle_new_user to track login provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _provider text;
BEGIN
  -- Determine login provider from auth metadata
  _provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );
  
  INSERT INTO public.profiles (
    id, email, name, gym_name,
    subscription_status, trial_start_date, trial_end_date, trial_used,
    login_provider
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'gym_name', ''),
    'trialing',
    now(),
    now() + interval '7 days',
    false,
    _provider
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    login_provider = EXCLUDED.login_provider;
  
  RETURN NEW;
END;
$$;

-- 3. Re-create ALL triggers
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

CREATE OR REPLACE TRIGGER on_profile_insert_master_pro
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_master_pro();

CREATE OR REPLACE TRIGGER on_profile_update_trial_check
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_lock_trial();

CREATE OR REPLACE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Fix stale trial data — mark expired trials
UPDATE public.profiles
SET trial_used = true, subscription_status = 'expired'
WHERE subscription_status = 'trialing'
  AND trial_end_date < now()
  AND NOT trial_used;
