-- Candidate Sprint 1 Phase 2: profile preferences, certifications metadata,
-- skills insert for authenticated catalog growth, candidate-avatars storage.
-- Reuses profiles / candidate_profiles / skills / candidate_skills /
-- candidate_certifications — does not recreate core identity tables.

-- ---------------------------------------------------------------------------
-- 1) Candidate profile preference + career fields
-- ---------------------------------------------------------------------------
alter table public.candidate_profiles
  add column if not exists employment_status text,
  add column if not exists experience_band text,
  add column if not exists sap_experience_band text,
  add column if not exists current_salary_label text,
  add column if not exists expected_salary_label text,
  add column if not exists preferred_job_roles text[] not null default '{}'::text[],
  add column if not exists preferred_sap_modules text[] not null default '{}'::text[],
  add column if not exists preferred_locations text[] not null default '{}'::text[],
  add column if not exists preferred_salary_range text,
  add column if not exists career_level text,
  add column if not exists open_to_work_job_roles text[] not null default '{}'::text[],
  add column if not exists open_to_work_locations text[] not null default '{}'::text[],
  add column if not exists open_to_work_modes text[] not null default '{}'::text[],
  add column if not exists module_experience jsonb not null default '[]'::jsonb;

comment on column public.candidate_profiles.experience_band is
  'UI experience band label (e.g. ''5 years''); numeric total_experience remains for search.';
comment on column public.candidate_profiles.module_experience is
  'JSON array of {module, years} for SAP module experience UI.';

create index if not exists candidate_profiles_career_level_idx
  on public.candidate_profiles (career_level)
  where career_level is not null;

create index if not exists candidate_profiles_employment_status_idx
  on public.candidate_profiles (employment_status)
  where employment_status is not null;

-- ---------------------------------------------------------------------------
-- 2) Certification credential id + status (extend existing table)
-- ---------------------------------------------------------------------------
alter table public.candidate_certifications
  add column if not exists credential_id text,
  add column if not exists status text not null default 'Active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'candidate_certifications_status_check'
  ) then
    alter table public.candidate_certifications
      add constraint candidate_certifications_status_check
      check (status in ('Active', 'Expired', 'In Progress'));
  end if;
end $$;

create index if not exists candidate_certifications_candidate_id_idx
  on public.candidate_certifications (candidate_id);

-- ---------------------------------------------------------------------------
-- 3) Allow authenticated users to add skill catalog entries (unique name)
--    Candidates still only manage their own candidate_skills via RLS.
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated can insert skills" on public.skills;
create policy "Authenticated can insert skills"
  on public.skills for insert
  to authenticated
  with check (true);

grant select, insert on public.skills to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Storage: candidate-avatars (own folder only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-avatars',
  'candidate-avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Candidates can upload own avatar" on storage.objects;
create policy "Candidates can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Candidates can update own avatar" on storage.objects;
create policy "Candidates can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Candidates can delete own avatar" on storage.objects;
create policy "Candidates can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Anyone can view candidate avatars" on storage.objects;
create policy "Anyone can view candidate avatars"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'candidate-avatars');
