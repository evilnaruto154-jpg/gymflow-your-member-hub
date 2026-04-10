
-- Drop all RLS policies on trainers table
DROP POLICY IF EXISTS "Owners can view own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Owners can insert own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Owners can update own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Owners can delete own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Trainers can view own record" ON public.trainers;

-- Drop trainer-related RLS policies on other tables
DROP POLICY IF EXISTS "Trainers can view owner attendance" ON public.attendance;
DROP POLICY IF EXISTS "Trainers can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Trainers can view owner members" ON public.members;

-- Drop the trainers table
DROP TABLE IF EXISTS public.trainers;

-- Drop policies that depend on has_role
DROP POLICY IF EXISTS "Only owners can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can delete roles" ON public.user_roles;

-- Drop has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Drop triggers on auth.users that depend on handle_new_user_role
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;

-- Drop handle_new_user_role function
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Update any trainer roles to staff
UPDATE public.user_roles SET role = 'staff' WHERE role = 'trainer';

-- Recreate enum without trainer
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('owner', 'staff');

ALTER TABLE public.user_roles 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role,
  ALTER COLUMN role SET DEFAULT 'owner'::public.app_role;

DROP TYPE public.app_role_old;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Recreate handle_new_user_role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'signup_role')::app_role,
    'owner'::app_role
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate trigger on auth.users
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Recreate RLS policies on user_roles
CREATE POLICY "Only owners can manage roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Only owners can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Only owners can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));
