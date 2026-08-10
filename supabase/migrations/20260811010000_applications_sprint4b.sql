-- Sprint 4B: Applications & candidate management
-- Evolves existing candidate_profiles + job_applications (no duplicate tables).
-- UI application statuses: new | reviewing | shortlisted | interview | hired | rejected

-- ---------------------------------------------------------------------------
-- 1) Enhance candidate_profiles with Sprint 4B fields
-- ---------------------------------------------------------------------------
alter table public.candidate_profiles
  add column if not exists current_job_role text,
  add column if not exists location text,
  add column if not exists professional_summary text,
  add column if not exists total_experience numeric,
  add column if not exists expected_salary numeric,
  add column if not exists currency text,
  add column if not exists availability text,
  add column if not exists portfolio_url text,
  add column if not exists resume_url text,
  add column if not exists resume_file_name text,
  add column if not exists avatar_url text,
  add column if not exists sap_skills text[] not null default '{}',
  add column if not exists skills text[] not null default '{}',
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists work_experience jsonb not null default '[]'::jsonb,
  add column if not exists languages text[] not null default '{}';

-- Backfill convenience fields from existing columns where present
update public.candidate_profiles
set
  location = coalesce(
    nullif(trim(location), ''),
    nullif(
      trim(
        concat_ws(
          ', ',
          nullif(trim(current_city), ''),
          nullif(trim(current_state), ''),
          nullif(trim(country), '')
        )
      ),
      ''
    )
  ),
  professional_summary = coalesce(nullif(trim(professional_summary), ''), about_me),
  total_experience = coalesce(total_experience, years_of_experience::numeric),
  expected_salary = coalesce(expected_salary, expected_ctc),
  avatar_url = coalesce(nullif(trim(avatar_url), ''), profile_photo_url),
  current_job_role = coalesce(nullif(trim(current_job_role), ''), headline);

-- ---------------------------------------------------------------------------
-- 2) Enhance job_applications with status timestamps + employer notes
-- ---------------------------------------------------------------------------
alter table public.job_applications
  add column if not exists employer_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists shortlisted_at timestamptz,
  add column if not exists interviewed_at timestamptz,
  add column if not exists hired_at timestamptz,
  add column if not exists rejected_at timestamptz;

-- Convert status enum → text with Sprint 4B CHECK values
alter table public.job_applications
  alter column status drop default;

alter table public.job_applications
  alter column status type text
  using (
    case status::text
      when 'applied' then 'new'
      when 'offer' then 'shortlisted'
      when 'withdrawn' then 'rejected'
      when 'shortlisted' then 'shortlisted'
      when 'interview' then 'interview'
      when 'hired' then 'hired'
      when 'rejected' then 'rejected'
      else 'new'
    end
  );

alter table public.job_applications
  drop constraint if exists job_applications_status_check;

alter table public.job_applications
  add constraint job_applications_status_check
  check (
    status in (
      'new',
      'reviewing',
      'shortlisted',
      'interview',
      'hired',
      'rejected'
    )
  );

alter table public.job_applications
  alter column status set default 'new';

-- Indexes (idempotent)
create index if not exists job_applications_status_idx
  on public.job_applications (status);

create index if not exists job_applications_applied_at_idx
  on public.job_applications (applied_at desc);

create index if not exists candidate_profiles_user_id_idx
  on public.candidate_profiles (user_id);

-- ---------------------------------------------------------------------------
-- 3) Protect immutable application identity columns
-- ---------------------------------------------------------------------------
create or replace function public.protect_job_application_identity()
returns trigger
language plpgsql
as $$
begin
  if new.job_id is distinct from old.job_id then
    raise exception 'job_id cannot be changed';
  end if;
  if new.candidate_id is distinct from old.candidate_id then
    raise exception 'candidate_id cannot be changed';
  end if;
  if new.applied_at is distinct from old.applied_at then
    raise exception 'applied_at cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists job_applications_protect_identity on public.job_applications;
create trigger job_applications_protect_identity
  before update on public.job_applications
  for each row
  execute function public.protect_job_application_identity();

-- Auto-set status timestamps on transition (do not overwrite existing)
create or replace function public.set_job_application_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'reviewing' and old.reviewed_at is null then
      new.reviewed_at := now();
    elsif new.status = 'shortlisted' and old.shortlisted_at is null then
      new.shortlisted_at := now();
    elsif new.status = 'interview' and old.interviewed_at is null then
      new.interviewed_at := now();
    elsif new.status = 'hired' and old.hired_at is null then
      new.hired_at := now();
    elsif new.status = 'rejected' and old.rejected_at is null then
      new.rejected_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists job_applications_status_timestamps on public.job_applications;
