
-- ============================================================
-- One-time cleanup: delete dummy / test users
-- Keep: master admin + any user with members or logins
-- ============================================================
DO $$
DECLARE
  ids_to_delete uuid[];
BEGIN
  SELECT ARRAY_AGG(p.id) INTO ids_to_delete
  FROM public.profiles p
  WHERE p.email <> 'mullahusen999@gmail.com'
    AND COALESCE(p.login_count, 0) = 0
    AND NOT EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.payments pay WHERE pay.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.attendance a WHERE a.user_id = p.id);

  IF ids_to_delete IS NOT NULL THEN
    DELETE FROM public.user_roles    WHERE user_id = ANY(ids_to_delete);
    DELETE FROM public.notifications WHERE user_id = ANY(ids_to_delete);
    DELETE FROM public.expenses      WHERE user_id = ANY(ids_to_delete);
    DELETE FROM public.inventory     WHERE user_id = ANY(ids_to_delete);
    DELETE FROM public.login_events  WHERE user_id = ANY(ids_to_delete);
    DELETE FROM public.profiles      WHERE id      = ANY(ids_to_delete);
    DELETE FROM auth.users           WHERE id      = ANY(ids_to_delete);
  END IF;
END $$;
