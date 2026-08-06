-- SAPfinder initial schema: profiles, companies, jobs, applications, resumes + RLS

create extension if not exists "pgcrypto";

-- Roles mirrored in app_metadata.role; profiles.role is a denormalized copy for queries.
create type public.user_role as enum ('CANDIDATE', 'RECRUITER', 'ADMIN');
create type public.job_status as enum ('draft', 'published', 'closed');
create type public.work_mode as enum ('Remote', 'Hybrid', 'Onsite');
create type public.application_status as enum (
  'applied',
  'reviewing',
  'shortlisted',
  'interview',
  'rejected',
  'hired'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  location text,
  headline text,
  role public.user_role not null default 'CANDIDATE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  experience_years numeric(4,1),
  skills text[] not null default '{}',
  education jsonb,
  certifications jsonb,
  summary text,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  updated_at timestamptz not null default now()
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  uploaded_at timestamptz not null default now()
);

create table public.companies (
  id text primary key,
  name text not null,
  logo text,
  description text,
  website text,
  location text,
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id text primary key,
  title text not null,
  company_id text not null references public.companies (id) on delete cascade,
  location text,
  salary_min numeric(8,2),
  salary_max numeric(8,2),
  experience_years numeric(4,1),
  work_mode public.work_mode not null default 'Hybrid',
  module text,
  skills text[] not null default '{}',
  description text,
  requirements text[] not null default '{}',
  benefits text[] not null default '{}',
  featured boolean not null default false,
  status public.job_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'applied',
  applied_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index jobs_status_idx on public.jobs (status);
create index jobs_module_idx on public.jobs (module);
create index applications_candidate_idx on public.applications (candidate_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_app_meta_data->>'role')::public.user_role, 'CANDIDATE')
  )
  on conflict (id) do nothing;

  insert into public.candidate_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- Profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- Candidate profiles
create policy "Candidate profiles readable by authenticated"
  on public.candidate_profiles for select to authenticated using (true);

create policy "Users manage own candidate profile"
  on public.candidate_profiles for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Resumes
create policy "Users manage own resumes"
  on public.resumes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Recruiters/admins can view resumes"
  on public.resumes for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('RECRUITER', 'ADMIN')
    )
  );

-- Companies / jobs public read
create policy "Companies are publicly readable"
  on public.companies for select using (true);

create policy "Published jobs are publicly readable"
  on public.jobs for select using (status = 'published' or auth.role() = 'authenticated');

create policy "Recruiters manage own company jobs"
  on public.jobs for all to authenticated
  using (
    exists (
      select 1 from public.companies c
      join public.profiles p on p.id = auth.uid()
      where c.id = jobs.company_id
        and (c.owner_id = auth.uid() or p.role = 'ADMIN')
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      join public.profiles p on p.id = auth.uid()
      where c.id = jobs.company_id
        and (c.owner_id = auth.uid() or p.role = 'ADMIN')
    )
  );

-- Applications
create policy "Candidates manage own applications"
  on public.applications for all to authenticated
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

create policy "Recruiters view applications for their jobs"
  on public.applications for select to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      join public.companies c on c.id = j.company_id
      join public.profiles p on p.id = auth.uid()
      where j.id = applications.job_id
        and (c.owner_id = auth.uid() or p.role = 'ADMIN')
    )
  );

-- Storage bucket for resumes (private)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Users upload own resume objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own resume objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update/delete own resume objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own resume objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
