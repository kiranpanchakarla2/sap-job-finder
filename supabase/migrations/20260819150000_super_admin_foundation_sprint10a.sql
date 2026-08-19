-- Sprint 10A: Super Admin Foundation Migration
-- 1. Add 'super_admin' to public.app_role enum (committed first)
-- 2. Update profiles constraint for super_admin
-- 3. Add helper functions is_super_admin() and is_admin_or_super_admin()
-- 4. Update profiles RLS policies to allow super_admin full view and management
-- 5. Update existing admin RLS on contact_requests, payment_requests, subscriptions, jobs
-- 6. Provision / update super_admin role for ceo@bridgecoreit.com and cto@bridgecoreit.com

-- Note: In PostgreSQL, ALTER TYPE ADD VALUE must be committed before the new value is used in functions or constraints.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ---------------------------------------------------------------------------
-- 2. Update profiles check constraint
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_not_self_admin;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_valid;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_valid
  CHECK (role::text IN ('candidate', 'employer', 'admin', 'super_admin'));

-- ---------------------------------------------------------------------------
-- 3. Helper functions: is_super_admin and is_admin_or_super_admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role::text = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_super_admin() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 4. RLS on public.profiles for Super Admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;
CREATE POLICY "Super admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (auth.uid() = user_id));

DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
CREATE POLICY "Super admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (auth.uid() = user_id))
  WITH CHECK (public.is_admin_or_super_admin() OR (auth.uid() = user_id));

-- ---------------------------------------------------------------------------
-- 5. RLS on contact_requests, payment_requests, subscriptions for Super Admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super admins can read all contact requests" ON public.contact_requests;
CREATE POLICY "Super admins can read all contact requests"
  ON public.contact_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (user_id = auth.uid()));

DROP POLICY IF EXISTS "Super admins can update all contact requests" ON public.contact_requests;
CREATE POLICY "Super admins can update all contact requests"
  ON public.contact_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins can delete contact requests" ON public.contact_requests;
CREATE POLICY "Super admins can delete contact requests"
  ON public.contact_requests
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_super_admin());

-- Payment requests admin policies
DROP POLICY IF EXISTS "Super admins can read all payment requests" ON public.payment_requests;
CREATE POLICY "Super admins can read all payment requests"
  ON public.payment_requests
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_super_admin()
    OR (account_type = 'candidate' AND ((candidate_id = (SELECT current_candidate_id())) OR (user_id = auth.uid())))
    OR (account_type = 'employer' AND ((company_id = current_company_id()) OR (user_id = auth.uid())))
  );

DROP POLICY IF EXISTS "Super admins can update all payment requests" ON public.payment_requests;
CREATE POLICY "Super admins can update all payment requests"
  ON public.payment_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_super_admin());

-- Subscriptions admin policies
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (company_id = current_company_id()));

-- Candidate subscriptions admin policies
DROP POLICY IF EXISTS "Super admins can view all candidate subscriptions" ON public.candidate_subscriptions;
CREATE POLICY "Super admins can view all candidate subscriptions"
  ON public.candidate_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (candidate_id = (SELECT current_candidate_id())));

-- ---------------------------------------------------------------------------
-- 6. Update existing ceo@bridgecoreit.com and cto@bridgecoreit.com profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_role_change;

UPDATE public.profiles
SET role = 'super_admin'::public.app_role,
    first_name = coalesce(first_name, 'CEO'),
    last_name = coalesce(last_name, 'Admin'),
    updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'ceo@bridgecoreit.com'
) OR lower(email) = 'ceo@bridgecoreit.com';

UPDATE public.profiles
SET role = 'super_admin'::public.app_role,
    first_name = coalesce(first_name, 'CTO'),
    last_name = coalesce(last_name, 'Admin'),
    updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'cto@bridgecoreit.com'
) OR lower(email) = 'cto@bridgecoreit.com';

ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_role_change;
