-- Run in Supabase SQL Editor after RBAC_migration.sql.
-- It reports whether the tables needed by the admin pages exist.

SELECT
  required.table_name,
  CASE
    WHEN tables.table_name IS NULL THEN 'MISSING'
    ELSE 'READY'
  END AS status
FROM (
  VALUES
    ('profiles'),
    ('roles'),
    ('permissions'),
    ('role_permissions'),
    ('modules'),
    ('user_roles'),
    ('user_modules')
) AS required(table_name)
LEFT JOIN information_schema.tables tables
  ON tables.table_schema = 'public'
 AND tables.table_name = required.table_name
ORDER BY required.table_name;

-- Login accounts are managed by Supabase and intentionally live in auth.users.
SELECT
  au.id,
  au.email,
  p.full_name,
  p.status,
  r.name AS role
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.roles r ON r.id = ur.role_id
ORDER BY au.created_at DESC;
