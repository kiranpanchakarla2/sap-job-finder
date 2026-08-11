-- Verification scenarios for employer tenant alignment.
-- Run manually in Supabase SQL editor (service role) after seeding test users.
-- Does not mutate production auth users; uses structural assertions where possible.

-- ---------------------------------------------------------------------------
-- 0) Structural sanity
-- ---------------------------------------------------------------------------
do $$
begin
  assert (select count(*) from public.employer_accounts) >= 1,
    'expected at least one backfilled employer_accounts row';

  assert exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'assigned_to'
  ), 'jobs.assigned_to missing';

  assert exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'saved_candidates' and column_name = 'saved_by'
  ), 'saved_candidates.saved_by missing';

  assert (
    select count(*) = 0
    from public.company_profiles c
    where not exists (
      select 1 from public.employer_accounts ea
      where ea.company_id = c.id
        and ea.user_id = c.user_id
        and ea.role = 'owner'
        and ea.status = 'active'
    )
  ), 'every company_profiles founding user must have an active owner membership';

  raise notice 'Structural assertions passed';
end $$;

-- ---------------------------------------------------------------------------
-- 1) Same-company assignment validation
-- ---------------------------------------------------------------------------
-- Expect failure when assigning a job to an employer_account from another company.
-- Uncomment and substitute real UUIDs when running cross-company tests:
--
-- update public.jobs
-- set assigned_to = '<company_b_employer_account_id>'
-- where id = '<company_a_job_id>';
-- → should raise: assigned_to must be an active employer account in the same company

-- ---------------------------------------------------------------------------
-- 2) Role matrix checklist (manual with test auth.uid())
-- ---------------------------------------------------------------------------
-- Company A: owner, recruiter, hiring_manager
-- Job 1: created_by = recruiter user, assigned_to = hiring_manager account
-- Job 2: created_by = other recruiter, assigned_to = other HM
--
-- As owner:    can_access_job(job1)=true, can_manage_job(job1)=true
-- As recruiter: can_access_job(job1)=true, can_manage_job(job1)=true,
--               can_access_job(job2)=false (peer recruiter job)
-- As HM:       can_access_job(job1)=true, can_manage_job(job1)=false,
--               can_access_job(job2)=false
--
-- Company B employer: current_company_id() must not equal Company A id;
-- saved_candidates / jobs for A must return zero rows under RLS.

select
  'helpers_present' as check_name,
  to_regprocedure('public.get_current_employer_account_id()') is not null
    and to_regprocedure('public.get_current_employer_role()') is not null
    and to_regprocedure('public.can_access_job(uuid)') is not null
    and to_regprocedure('public.can_manage_job(uuid)') is not null
    as ok;
