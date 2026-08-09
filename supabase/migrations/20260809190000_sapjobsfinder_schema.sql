-- SAPJobsFinder schema: auth-linked profiles, candidate/employer data, jobs, RLS
-- Replaces empty legacy public.profiles (0 rows) while leaving unrelated tables intact.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Drop legacy profiles (empty) and recreate for SAPJobsFinder
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

drop table if exists public.profiles cascade;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('candidate', 'employer', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_status as enum ('draft', 'published', 'paused', 'closed', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_status as enum (
    'applied', 'shortlisted', 'interview', 'offer', 'rejected', 'hired', 'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.alert_frequency as enum ('daily', 'weekly', 'instant');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.skill_proficiency as enum ('beginner', 'intermediate', 'advanced', 'expert');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Utility: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.app_role not null,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_not_self_admin check (role in ('candidate', 'employer', 'admin'))
);

create table public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  date_of_birth date,
  gender text,
  current_city text,
  current_state text,
  country text,
  headline text,
  about_me text,
  years_of_experience integer not null default 0,
  current_company text,
  current_ctc numeric(12, 2),
  expected_ctc numeric(12, 2),
  notice_period text,
  preferred_location text,
  linkedin_url text,
  github_url text,
  profile_photo_url text,
  profile_completion integer not null default 0
    check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  company_name text not null,
  company_logo_url text,
  website text,
  industry text,
  company_size text,
  headquarters text,
  about_company text,
  linkedin_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiters (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  designation text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employer_id, user_id)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  experience_years numeric(4, 1),
  proficiency public.skill_proficiency,
  created_at timestamptz not null default now(),
  unique (candidate_id, skill_id)
);

create table public.candidate_experience (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  company text not null,
  designation text not null,
  start_date date not null,
  end_date date,
  currently_working boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_education (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  degree text not null,
  college text not null,
  university text,
  start_year integer,
  end_year integer,
  percentage numeric(5, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_certifications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  certificate_name text not null,
  issuer text,
  issued_date date,
  expiry_date date,
  certificate_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  resume_name text not null,
  resume_url text not null,
  is_primary boolean not null default false,
  ats_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  experience_min integer,
  experience_max integer,
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  employment_type text,
  location text,
  remote_type text,
  sap_module text,
  vacancies integer not null default 1,
  status public.job_status not null default 'draft',
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_skills (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  unique (job_id, skill_id)
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  resume_id uuid references public.candidate_resumes (id) on delete set null,
  cover_letter text,
  status public.application_status not null default 'applied',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (candidate_id, job_id)
);

create table public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  keywords text,
  location text,
  experience_min integer,
  experience_max integer,
  sap_module text,
  frequency public.alert_frequency not null default 'weekly',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index profiles_user_id_idx on public.profiles (user_id);
create index profiles_role_idx on public.profiles (role);
create index candidate_profiles_user_id_idx on public.candidate_profiles (user_id);
create index employer_profiles_user_id_idx on public.employer_profiles (user_id);
create index recruiters_user_id_idx on public.recruiters (user_id);
create index recruiters_employer_id_idx on public.recruiters (employer_id);
create index candidate_skills_candidate_id_idx on public.candidate_skills (candidate_id);
create index jobs_employer_id_idx on public.jobs (employer_id);
create index jobs_status_idx on public.jobs (status);
create index jobs_created_at_idx on public.jobs (created_at desc);
create index jobs_sap_module_idx on public.jobs (sap_module);
create index job_applications_job_id_idx on public.job_applications (job_id);
create index job_applications_candidate_id_idx on public.job_applications (candidate_id);
create index saved_jobs_candidate_id_idx on public.saved_jobs (candidate_id);
create index notifications_user_id_idx on public.notifications (user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger candidate_profiles_set_updated_at before update on public.candidate_profiles
  for each row execute function public.set_updated_at();
create trigger employer_profiles_set_updated_at before update on public.employer_profiles
  for each row execute function public.set_updated_at();
create trigger recruiters_set_updated_at before update on public.recruiters
  for each row execute function public.set_updated_at();
create trigger skills_set_updated_at before update on public.skills
  for each row execute function public.set_updated_at();
create trigger candidate_experience_set_updated_at before update on public.candidate_experience
  for each row execute function public.set_updated_at();
create trigger candidate_education_set_updated_at before update on public.candidate_education
  for each row execute function public.set_updated_at();
create trigger candidate_certifications_set_updated_at before update on public.candidate_certifications
  for each row execute function public.set_updated_at();
create trigger candidate_resumes_set_updated_at before update on public.candidate_resumes
  for each row execute function public.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger job_applications_set_updated_at before update on public.job_applications
  for each row execute function public.set_updated_at();
create trigger job_alerts_set_updated_at before update on public.job_alerts
  for each row execute function public.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers for RLS
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_candidate_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select id from public.candidate_profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_employer_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select id from public.employer_profiles where user_id = auth.uid() limit 1;
$$;

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
    join public.employer_profiles e on e.id = j.employer_id
    where j.id = p_job_id
      and e.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_employer(p_employer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.employer_profiles e
    where e.id = p_employer_id
      and e.user_id = auth.uid()
  );
$$;

-- Map experience band strings from signup metadata to integers
create or replace function public.map_experience_band(band text)
returns integer
language sql
immutable
as $$
  select case lower(coalesce(band, ''))
    when 'fresher' then 0
    when '0-2 years' then 1
    when '2-5 years' then 3
    when '5-8 years' then 6
    when '8-12 years' then 10
    when '12+ years' then 12
    else 0
  end;
$$;

-- ---------------------------------------------------------------------------
-- Auth signup trigger (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := lower(coalesce(meta->>'role', 'candidate'));
  safe_role public.app_role;
  v_first text;
  v_last text;
  v_phone text;
  v_recruiter text;
  v_company text;
  v_employer_id uuid;
  v_candidate_id uuid;
  v_skill_id uuid;
  v_module text;
begin
  -- Never allow public signup to create admin
  if requested_role = 'employer' then
    safe_role := 'employer';
  else
    safe_role := 'candidate';
  end if;

  if safe_role = 'employer' then
    v_recruiter := coalesce(meta->>'recruiter_name', meta->>'full_name', '');
    v_first := split_part(v_recruiter, ' ', 1);
    v_last := nullif(trim(substr(v_recruiter, length(split_part(v_recruiter, ' ', 1)) + 1)), '');
    v_phone := meta->>'phone';
    v_company := coalesce(meta->>'company_name', 'My Company');

    insert into public.profiles (user_id, role, first_name, last_name, phone)
    values (new.id, 'employer', nullif(v_first, ''), v_last, v_phone);

    insert into public.employer_profiles (
      user_id, company_name, website, industry, company_size
    ) values (
      new.id,
      v_company,
      meta->>'company_website',
      meta->>'industry',
      meta->>'company_size'
    )
    returning id into v_employer_id;

    insert into public.recruiters (employer_id, user_id, designation, is_primary)
    values (v_employer_id, new.id, 'Recruiter', true);
  else
    v_first := coalesce(meta->>'first_name', split_part(coalesce(meta->>'full_name', ''), ' ', 1));
    v_last := coalesce(
      meta->>'last_name',
      nullif(trim(substr(coalesce(meta->>'full_name', ''), length(split_part(coalesce(meta->>'full_name', ''), ' ', 1)) + 1)), '')
    );
    v_phone := meta->>'phone';
    v_module := meta->>'sap_module';

    insert into public.profiles (user_id, role, first_name, last_name, phone)
    values (new.id, 'candidate', nullif(v_first, ''), v_last, v_phone);

    insert into public.candidate_profiles (
      user_id,
      first_name,
      last_name,
      phone,
      current_city,
      years_of_experience,
      headline,
      profile_completion
    ) values (
      new.id,
      nullif(v_first, ''),
      v_last,
      v_phone,
      coalesce(meta->>'current_location', meta->>'location'),
      public.map_experience_band(meta->>'years_of_experience'),
      v_module,
      35
    )
    returning id into v_candidate_id;

    if v_module is not null and length(trim(v_module)) > 0 then
      select id into v_skill_id from public.skills where lower(name) = lower(v_module) limit 1;
      if v_skill_id is not null then
        insert into public.candidate_skills (candidate_id, skill_id, experience_years, proficiency)
        values (
          v_candidate_id,
          v_skill_id,
          public.map_experience_band(meta->>'years_of_experience'),
          'intermediate'
        )
        on conflict do nothing;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed skills
-- ---------------------------------------------------------------------------
insert into public.skills (name, category) values
  ('SAP ABAP', 'SAP'),
  ('SAP FICO', 'SAP'),
  ('SAP MM', 'SAP'),
  ('SAP SD', 'SAP'),
  ('SAP PP', 'SAP'),
  ('SAP HCM', 'SAP'),
  ('SAP SuccessFactors', 'SAP'),
  ('SAP Basis', 'SAP'),
  ('SAP BW', 'SAP'),
  ('SAP BTP', 'SAP'),
  ('SAP EWM', 'SAP'),
  ('SAP TM', 'SAP'),
  ('SAP Ariba', 'SAP')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.recruiters enable row level security;
alter table public.skills enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.candidate_experience enable row level security;
alter table public.candidate_education enable row level security;
alter table public.candidate_certifications enable row level security;
alter table public.candidate_resumes enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.job_applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_alerts enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Prevent role escalation (admin/candidate/employer) via client updates
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Changing profile role is not allowed';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

-- Inserts only via trigger (security definer), no public insert policy

-- candidate_profiles
create policy "Candidates can view own candidate profile"
  on public.candidate_profiles for select
  using (auth.uid() = user_id);

create policy "Employers can view candidate profiles of applicants"
  on public.candidate_profiles for select
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      join public.employer_profiles e on e.id = j.employer_id
      where ja.candidate_id = candidate_profiles.id
        and e.user_id = auth.uid()
    )
  );

create policy "Candidates can update own candidate profile"
  on public.candidate_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- employer_profiles
create policy "Anyone authenticated can view employer profiles"
  on public.employer_profiles for select
  to authenticated
  using (true);

create policy "Public can view employer profiles"
  on public.employer_profiles for select
  to anon
  using (true);

create policy "Employers can update own employer profile"
  on public.employer_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- recruiters
create policy "Recruiters can view own employer recruiters"
  on public.recruiters for select
  using (
    user_id = auth.uid()
    or employer_id = public.current_employer_id()
  );

create policy "Employers can manage recruiters for own company"
  on public.recruiters for all
  using (employer_id = public.current_employer_id())
  with check (employer_id = public.current_employer_id());

-- skills (read-all)
create policy "Anyone can read skills"
  on public.skills for select
  using (true);

-- candidate child tables
create policy "Candidates manage own skills"
  on public.candidate_skills for all
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

create policy "Candidates manage own experience"
  on public.candidate_experience for all
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

create policy "Candidates manage own education"
  on public.candidate_education for all
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

create policy "Candidates manage own certifications"
  on public.candidate_certifications for all
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

create policy "Candidates manage own resumes"
  on public.candidate_resumes for all
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

create policy "Employers can view applicant resumes"
  on public.candidate_resumes for select
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      where ja.candidate_id = candidate_resumes.candidate_id
        and public.owns_job(j.id)
    )
  );

-- jobs
-- Note: owner checks use employer_id/current_employer_id() (not owns_job(id))
-- so INSERT ... RETURNING works for draft rows.
create policy "Public can view published jobs"
  on public.jobs for select
  using (status = 'published' or employer_id = public.current_employer_id());

create policy "Employers can insert own jobs"
  on public.jobs for insert
  to authenticated
  with check (public.can_manage_employer(employer_id));

create policy "Employers can update own jobs"
  on public.jobs for update
  using (employer_id = public.current_employer_id())
  with check (employer_id = public.current_employer_id());

create policy "Employers can delete own jobs"
  on public.jobs for delete
  using (employer_id = public.current_employer_id());

-- job_skills
create policy "Anyone can view job skills for visible jobs"
  on public.job_skills for select
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id
        and (j.status = 'published' or public.owns_job(j.id))
    )
  );

create policy "Employers manage skills for own jobs"
  on public.job_skills for all
  using (public.owns_job(job_id))
  with check (public.owns_job(job_id));

-- applications
create policy "Candidates view own applications"
  on public.job_applications for select
  using (candidate_id = public.current_candidate_id());

create policy "Employers view applications for own jobs"
  on public.job_applications for select
  using (public.owns_job(job_id));

create policy "Candidates create own applications"
  on public.job_applications for insert
  with check (
    candidate_id = public.current_candidate_id()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.status = 'published'
    )
  );

create policy "Candidates update own applications"
  on public.job_applications for update
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

create policy "Employers update applications for own jobs"
  on public.job_applications for update
  using (public.owns_job(job_id))
  with check (public.owns_job(job_id));

-- saved jobs
create policy "Candidates manage own saved jobs"
  on public.saved_jobs for all
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

-- job alerts
create policy "Candidates manage own job alerts"
  on public.job_alerts for all
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

-- notifications
create policy "Users manage own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
