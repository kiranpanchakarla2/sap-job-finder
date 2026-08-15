-- Sprint 5 Phase B: Supabase Integration for Saved Jobs and Job Alerts
-- Reuses existing public.saved_jobs and public.job_alerts tables (no duplicate tables).

-- ============================================================================
-- 1. HELPER FUNCTIONS (SECURITY DEFINER, ROW_SECURITY = OFF TO PREVENT RLS RECURSION)
-- ============================================================================

create or replace function public.is_active_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = p_job_id
      and j.status = 'active'
  );
$$;

grant execute on function public.is_active_job(uuid) to anon, authenticated, service_role;

create or replace function public.has_saved_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.saved_jobs sj
    where sj.job_id = p_job_id
      and sj.candidate_id = (select public.current_candidate_id())
  );
$$;

grant execute on function public.has_saved_job(uuid) to anon, authenticated, service_role;

-- ============================================================================
-- 2. HARDEN SAVED_JOBS
-- ============================================================================

-- Ensure unique constraint exists on (candidate_id, job_id)
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'saved_jobs'
      and constraint_type = 'UNIQUE'
  ) then
    alter table public.saved_jobs
      add constraint saved_jobs_candidate_id_job_id_key unique (candidate_id, job_id);
  end if;
end $$;

-- Indexes for performance
create index if not exists saved_jobs_job_id_idx
  on public.saved_jobs (job_id);

create index if not exists saved_jobs_candidate_created_idx
  on public.saved_jobs (candidate_id, created_at desc);

-- Reaffirm RLS for saved_jobs
alter table public.saved_jobs enable row level security;
alter table public.saved_jobs force row level security;

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
    and public.is_active_job(job_id)
  );

create policy "Candidates delete own saved jobs"
  on public.saved_jobs
  for delete
  to authenticated
  using (candidate_id = (select public.current_candidate_id()));

grant select, insert, delete on table public.saved_jobs to authenticated;

-- Allow candidates to view jobs they have saved (even if closed) without mutual RLS recursion
drop policy if exists "Candidates can view saved jobs" on public.jobs;
create policy "Candidates can view saved jobs"
  on public.jobs
  for select
  to authenticated
  using (public.has_saved_job(id));

-- ============================================================================
-- 3. EVOLVE JOB_ALERTS
-- ============================================================================

-- Add name column (e.g. 'SAP Fiori Developer')
alter table public.job_alerts
  add column if not exists name text not null default 'SAP Job Alert';

-- Safely convert keywords text -> text[]
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_alerts'
      and column_name = 'keywords'
      and data_type = 'text'
  ) then
    alter table public.job_alerts
      alter column keywords drop default;
    alter table public.job_alerts
      alter column keywords type text[] using (
        case
          when keywords is null or trim(keywords) = '' then '{}'::text[]
          else string_to_array(keywords, ',')
        end
      );
    alter table public.job_alerts
      alter column keywords set default '{}'::text[];
  end if;
end $$;

-- Add sap_modules text[] column and backfill from sap_module
alter table public.job_alerts
  add column if not exists sap_modules text[] default '{}'::text[];

update public.job_alerts
set sap_modules = array[sap_module]
where sap_module is not null
  and (sap_modules is null or sap_modules = '{}'::text[]);

-- Add additional search preference columns
alter table public.job_alerts
  add column if not exists experience text,
  add column if not exists work_mode text,
  add column if not exists employment_type text,
  add column if not exists salary_min numeric(12, 2),
  add column if not exists salary_max numeric(12, 2),
  add column if not exists last_matched_count integer not null default 0;

-- Constraints
alter table public.job_alerts
  drop constraint if exists job_alerts_salary_check;
alter table public.job_alerts
  add constraint job_alerts_salary_check
  check (salary_min is null or salary_max is null or salary_min <= salary_max);

alter table public.job_alerts
  drop constraint if exists job_alerts_experience_check;
alter table public.job_alerts
  add constraint job_alerts_experience_check
  check (experience_min is null or experience_max is null or experience_min <= experience_max);

alter table public.job_alerts
  drop constraint if exists job_alerts_name_not_empty;
alter table public.job_alerts
  add constraint job_alerts_name_not_empty
  check (length(trim(name)) > 0);

-- Indexes for job_alerts
create index if not exists job_alerts_candidate_id_idx
  on public.job_alerts (candidate_id);

create index if not exists job_alerts_candidate_created_idx
  on public.job_alerts (candidate_id, created_at desc);

create index if not exists job_alerts_candidate_active_idx
  on public.job_alerts (candidate_id, is_active);

-- Ensure updated_at trigger exists
drop trigger if exists job_alerts_set_updated_at on public.job_alerts;
create trigger job_alerts_set_updated_at
  before update on public.job_alerts
  for each row
  execute function public.set_updated_at();

-- RLS for job_alerts
alter table public.job_alerts enable row level security;
alter table public.job_alerts force row level security;

drop policy if exists "Candidates manage own job alerts" on public.job_alerts;
drop policy if exists "Candidates select own job alerts" on public.job_alerts;
drop policy if exists "Candidates insert own job alerts" on public.job_alerts;
drop policy if exists "Candidates update own job alerts" on public.job_alerts;
drop policy if exists "Candidates delete own job alerts" on public.job_alerts;

create policy "Candidates select own job alerts"
  on public.job_alerts
  for select
  to authenticated
  using (candidate_id = (select public.current_candidate_id()));

create policy "Candidates insert own job alerts"
  on public.job_alerts
  for insert
  to authenticated
  with check (candidate_id = (select public.current_candidate_id()));

create policy "Candidates update own job alerts"
  on public.job_alerts
  for update
  to authenticated
  using (candidate_id = (select public.current_candidate_id()))
  with check (candidate_id = (select public.current_candidate_id()));

create policy "Candidates delete own job alerts"
  on public.job_alerts
  for delete
  to authenticated
  using (candidate_id = (select public.current_candidate_id()));

grant select, insert, update, delete on table public.job_alerts to authenticated;
