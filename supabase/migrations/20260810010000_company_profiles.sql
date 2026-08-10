-- Sprint 2: company_profiles (1:1 with auth.users for employer company onboarding)
-- Keeps employer_profiles for jobs/recruiters FKs; company_profiles is the Sprint 2 source of truth
-- for onboarding + company profile UI. Completing setup syncs key fields to employer_profiles.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  company_name text not null default '',
  logo_url text,
  website text not null default '',
  industry text not null default '',
  company_size text not null default '',
  country text not null default '',
  state text not null default '',
  city text not null default '',
  address text not null default '',
  about text not null default '',
  recruiter_name text not null default '',
  designation text not null default '',
  work_email text not null default '',
  phone text not null default '',
  setup_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_profiles_user_id_idx
  on public.company_profiles (user_id);

create index if not exists company_profiles_setup_complete_idx
  on public.company_profiles (setup_complete);

drop trigger if exists company_profiles_set_updated_at on public.company_profiles;
create trigger company_profiles_set_updated_at
  before update on public.company_profiles
  for each row execute function public.set_updated_at();

-- Prevent clients from reassigning ownership
create or replace function public.prevent_company_profile_user_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'Changing company profile owner is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists company_profiles_prevent_user_change on public.company_profiles;
create trigger company_profiles_prevent_user_change
  before update on public.company_profiles
  for each row execute function public.prevent_company_profile_user_change();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.company_profiles enable row level security;

drop policy if exists "Employers can view own company profile" on public.company_profiles;
create policy "Employers can view own company profile"
  on public.company_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can view completed company profiles" on public.company_profiles;
create policy "Anyone can view completed company profiles"
  on public.company_profiles for select
  to anon, authenticated
  using (setup_complete = true);

drop policy if exists "Employers can insert own company profile" on public.company_profiles;
create policy "Employers can insert own company profile"
  on public.company_profiles for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('employer'::public.app_role, 'admin'::public.app_role)
    )
  );

drop policy if exists "Employers can update own company profile" on public.company_profiles;
create policy "Employers can update own company profile"
  on public.company_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.company_profiles to authenticated;
grant select on table public.company_profiles to anon;

-- ---------------------------------------------------------------------------
-- Backfill stubs for existing employers (incomplete until they finish onboarding)
-- ---------------------------------------------------------------------------
insert into public.company_profiles (
  user_id,
  company_name,
  logo_url,
  website,
  industry,
  company_size,
  about,
  work_email,
  setup_complete
)
select
  e.user_id,
  coalesce(nullif(trim(e.company_name), ''), ''),
  e.company_logo_url,
  coalesce(e.website, ''),
  coalesce(e.industry, ''),
  coalesce(e.company_size, ''),
  coalesce(e.about_company, ''),
  coalesce(p.email, u.email, ''),
  false
from public.employer_profiles e
left join public.profiles p on p.user_id = e.user_id
left join auth.users u on u.id = e.user_id
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Signup trigger: create incomplete company_profiles for new employers
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
  v_designation text;
  v_employer_id uuid;
  v_candidate_id uuid;
  v_skill_id uuid;
  v_module text;
begin
  if requested_role = 'employer' then
    safe_role := 'employer';
  else
    safe_role := 'candidate';
  end if;

  if safe_role = 'employer' then
    v_recruiter := coalesce(meta->>'recruiter_name', meta->>'full_name', '');
    v_first := coalesce(
      nullif(trim(meta->>'first_name'), ''),
      nullif(split_part(v_recruiter, ' ', 1), '')
    );
    v_last := coalesce(
      nullif(trim(meta->>'last_name'), ''),
      nullif(trim(substr(v_recruiter, length(split_part(v_recruiter, ' ', 1)) + 1)), '')
    );
    v_phone := meta->>'phone';
    v_company := coalesce(nullif(trim(meta->>'company_name'), ''), 'My Company');
    v_designation := coalesce(
      nullif(trim(meta->>'designation'), ''),
      nullif(trim(meta->>'job_title'), ''),
      'Recruiter'
    );

    insert into public.profiles (user_id, role, first_name, last_name, phone, email)
    values (new.id, 'employer', v_first, v_last, v_phone, new.email);

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
    values (v_employer_id, new.id, v_designation, true);

    insert into public.company_profiles (
      user_id,
      company_name,
      website,
      industry,
      company_size,
      recruiter_name,
      designation,
      work_email,
      phone,
      setup_complete
    ) values (
      new.id,
      '',
      coalesce(meta->>'company_website', ''),
      coalesce(meta->>'industry', ''),
      coalesce(meta->>'company_size', ''),
      coalesce(nullif(trim(v_recruiter), ''), trim(concat_ws(' ', v_first, v_last))),
      v_designation,
      coalesce(new.email, ''),
      coalesce(v_phone, ''),
      false
    );
  else
    v_first := coalesce(meta->>'first_name', split_part(coalesce(meta->>'full_name', ''), ' ', 1));
    v_last := coalesce(
      meta->>'last_name',
      nullif(trim(substr(coalesce(meta->>'full_name', ''), length(split_part(coalesce(meta->>'full_name', ''), ' ', 1)) + 1)), '')
    );
    v_phone := meta->>'phone';
    v_module := meta->>'sap_module';

    insert into public.profiles (user_id, role, first_name, last_name, phone, email)
    values (new.id, 'candidate', nullif(v_first, ''), v_last, v_phone, new.email);

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

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- ---------------------------------------------------------------------------
-- Storage: company logos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Employers can upload own company logo" on storage.objects;
create policy "Employers can upload own company logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Employers can update own company logo" on storage.objects;
create policy "Employers can update own company logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Employers can delete own company logo" on storage.objects;
create policy "Employers can delete own company logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Anyone can view company logos" on storage.objects;
create policy "Anyone can view company logos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'company-logos');
