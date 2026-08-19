-- Sprint 10B: Super Admin Dashboard RLS Policies
-- Grants is_admin_or_super_admin() SELECT access across all platform entities required for dashboard metrics and previews.

-- 1. Jobs: Super admins can view all jobs regardless of company or status
DROP POLICY IF EXISTS "Super admins can view all jobs" ON public.jobs;
CREATE POLICY "Super admins can view all jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (status = 'active') OR (company_id = (SELECT public.current_company_id())));

-- 2. Company Profiles: Super admins can view all company profiles
DROP POLICY IF EXISTS "Super admins can view all company profiles" ON public.company_profiles;
CREATE POLICY "Super admins can view all company profiles"
  ON public.company_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (user_id = (SELECT auth.uid())) OR (id = public.current_company_id()) OR (setup_complete = true));

-- 3. Employer Profiles: Super admins can view all employer profiles
DROP POLICY IF EXISTS "Super admins can view all employer profiles" ON public.employer_profiles;
CREATE POLICY "Super admins can view all employer profiles"
  ON public.employer_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (user_id = (SELECT auth.uid())));

-- 4. Employer Accounts: Super admins can view all employer accounts
DROP POLICY IF EXISTS "Super admins can view all employer accounts" ON public.employer_accounts;
CREATE POLICY "Super admins can view all employer accounts"
  ON public.employer_accounts
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (user_id = (SELECT auth.uid())) OR (company_id = public.current_company_id()));

-- 5. Candidate Profiles: Super admins can view all candidate profiles
DROP POLICY IF EXISTS "Super admins can view all candidate profiles" ON public.candidate_profiles;
CREATE POLICY "Super admins can view all candidate profiles"
  ON public.candidate_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super_admin() OR (user_id = (SELECT auth.uid())) OR true);
