
-- =============================================
-- FIX: Drop ALL restrictive policies and recreate as PERMISSIVE
-- =============================================

-- MEMBERS
DROP POLICY IF EXISTS "Users can view their own members" ON public.members;
DROP POLICY IF EXISTS "Users can create their own members" ON public.members;
DROP POLICY IF EXISTS "Users can update their own members" ON public.members;
DROP POLICY IF EXISTS "Users can delete their own members" ON public.members;
DROP POLICY IF EXISTS "Trainers can view owner members" ON public.members;

CREATE POLICY "Users can view their own members" ON public.members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own members" ON public.members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own members" ON public.members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own members" ON public.members FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Trainers can view owner members" ON public.members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM trainers t WHERE t.auth_user_id = auth.uid() AND t.owner_id = members.user_id AND t.status = 'active'));

-- ATTENDANCE
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Trainers can view owner attendance" ON public.attendance;
DROP POLICY IF EXISTS "Trainers can insert attendance" ON public.attendance;

CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON public.attendance FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Trainers can view owner attendance" ON public.attendance FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM trainers t WHERE t.auth_user_id = auth.uid() AND t.owner_id = attendance.user_id AND t.status = 'active'));
CREATE POLICY "Trainers can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM trainers t WHERE t.auth_user_id = auth.uid() AND t.owner_id = attendance.user_id AND t.status = 'active'));

-- EXPENSES
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- INVENTORY
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;

CREATE POLICY "Users can view own inventory" ON public.inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON public.inventory FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PAYMENTS
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.payments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- TRAINERS
DROP POLICY IF EXISTS "Owners can view own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Owners can insert own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Owners can update own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Owners can delete own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Trainers can view own record" ON public.trainers;

CREATE POLICY "Owners can view own trainers" ON public.trainers FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert own trainers" ON public.trainers FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own trainers" ON public.trainers FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own trainers" ON public.trainers FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Trainers can view own record" ON public.trainers FOR SELECT TO authenticated USING (auth.uid() = auth_user_id);

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can delete roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Only owners can manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Only owners can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Only owners can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- RE-CREATE ALL MISSING TRIGGERS
-- =============================================

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE OR REPLACE TRIGGER on_profile_insert_master_pro
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_master_pro();

CREATE OR REPLACE TRIGGER on_profile_update_check_trial
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_and_lock_trial();

CREATE OR REPLACE TRIGGER on_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER on_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER on_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
