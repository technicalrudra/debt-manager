-- Run this in the Supabase SQL Editor after:
-- 1. supabase/supabase-schema.sql
-- 2. supabase/RBAC_migration.sql
--
-- It promotes the earliest registered Supabase Auth user to administrator,
-- but only when there is currently no approved admin.
--
-- This is a privileged maintenance script. Run it from the Supabase Dashboard
-- SQL Editor, not through the app client, because it must bypass RLS to seed
-- the first admin role.
--
-- If the error says current role "authenticated", you are running this through
-- the app/client session or a restricted role selector. Open app.supabase.com,
-- choose this project, then use SQL Editor > New query as the project owner.

BEGIN;
SET LOCAL row_security = off;
ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_access_fields_before_update;

DO $$
DECLARE
  first_user_id UUID;
  first_profile_id UUID;
  first_user_email TEXT;
  admin_role_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = current_user
      AND (rolsuper OR rolbypassrls OR pg_has_role(current_user, 'postgres', 'member'))
  ) THEN
    RAISE EXCEPTION
      'Run this from the Supabase Dashboard SQL Editor as the project owner/postgres role. Current role "%" cannot bypass RLS.',
      current_user;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE role = 'admin' AND status = 'approved'
  ) THEN
    RAISE NOTICE 'An approved admin already exists. No changes made.';
    RETURN;
  END IF;

  SELECT id, user_id, email
  INTO first_profile_id, first_user_id, first_user_email
  FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1;

  IF first_user_id IS NULL THEN
    RAISE EXCEPTION 'No profiles found. Sign up once in the app, then run this script again.';
  END IF;

  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name = 'admin';

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role is missing. Run RBAC_migration.sql first.';
  END IF;

  UPDATE public.profiles
  SET role = 'admin',
      status = 'approved'
  WHERE id = first_profile_id;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (first_user_id, admin_role_id)
  ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      assigned_at = now();

  RAISE NOTICE 'Promoted % to approved admin.', first_user_email;
END;
$$;

ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_access_fields_before_update;
COMMIT;
