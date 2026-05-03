-- =============================================================
-- GymFlow — FIX INFINITE LOADING (RLS Cleanup)
-- =============================================================
-- Run this ENTIRE file in:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================================
-- This script DROPS ALL existing policies and recreates them
-- cleanly. It also adds MISSING policies for notifications
-- and payments tables (which were never set up).
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- STEP 1: ENABLE RLS ON ALL TABLES (safe, idempotent)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles    ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- STEP 2: DROP ALL EXISTING POLICIES (nuclear cleanup)
-- ─────────────────────────────────────────────────────────────

-- profiles
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- members
DROP POLICY IF EXISTS "Users can view their own members"   ON public.members;
DROP POLICY IF EXISTS "Users can create their own members" ON public.members;
DROP POLICY IF EXISTS "Users can update their own members" ON public.members;
DROP POLICY IF EXISTS "Users can delete their own members" ON public.members;
DROP POLICY IF EXISTS "Trainers can view owner members"    ON public.members;

-- attendance
DROP POLICY IF EXISTS "Users can view own attendance"       ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance"     ON public.attendance;
DROP POLICY IF EXISTS "Users can delete own attendance"     ON public.attendance;
DROP POLICY IF EXISTS "Trainers can view owner attendance"  ON public.attendance;
DROP POLICY IF EXISTS "Trainers can insert attendance"      ON public.attendance;

-- expenses
DROP POLICY IF EXISTS "Users can view own expenses"   ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

-- inventory
DROP POLICY IF EXISTS "Users can view own inventory"   ON public.inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;

-- notifications (THESE WERE MISSING — ROOT CAUSE)
DROP POLICY IF EXISTS "Users can view own notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- payments (THESE WERE MISSING — ROOT CAUSE)
DROP POLICY IF EXISTS "Users can view own payments"   ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;


-- ─────────────────────────────────────────────────────────────
-- STEP 3: CREATE CLEAN, SIMPLE POLICIES FOR ALL TABLES
-- ─────────────────────────────────────────────────────────────

-- === profiles ===
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- === members ===
CREATE POLICY "Users can view their own members"
  ON public.members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own members"
  ON public.members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own members"
  ON public.members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === attendance ===
CREATE POLICY "Users can view own attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance"
  ON public.attendance FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === expenses ===
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === inventory ===
CREATE POLICY "Users can view own inventory"
  ON public.inventory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON public.inventory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.inventory FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.inventory FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === notifications (NEW — was missing!) ===
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === payments (NEW — was missing!) ===
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
  ON public.payments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === user_roles ===
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- STEP 4: VERIFY — Run these to confirm everything is OK
-- ─────────────────────────────────────────────────────────────

-- Show all policies per table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
