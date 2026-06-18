-- =============================================================================
-- NORMALIZED RBAC, USER APPROVAL, MODULE ASSIGNMENT, AND USER REMOVAL
-- Run after supabase-schema.sql.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Supabase owns auth.users. This public table contains application user data
-- and is the "Users" source used by the Angular admin pages.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  mobile TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  country TEXT DEFAULT 'India',
  company TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  employment_type TEXT DEFAULT 'Salaried',
  currency TEXT DEFAULT 'INR',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roles are records, not hard-coded values in relationship tables.
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name ~ '^[a-z][a-z0-9_]*$'),
  display_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  route TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;

-- Upgrade the earlier text-role table without destroying existing assignments.
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.role_permissions
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

INSERT INTO public.roles (name, display_name, description, is_system)
VALUES
  ('admin', 'Administrator', 'Full system administration access.', TRUE),
  ('user', 'User', 'Standard approved application user.', TRUE)
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_system = TRUE;

INSERT INTO public.modules (key, name, description, route, icon, sort_order)
VALUES
  ('dashboard', 'Dashboard', 'Financial overview and summary.', '/dashboard', 'dashboard', 10),
  ('debts', 'Debts', 'Debt management.', '/debts', 'account_balance_wallet', 20),
  ('income', 'Income', 'Income source management.', '/income', 'attach_money', 30),
  ('expenses', 'Expenses', 'Expense management.', '/expenses', 'receipt_long', 40),
  ('transactions', 'Transactions', 'Unified transaction history.', '/transactions', 'compare_arrows', 50),
  ('reports', 'Reports', 'Reports and analytics.', '/reports', 'bar_chart', 60),
  ('profile', 'Profile', 'User profile.', '/profile', 'person', 70),
  ('settings', 'Settings', 'User preferences.', '/settings', 'settings', 80),
  ('subscription', 'Subscription', 'Subscription and plan details.', '/subscription', 'card_membership', 90)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    route = EXCLUDED.route,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.permissions (module_id, key, name, description)
VALUES
  (NULL, 'manage_users', 'Manage users', 'Approve, suspend, assign access, and remove users.'),
  (NULL, 'manage_roles', 'Manage roles', 'Assign roles and role permissions.'),
  (NULL, 'view_audit_logs', 'View audit logs', 'View administrator activity.'),
  (NULL, 'manage_subscriptions', 'Manage subscriptions', 'Manage plans and user subscriptions.')
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.permissions (module_id, key, name, description)
SELECT m.id, 'access_' || m.key, 'Access ' || m.name, 'Allows access to the ' || m.name || ' module.'
FROM public.modules m
ON CONFLICT (key) DO UPDATE SET module_id = EXCLUDED.module_id;

-- Migrate role values from the original role_permissions table, when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'role_permissions'
      AND column_name = 'role'
  ) THEN
    EXECUTE '
      UPDATE public.role_permissions rp
      SET role_id = r.id
      FROM public.roles r
      WHERE rp.role_id IS NULL AND rp.role = r.name
    ';
  END IF;
END;
$$;

DELETE FROM public.role_permissions WHERE role_id IS NULL;
ALTER TABLE public.role_permissions ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE public.role_permissions DROP COLUMN IF EXISTS role;
CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_permission_key
  ON public.role_permissions (role_id, permission_id);

-- Existing profiles receive a normalized role.
INSERT INTO public.user_roles (user_id, role_id)
SELECT p.user_id, r.id
FROM public.profiles p
JOIN public.roles r ON r.name = p.role
ON CONFLICT (user_id) DO UPDATE SET role_id = EXCLUDED.role_id;

