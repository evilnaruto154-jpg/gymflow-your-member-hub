
-- Trainers table: managed by gym owners
CREATE TABLE public.trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  trainer_name text NOT NULL,
  trainer_email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  auth_user_id uuid UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on trainer_email
ALTER TABLE public.trainers ADD CONSTRAINT trainers_trainer_email_unique UNIQUE (trainer_email);

-- Enable RLS
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with their trainers
CREATE POLICY "Owners can view own trainers" ON public.trainers
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own trainers" ON public.trainers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own trainers" ON public.trainers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own trainers" ON public.trainers
  FOR DELETE USING (auth.uid() = owner_id);

-- Updated_at trigger
CREATE TRIGGER update_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
