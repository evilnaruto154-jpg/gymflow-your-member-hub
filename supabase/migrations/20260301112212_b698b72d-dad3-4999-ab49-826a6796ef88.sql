
ALTER TABLE public.profiles ADD COLUMN trial_used boolean NOT NULL DEFAULT false;

-- When trial ends, mark trial as used so it can never be restarted
CREATE OR REPLACE FUNCTION public.check_and_lock_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If trial_end_date has passed and trial not yet marked used, lock it
  IF NEW.trial_end_date < now() AND NOT NEW.trial_used THEN
    NEW.trial_used := true;
    NEW.subscription_status := 'expired';
  END IF;
  -- Prevent resetting trial dates if trial was already used
  IF NEW.trial_used AND OLD.trial_used THEN
    NEW.trial_start_date := OLD.trial_start_date;
    NEW.trial_end_date := OLD.trial_end_date;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_one_time_trial
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_and_lock_trial();
