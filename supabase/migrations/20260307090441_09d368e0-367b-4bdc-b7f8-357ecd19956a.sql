
-- Add trainer self-view policy (if not exists, use OR REPLACE pattern via drop+create)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Trainers can view own record' AND tablename = 'trainers') THEN
    CREATE POLICY "Trainers can view own record" ON public.trainers
      FOR SELECT USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Allow trainers to view members belonging to their owner
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Trainers can view owner members' AND tablename = 'members') THEN
    CREATE POLICY "Trainers can view owner members" ON public.members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.trainers t
          WHERE t.auth_user_id = auth.uid()
          AND t.owner_id = members.user_id
          AND t.status = 'active'
        )
      );
  END IF;
END $$;

-- Allow trainers to insert attendance for owner's members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Trainers can insert attendance' AND tablename = 'attendance') THEN
    CREATE POLICY "Trainers can insert attendance" ON public.attendance
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.trainers t
          WHERE t.auth_user_id = auth.uid()
          AND t.owner_id = attendance.user_id
          AND t.status = 'active'
        )
      );
  END IF;
END $$;

-- Allow trainers to view attendance for owner's members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Trainers can view owner attendance' AND tablename = 'attendance') THEN
    CREATE POLICY "Trainers can view owner attendance" ON public.attendance
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.trainers t
          WHERE t.auth_user_id = auth.uid()
          AND t.owner_id = attendance.user_id
          AND t.status = 'active'
        )
      );
  END IF;
END $$;
