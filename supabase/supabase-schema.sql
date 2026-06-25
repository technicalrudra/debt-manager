-- =============================================================================
-- DEBT MANAGER SAAS — COMPLETE SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================

-- =====================
-- 1. PROFILES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================
-- 2. INCOME SOURCES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'Salary',
  source_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  frequency TEXT DEFAULT 'Monthly',
  recurring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 3. DEBTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Loan',
  lender TEXT DEFAULT 'Other',
  original_amount NUMERIC(14, 2) DEFAULT 0,
  current_balance NUMERIC(14, 2) DEFAULT 0,
  interest_rate NUMERIC(5, 2) DEFAULT 0,
  emi NUMERIC(12, 2) DEFAULT 0,
  tenure INTEGER DEFAULT 12,
  due_date INTEGER DEFAULT 5,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 4. PAYMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
  debt_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT DEFAULT 'Bank Transfer',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 5. EXPENSES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  frequency TEXT DEFAULT 'Monthly',
  start_date DATE DEFAULT CURRENT_DATE,
  recurring BOOLEAN DEFAULT TRUE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 6. GOALS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(14, 2) DEFAULT 0,
  target_date DATE,
  monthly_required NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paused')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 7. SETTINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_reminders BOOLEAN DEFAULT TRUE,
  due_date_alerts BOOLEAN DEFAULT TRUE,
  dark_mode BOOLEAN DEFAULT FALSE,
  compact_view BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================
-- 8. SUBSCRIPTION PLANS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_monthly NUMERIC(10, 2) DEFAULT 0,
  price_yearly NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  max_debts INTEGER DEFAULT 5,
  max_income_sources INTEGER DEFAULT 3,
  max_goals INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 9. USER SUBSCRIPTIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  activated_by UUID REFERENCES auth.users(id),
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================
-- 10. FEATURES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 11. PLAN FEATURES (Many-to-Many)
-- =====================
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

