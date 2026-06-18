-- Replace the email, then run this after RBAC_migration.sql.
DO $$
DECLARE
  admin_email TEXT := 'your-email@example.com';
  admin_user_id UUID;
  admin_role_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE lower(email) = lower(admin_email);

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No Supabase Auth user found for email %', admin_email;
  END IF;

  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name = 'admin';

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role is missing. Run RBAC_migration.sql first.';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, role, status)
  SELECT
    admin_user_id,
    COALESCE(raw_user_meta_data ->> 'full_name', ''),
    email,
    'admin',
    'approved'
  FROM auth.users
  WHERE id = admin_user_id
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin',
      status = 'approved',
      email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (admin_user_id, admin_role_id)
  ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      assigned_at = now();
END;
$$;
