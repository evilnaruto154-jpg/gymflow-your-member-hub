
-- Create trigger: auto-create profile when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger: auto-assign role when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Create trigger: auto-grant master pro status when profile is inserted
CREATE OR REPLACE TRIGGER on_profile_insert_master_pro
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_master_pro();

-- Create trigger: lock trial if it expires
CREATE OR REPLACE TRIGGER on_profile_update_check_trial
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_and_lock_trial();

-- Create trigger: auto-update updated_at on members
CREATE OR REPLACE TRIGGER on_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger: auto-update updated_at on trainers
CREATE OR REPLACE TRIGGER on_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger: auto-update updated_at on inventory
CREATE OR REPLACE TRIGGER on_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
