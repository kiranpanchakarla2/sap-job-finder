-- Sprint 3B: Expand jobs for company_profiles ownership + full posting fields.
-- Evolves the existing public.jobs table (0 rows expected at apply time).
-- Status model: draft | active | paused | closed (text + CHECK; maps published→active).

-- ---------------------------------------------------------------------------
-- Drop policies that depend on old status enum / employer-only ownership
-- ---------------------------------------------------------------------------
drop policy if exists "Public can view published jobs" on public.jobs;
drop policy if exists "Employers can insert own jobs" on public.jobs;
drop policy if exists "Employers can update own jobs" on public.jobs;
drop policy if exists "Employers can delete own jobs" on public.jobs;

drop policy if exists "Anyone can view job skills for visible jobs" on public.job_skills;
drop policy if exists "Candidates create own applications" on public.job_applications;

-- ---------------------------------------------------------------------------
-- Helpers (company lookup)
-- ---------------------------------------------------------------------------
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select id from public.company_profiles where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_company_id() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Expand schema — ownership
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists company_id uuid references public.company_profiles (id) on delete cascade,
  add column if not exists created_by uuid references auth.users (id) on delete restrict;

-- Convert status enum → text CHECK (draft/active/paused/closed)
alter table public.jobs
  add column if not exists status_text text;

update public.jobs
set status_text = case
  when status::text = 'published' then 'active'
  when status::text = 'expired' then 'closed'
  when status::text in ('draft', 'paused', 'closed') then status::text
  else 'draft'
end
where status_text is null;

alter table public.jobs drop column if exists status;
alter table public.jobs rename column status_text to status;
alter table public.jobs
  alter column status set default 'draft',
  alter column status set not null;

alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs
  add constraint jobs_status_check
  check (status in ('draft', 'active', 'paused', 'closed'));

-- Rename legacy columns toward Sprint 3B names
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'experience_min'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'minimum_experience'
  ) then
    alter table public.jobs rename column experience_min to minimum_experience;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'experience_max'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'maximum_experience'
  ) then
    alter table public.jobs rename column experience_max to maximum_experience;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'remote_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'work_arrangement'
  ) then
    alter table public.jobs rename column remote_type to work_arrangement;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'vacancies'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'number_of_openings'
  ) then
    alter table public.jobs rename column vacancies to number_of_openings;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'expiry_date'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'application_deadline'
  ) then
    alter table public.jobs rename column expiry_date to application_deadline;
  end if;
end $$;

-- New posting fields
alter table public.jobs
  add column if not exists job_type text,
  add column if not exists experience_level text,
  add column if not exists sap_specialization text,
  add column if not exists sap_version text,
  add column if not exists project_type text,
  add column if not exists industry text,
  add column if not exists responsibilities text not null default '',
  add column if not exists required_skills text not null default '',
  add column if not exists preferred_skills text,
  add column if not exists salary_type text,
  add column if not exists currency text,
  add column if not exists salary_visible boolean not null default false,
  add column if not exists benefits jsonb not null default '[]'::jsonb,
  add column if not exists recruiter_name text,
  add column if not exists application_email text,
  add column if not exists application_url text,
  add column if not exists published_at timestamptz,
  add column if not exists closed_at timestamptz;

-- Tighten required columns for Sprint 3B
update public.jobs set minimum_experience = 0 where minimum_experience is null;
update public.jobs set number_of_openings = 1 where number_of_openings is null;
update public.jobs set employment_type = 'Full-time' where employment_type is null or trim(employment_type) = '';
update public.jobs set job_type = 'Permanent' where job_type is null or trim(job_type) = '';
update public.jobs set experience_level = 'Mid Level' where experience_level is null or trim(experience_level) = '';
update public.jobs set location = 'Remote' where location is null or trim(location) = '';
update public.jobs set work_arrangement = 'Remote' where work_arrangement is null or trim(work_arrangement) = '';
update public.jobs set sap_module = 'SAP S/4HANA' where sap_module is null or trim(sap_module) = '';
update public.jobs set description = coalesce(nullif(trim(description), ''), 'Draft job description')
  where description is null or trim(description) = '';

alter table public.jobs
  alter column minimum_experience set not null,
  alter column minimum_experience set default 0,
  alter column number_of_openings set not null,
  alter column number_of_openings set default 1,
  alter column employment_type set not null,
  alter column job_type set not null,
  alter column experience_level set not null,
  alter column location set not null,
  alter column work_arrangement set not null,
  alter column sap_module set not null,
  alter column description set not null,
  alter column responsibilities set not null,
  alter column required_skills set not null;

-- Backfill ownership from employer_profiles → company_profiles
update public.jobs j
set
  company_id = coalesce(
    j.company_id,
    (
      select c.id
      from public.employer_profiles e
      join public.company_profiles c on c.user_id = e.user_id
      where e.id = j.employer_id
      limit 1
    )
  ),
  created_by = coalesce(
    j.created_by,
    (
      select e.user_id
      from public.employer_profiles e
      where e.id = j.employer_id
      limit 1
    )
  )
where j.company_id is null or j.created_by is null;

alter table public.jobs
  alter column company_id set not null,
  alter column created_by set not null;