create trigger job_applications_status_timestamps
  before update on public.job_applications
  for each row
  execute function public.set_job_application_status_timestamps();

-- ---------------------------------------------------------------------------
-- 4) Candidate profile RLS: insert own + employer access via company ownership
-- ---------------------------------------------------------------------------
drop policy if exists "Candidates can insert own candidate profile" on public.candidate_profiles;
create policy "Candidates can insert own candidate profile"
  on public.candidate_profiles for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('candidate'::public.app_role, 'admin'::public.app_role)
    )
  );

drop policy if exists "Employers can view candidate profiles of applicants" on public.candidate_profiles;
create policy "Employers can view candidate profiles of applicants"
  on public.candidate_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      join public.company_profiles c on c.id = j.company_id
      where ja.candidate_id = candidate_profiles.id
        and c.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 5) Application RLS refinements
-- ---------------------------------------------------------------------------
-- Sprint 4B: employer controls application status/notes.
-- Candidates can create and view; updates come in a later sprint if needed.
drop policy if exists "Candidates update own applications" on public.job_applications;

-- Employers update applications for own jobs (already exists); ensure company path
drop policy if exists "Employers update applications for own jobs" on public.job_applications;
create policy "Employers update applications for own jobs"
  on public.job_applications for update
  to authenticated
  using (public.owns_job(job_id))
  with check (public.owns_job(job_id));

drop policy if exists "Employers view applications for own jobs" on public.job_applications;
create policy "Employers view applications for own jobs"
  on public.job_applications for select
  to authenticated
  using (public.owns_job(job_id));

-- Keep active-job-only candidate insert (already updated in Sprint 3B)
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

-- ---------------------------------------------------------------------------
-- 6) Employer can read related experience/skills/etc for applicants (existing tables)
-- ---------------------------------------------------------------------------
drop policy if exists "Employers can view applicant skills" on public.candidate_skills;
create policy "Employers can view applicant skills"
  on public.candidate_skills for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      where ja.candidate_id = candidate_skills.candidate_id
        and public.owns_job(ja.job_id)
    )
  );

drop policy if exists "Employers can view applicant experience" on public.candidate_experience;
create policy "Employers can view applicant experience"
  on public.candidate_experience for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      where ja.candidate_id = candidate_experience.candidate_id
        and public.owns_job(ja.job_id)
    )
  );

drop policy if exists "Employers can view applicant education" on public.candidate_education;
create policy "Employers can view applicant education"
  on public.candidate_education for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      where ja.candidate_id = candidate_education.candidate_id
        and public.owns_job(ja.job_id)
    )
  );

drop policy if exists "Employers can view applicant certifications" on public.candidate_certifications;
create policy "Employers can view applicant certifications"
  on public.candidate_certifications for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      where ja.candidate_id = candidate_certifications.candidate_id
        and public.owns_job(ja.job_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 7) Private resume storage bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-resumes',
  'candidate-resumes',
  false,
  5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Candidates upload own resumes" on storage.objects;
create policy "Candidates upload own resumes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Candidates read own resumes" on storage.objects;
create policy "Candidates read own resumes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Candidates update own resumes" on storage.objects;
create policy "Candidates update own resumes"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Candidates delete own resumes" on storage.objects;
create policy "Candidates delete own resumes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Employers may SELECT (for signed URL generation) only for applicants to their jobs
drop policy if exists "Employers read applicant resumes" on storage.objects;
create policy "Employers read applicant resumes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'candidate-resumes'
    and exists (
      select 1
      from public.candidate_profiles cp
      join public.job_applications ja on ja.candidate_id = cp.id
      where cp.user_id::text = (storage.foldername(name))[1]
        and public.owns_job(ja.job_id)
    )
  );

-- Compatibility view name used by Sprint 4B docs (read-only alias)
create or replace view public.applications
with (security_invoker = true)
as
select *
from public.job_applications;

grant select on public.applications to authenticated;

-- ---------------------------------------------------------------------------
-- 8) Grants for Data API (defense in depth; tables already exposed)
-- ---------------------------------------------------------------------------
grant select, insert, update on public.candidate_profiles to authenticated;
grant select, insert, update on public.job_applications to authenticated;
