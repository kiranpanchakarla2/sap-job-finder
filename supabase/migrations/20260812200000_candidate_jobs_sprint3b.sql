-- Sprint 3 Phase B: candidate job discovery visibility + saved_jobs hardening.
-- Reuses existing public.jobs and public.saved_jobs (no duplicate job tables).

-- ---------------------------------------------------------------------------
-- 1) Candidate-visible active jobs (authenticated)
--    After employer tenant alignment, only anon had SELECT on active jobs.
--    Authenticated candidates (and any signed-in user) need read access to
--    active, non-expired listings. Employer company-scoped policies remain.
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated can view active jobs" on public.jobs;
create policy "Authenticated can view active jobs"
  on public.jobs
  for select
  to authenticated
  using (
    status = 'active'
    and (
      application_deadline is null
      or application_deadline >= ((timezone('utc', now()))::date)
    )
  );

-- Align anon public browse with the same expiration rule
drop policy if exists "Public can view active jobs" on public.jobs;
create policy "Public can view active jobs"
  on public.jobs
  for select
  to anon
  using (
    status = 'active'
    and (
      application_deadline is null
      or application_deadline >= ((timezone('utc', now()))::date)
    )
  );

-- Allow candidates to still read jobs they previously saved (e.g. later closed)
drop policy if exists "Candidates can view saved jobs" on public.jobs;
create policy "Candidates can view saved jobs"
  on public.jobs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.saved_jobs sj
      where sj.job_id = jobs.id
        and sj.candidate_id = (select public.current_candidate_id())
    )
  );

-- ---------------------------------------------------------------------------
-- 2) saved_jobs indexes + explicit RLS (ownership via current_candidate_id)
-- ---------------------------------------------------------------------------
create index if not exists saved_jobs_job_id_idx
  on public.saved_jobs (job_id);

create index if not exists saved_jobs_candidate_created_idx
  on public.saved_jobs (candidate_id, created_at desc);

drop policy if exists "Candidates manage own saved jobs" on public.saved_jobs;
drop policy if exists "Candidates select own saved jobs" on public.saved_jobs;
drop policy if exists "Candidates insert own saved jobs" on public.saved_jobs;
drop policy if exists "Candidates delete own saved jobs" on public.saved_jobs;

create policy "Candidates select own saved jobs"
  on public.saved_jobs
  for select
  to authenticated
  using (candidate_id = (select public.current_candidate_id()));

create policy "Candidates insert own saved jobs"
  on public.saved_jobs
  for insert
  to authenticated
  with check (
    candidate_id = (select public.current_candidate_id())
    and exists (
      select 1
      from public.jobs j
      where j.id = job_id
        and j.status = 'active'
    )
  );

create policy "Candidates delete own saved jobs"
  on public.saved_jobs
  for delete
  to authenticated
  using (candidate_id = (select public.current_candidate_id()));

grant select, insert, delete on table public.saved_jobs to authenticated;