-- =====================
-- 12. AUDIT LOG TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the Free plan ID
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'free' LIMIT 1;

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    'user',
    'pending'
  );

  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  -- Assign free plan if available
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, free_plan_id, 'active');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['profiles', 'income_sources', 'debts', 'expenses', 'goals', 'user_settings', 'subscription_plans', 'user_subscriptions'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', tbl);
  END LOOP;
END;
$$;

-- Function to get user's enabled features
CREATE OR REPLACE FUNCTION public.get_user_features(p_user_id UUID)
RETURNS TABLE(feature_key TEXT, feature_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT f.key, f.name
  FROM public.features f
  JOIN public.plan_features pf ON pf.feature_id = f.id AND pf.enabled = TRUE
  JOIN public.user_subscriptions us ON us.plan_id = pf.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND f.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Make this schema safe to run more than once.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (tablename = 'profiles' AND policyname IN (
          'Users can view own profile',
          'Users can update own profile (non-role/status fields)',
          'Admins can view all profiles',
          'Admins can update any profile'
        ))
        OR (tablename = 'income_sources' AND policyname IN (
          'Users can manage own income',
          'Admins can view all income'
        ))
        OR (tablename = 'debts' AND policyname IN (
          'Users can manage own debts',
          'Admins can view all debts'
        ))
        OR (tablename = 'payments' AND policyname IN (
          'Users can manage own payments',
          'Admins can view all payments'
        ))
        OR (tablename = 'expenses' AND policyname IN (
          'Users can manage own expenses',
          'Admins can view all expenses'
        ))
        OR (tablename = 'goals' AND policyname IN (
          'Users can manage own goals',
          'Admins can view all goals'
        ))
        OR (tablename = 'user_settings' AND policyname = 'Users can manage own settings')
        OR (tablename = 'subscription_plans' AND policyname IN (
          'Anyone can view active plans',
          'Admins can manage plans'
        ))
        OR (tablename = 'user_subscriptions' AND policyname IN (
          'Users can view own subscription',
          'Admins can manage all subscriptions'
        ))
        OR (tablename = 'features' AND policyname IN (
          'Anyone can view features',
          'Admins can manage features'
        ))
        OR (tablename = 'plan_features' AND policyname IN (
          'Anyone can view plan features',
          'Admins can manage plan features'
        ))
        OR (tablename = 'audit_log' AND policyname IN (
          'Admins can view audit log',
          'Admins can insert audit log'
        ))
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END;
$$;

-- --------------------
-- PROFILES
-- --------------------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile (non-role/status fields)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
    AND status = (SELECT status FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- INCOME SOURCES
-- --------------------
CREATE POLICY "Users can manage own income"
  ON public.income_sources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all income"
  ON public.income_sources FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- DEBTS
-- --------------------
CREATE POLICY "Users can manage own debts"
  ON public.debts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all debts"
  ON public.debts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- PAYMENTS
-- --------------------
CREATE POLICY "Users can manage own payments"
  ON public.payments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- EXPENSES
-- --------------------
CREATE POLICY "Users can manage own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- GOALS
-- --------------------
CREATE POLICY "Users can manage own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all goals"
  ON public.goals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- USER SETTINGS
-- --------------------
CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------
-- SUBSCRIPTION PLANS (Read-only for users, writable for admins)
-- --------------------
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- USER SUBSCRIPTIONS
-- --------------------
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- FEATURES (Read-only for users)
-- --------------------
CREATE POLICY "Anyone can view features"
  ON public.features FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage features"
  ON public.features FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- PLAN FEATURES
-- --------------------
CREATE POLICY "Anyone can view plan features"
  ON public.plan_features FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage plan features"
  ON public.plan_features FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- --------------------
-- AUDIT LOG
-- --------------------
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Subscription Plans
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, max_debts, max_income_sources, max_goals, sort_order)
VALUES
  ('free', 'Free', 'Basic debt tracking for individuals getting started.', 0, 0, 5, 3, 3, 1),
  ('pro', 'Pro', 'Advanced analytics, reports, and unlimited tracking.', 499, 4999, 50, 20, 20, 2),
  ('business', 'Business', 'Full suite with priority support and team features.', 999, 9999, -1, -1, -1, 3)
ON CONFLICT (name) DO NOTHING;

-- Features
INSERT INTO public.features (key, name, description)
VALUES
  ('dashboard', 'Dashboard', 'Main dashboard with KPIs and charts'),
  ('debts', 'Debt Management', 'Full debt CRUD and tracking'),
  ('payments', 'Payment Tracking', 'Record and manage payments'),
  ('expenses', 'Expense Tracking', 'Track and categorize expenses'),
  ('reports', 'Reports & Analytics', 'Advanced charts and report generation'),
  ('goals', 'Financial Goals', 'Set and track financial goals'),
  ('settings', 'Settings', 'Application settings and preferences'),
  ('export', 'Data Export', 'Export data to CSV/PDF'),
  ('realtime', 'Realtime Updates', 'Live data sync across devices'),
  ('priority_support', 'Priority Support', 'Dedicated support channel')
ON CONFLICT (key) DO NOTHING;

-- Plan-Feature Mappings
-- Free: dashboard, debts, payments, settings
INSERT INTO public.plan_features (plan_id, feature_id, enabled)
SELECT sp.id, f.id, TRUE
FROM public.subscription_plans sp
CROSS JOIN public.features f
WHERE sp.name = 'free'
  AND f.key IN ('dashboard', 'debts', 'payments', 'settings')
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- Pro: everything except priority_support
INSERT INTO public.plan_features (plan_id, feature_id, enabled)
SELECT sp.id, f.id, TRUE
FROM public.subscription_plans sp
CROSS JOIN public.features f
WHERE sp.name = 'pro'
  AND f.key IN ('dashboard', 'debts', 'payments', 'expenses', 'reports', 'goals', 'settings', 'export', 'realtime')
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- Business: everything
INSERT INTO public.plan_features (plan_id, feature_id, enabled)
SELECT sp.id, f.id, TRUE
FROM public.subscription_plans sp
CROSS JOIN public.features f
WHERE sp.name = 'business'
ON CONFLICT (plan_id, feature_id) DO NOTHING;


-- =============================================================================
-- ADMIN SEED
-- After you register the first user, run this to make them admin:
-- UPDATE public.profiles SET role = 'admin', status = 'approved' WHERE email = 'YOUR_EMAIL@example.com';
-- =============================================================================

-- Enable Realtime for key tables. Skip tables already in the publication.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['debts', 'payments', 'expenses', 'profiles']
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        table_name
      );
    END IF;
  END LOOP;
END;
$$;