-- ---------------------------------------------------------------------------
-- Ownership helper (after company_id exists)
-- ---------------------------------------------------------------------------
create or replace function public.owns_job(p_job_id uuid)
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
    join public.company_profiles c on c.id = j.company_id
    where j.id = p_job_id
      and c.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.jobs j
    join public.employer_profiles e on e.id = j.employer_id
    where j.id = p_job_id
      and e.user_id = auth.uid()
  );
$$;

grant execute on function public.owns_job(uuid) to anon, authenticated, service_role;

-- Prevent reassignment of ownership columns
create or replace function public.prevent_job_ownership_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'Changing job company is not allowed';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'Changing job creator is not allowed';
  end if;
  if new.employer_id is distinct from old.employer_id then
    raise exception 'Changing job employer is not allowed';
  end if;
  return new;
end;
$$;

create or replace function public.jobs_status_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.status = 'active'
       and (old.status is distinct from 'active')
       and new.published_at is null then
      new.published_at := now();
    end if;

    if new.status = 'closed' and (old.status is distinct from 'closed') then
      new.closed_at := coalesce(new.closed_at, now());
    end if;

    if new.status is distinct from 'closed' then
      new.closed_at := null;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Validation constraints
-- ---------------------------------------------------------------------------
alter table public.jobs drop constraint if exists jobs_minimum_experience_check;
alter table public.jobs
  add constraint jobs_minimum_experience_check
  check (minimum_experience >= 0);

alter table public.jobs drop constraint if exists jobs_experience_range_check;
alter table public.jobs
  add constraint jobs_experience_range_check
  check (
    maximum_experience is null
    or maximum_experience >= minimum_experience
  );

alter table public.jobs drop constraint if exists jobs_number_of_openings_check;
alter table public.jobs
  add constraint jobs_number_of_openings_check
  check (number_of_openings > 0);

alter table public.jobs drop constraint if exists jobs_salary_min_check;
alter table public.jobs
  add constraint jobs_salary_min_check
  check (salary_min is null or salary_min >= 0);

alter table public.jobs drop constraint if exists jobs_salary_max_check;
alter table public.jobs
  add constraint jobs_salary_max_check
  check (salary_max is null or salary_max >= 0);

alter table public.jobs drop constraint if exists jobs_salary_range_check;
alter table public.jobs
  add constraint jobs_salary_range_check
  check (
    salary_min is null
    or salary_max is null
    or salary_max >= salary_min
  );

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists jobs_created_by_idx on public.jobs (created_by);
create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_company_status_idx on public.jobs (company_id, status);
create index if not exists jobs_published_at_idx on public.jobs (published_at desc nulls last);
create index if not exists jobs_created_at_idx on public.jobs (created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

drop trigger if exists jobs_prevent_ownership_change on public.jobs;
create trigger jobs_prevent_ownership_change
  before update on public.jobs
  for each row execute function public.prevent_job_ownership_change();

drop trigger if exists jobs_status_timestamps on public.jobs;
create trigger jobs_status_timestamps
  before update on public.jobs
  for each row execute function public.jobs_status_timestamps();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.jobs enable row level security;

drop policy if exists "Employers can view own company jobs" on public.jobs;
create policy "Employers can view own company jobs"
  on public.jobs for select
  to authenticated
  using (
    company_id = (select public.current_company_id())
    or status = 'active'
  );

drop policy if exists "Public can view active jobs" on public.jobs;
create policy "Public can view active jobs"
  on public.jobs for select
  to anon
  using (status = 'active');

drop policy if exists "Employers can insert own company jobs" on public.jobs;
create policy "Employers can insert own company jobs"
  on public.jobs for insert
  to authenticated
  with check (
    company_id = (select public.current_company_id())
    and created_by = (select auth.uid())
    and employer_id = (select public.current_employer_id())
    and exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('employer'::public.app_role, 'admin'::public.app_role)
    )
  );

drop policy if exists "Employers can update own company jobs" on public.jobs;
create policy "Employers can update own company jobs"
  on public.jobs for update
  to authenticated
  using (company_id = (select public.current_company_id()))
  with check (
    company_id = (select public.current_company_id())
    and created_by = (select auth.uid())
  );

drop policy if exists "Employers can delete own draft jobs" on public.jobs;
create policy "Employers can delete own draft jobs"
  on public.jobs for delete
  to authenticated
  using (
    company_id = (select public.current_company_id())
    and status = 'draft'
  );

grant select, insert, update, delete on table public.jobs to authenticated;
grant select on table public.jobs to anon;

-- Related policies that referenced status = 'published'
drop policy if exists "Anyone can view job skills for visible jobs" on public.job_skills;
create policy "Anyone can view job skills for visible jobs"
  on public.job_skills for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = job_skills.job_id
        and (j.status = 'active' or public.owns_job(j.id))
    )
  );

-- Ensure candidate applications target active jobs
drop policy if exists "Candidates create own applications" on public.job_applications;
create policy "Candidates create own applications"
  on public.job_applications for insert
  to authenticated
  with check (
    candidate_id = public.current_candidate_id()
    and exists (
      select 1
      from public.jobs j
      where j.id = job_id
        and j.status = 'active'
    )
  );
