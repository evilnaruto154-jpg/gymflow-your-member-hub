
CREATE OR REPLACE FUNCTION public.auto_grant_master_pro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'mullahusen999@gmail.com' THEN
    NEW.subscription_status := 'active';
    NEW.subscription_plan := 'pro_monthly';
    NEW.subscription_end_date := now() + interval '30 days';
    NEW.trial_used := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_master_profile_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_master_pro();