-- Admin gets every permission. Users get module-access permissions.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'user' AND p.key LIKE 'access_%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Existing users start with all active modules to preserve current behavior.
INSERT INTO public.user_modules (user_id, module_id)
SELECT p.user_id, m.id
FROM public.profiles p
CROSS JOIN public.modules m
WHERE m.is_active = TRUE
ON CONFLICT (user_id, module_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = check_user_id
      AND r.name = 'admin'
      AND p.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_user(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = check_user_id AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.profiles pr ON pr.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND p.key = permission_key
      AND pr.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE (
  role_name TEXT,
  module_key TEXT,
  permission_key TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT r.name, m.key, p.key
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  JOIN public.profiles pr ON pr.user_id = ur.user_id
  LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
  LEFT JOIN public.permissions p ON p.id = rp.permission_id
  LEFT JOIN public.modules m ON m.id = p.module_id
  LEFT JOIN public.user_modules um
    ON um.user_id = ur.user_id AND um.module_id = m.id
  WHERE ur.user_id = auth.uid()
    AND pr.status = 'approved'
    AND (
      m.id IS NULL
      OR (m.is_active = TRUE AND (um.id IS NOT NULL OR r.name = 'admin'))
    );
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(target_user_id UUID, new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF new_status NOT IN ('pending', 'approved', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'Invalid user status';
  END IF;

  UPDATE public.profiles SET status = new_status WHERE user_id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.audit_log (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'update_status', target_user_id, jsonb_build_object('status', new_status));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_assign_user_role(target_user_id UUID, target_role_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role_name TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT name INTO target_role_name FROM public.roles WHERE id = target_role_id;
  IF target_role_name IS NULL THEN
    RAISE EXCEPTION 'Role not found';
  END IF;

  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  VALUES (target_user_id, target_role_id, auth.uid())
  ON CONFLICT (user_id) DO UPDATE
    SET role_id = EXCLUDED.role_id,
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = now();

  UPDATE public.profiles SET role = target_role_name WHERE user_id = target_user_id;

  INSERT INTO public.audit_log (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'assign_role', target_user_id, jsonb_build_object('role', target_role_name));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_module(
  target_user_id UUID,
  target_module_id UUID,
  enabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF enabled THEN
    INSERT INTO public.user_modules (user_id, module_id, assigned_by)
    VALUES (target_user_id, target_module_id, auth.uid())
    ON CONFLICT (user_id, module_id) DO NOTHING;
  ELSE
    DELETE FROM public.user_modules
    WHERE user_id = target_user_id AND module_id = target_module_id;
  END IF;

  INSERT INTO public.audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'assign_module',
    target_user_id,
    jsonb_build_object('module_id', target_module_id, 'enabled', enabled)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot remove their own account';
  END IF;

  INSERT INTO public.audit_log (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'remove_user', target_user_id, '{}'::jsonb);

  DELETE FROM auth.users WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_status(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_assign_user_role(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_module(UUID, UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_remove_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_user_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_module(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

-- Avoid recursive profile-policy checks and enforce approval at the database layer.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile (non-role/status fields)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_user());
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_profile_access_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_access_fields_before_update ON public.profiles;
CREATE TRIGGER protect_profile_access_fields_before_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_access_fields();

DROP POLICY IF EXISTS "Users can manage own income" ON public.income_sources;
DROP POLICY IF EXISTS "Approved users can manage own income" ON public.income_sources;
CREATE POLICY "Approved users can manage own income"
  ON public.income_sources FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_user());
DROP POLICY IF EXISTS "Admins can view all income" ON public.income_sources;
CREATE POLICY "Admins can view all income"
  ON public.income_sources FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can manage own debts" ON public.debts;
DROP POLICY IF EXISTS "Approved users can manage own debts" ON public.debts;
CREATE POLICY "Approved users can manage own debts"
  ON public.debts FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_user());
DROP POLICY IF EXISTS "Admins can view all debts" ON public.debts;
CREATE POLICY "Admins can view all debts"
  ON public.debts FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can manage own payments" ON public.payments;
DROP POLICY IF EXISTS "Approved users can manage own payments" ON public.payments;
CREATE POLICY "Approved users can manage own payments"
  ON public.payments FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_user());
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Approved users can manage own expenses" ON public.expenses;
CREATE POLICY "Approved users can manage own expenses"
  ON public.expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_user());
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.expenses;
CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
DROP POLICY IF EXISTS "Approved users can manage own goals" ON public.goals;
CREATE POLICY "Approved users can manage own goals"
  ON public.goals FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_user());
DROP POLICY IF EXISTS "Admins can view all goals" ON public.goals;
CREATE POLICY "Admins can view all goals"
  ON public.goals FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Approved users can manage own settings" ON public.user_settings;
CREATE POLICY "Approved users can manage own settings"
  ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_user());

-- Preserve audit history when an authentication account is deleted.
ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_admin_id_fkey;
ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_target_user_id_fkey;
ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_target_user_id_fkey
  FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.audit_log;
CREATE POLICY "Admins can insert audit log"
  ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Approved users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Approved users can view own subscription"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_user());
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage features" ON public.features;
CREATE POLICY "Admins can manage features"
  ON public.features FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage plan features" ON public.plan_features;
CREATE POLICY "Admins can manage plan features"
  ON public.plan_features FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'pending_users', (SELECT COUNT(*) FROM public.profiles WHERE status = 'pending'),
    'approved_users', (SELECT COUNT(*) FROM public.profiles WHERE status = 'approved'),
    'suspended_users', (SELECT COUNT(*) FROM public.profiles WHERE status = 'suspended'),
    'total_debts', (SELECT COUNT(*) FROM public.debts),
    'total_payments', (SELECT COUNT(*) FROM public.payments),
    'active_subscriptions', (SELECT COUNT(*) FROM public.user_subscriptions WHERE status = 'active')
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles"
  ON public.roles FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view modules" ON public.modules;
CREATE POLICY "Authenticated users can view modules"
  ON public.modules FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own modules" ON public.user_modules;
CREATE POLICY "Users can view own modules"
  ON public.user_modules FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage user modules" ON public.user_modules;
CREATE POLICY "Admins can manage user modules"
  ON public.user_modules FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- New signups automatically receive the User role and default modules.
CREATE OR REPLACE FUNCTION public.assign_default_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.user_id, id FROM public.roles WHERE name = 'user'
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_modules (user_id, module_id)
  SELECT NEW.user_id, id FROM public.modules WHERE is_active = TRUE
  ON CONFLICT (user_id, module_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_default_access_after_profile ON public.profiles;
CREATE TRIGGER assign_default_access_after_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_access();
