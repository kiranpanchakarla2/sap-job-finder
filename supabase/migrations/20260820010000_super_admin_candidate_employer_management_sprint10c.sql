-- ============================================================================
-- Sprint 10C: Super Admin Candidate & Employer Management
-- ============================================================================

-- 1. Status and Verification Column Additions
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'suspended', 'inactive'));
  end if;
end $$;

create index if not exists profiles_status_idx on public.profiles (status);

-- Candidate profiles status
alter table public.candidate_profiles
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'candidate_profiles_status_check'
      and conrelid = 'public.candidate_profiles'::regclass
  ) then
    alter table public.candidate_profiles
      add constraint candidate_profiles_status_check
      check (status in ('active', 'suspended', 'inactive'));
  end if;
end $$;

create index if not exists candidate_profiles_status_idx on public.candidate_profiles (status);

-- Company profiles status and verification
alter table public.company_profiles
  add column if not exists status text not null default 'active',
  add column if not exists is_verified boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'company_profiles_status_check'
      and conrelid = 'public.company_profiles'::regclass
  ) then
    alter table public.company_profiles
      add constraint company_profiles_status_check
      check (status in ('active', 'suspended', 'inactive'));
  end if;
end $$;

create index if not exists company_profiles_status_idx on public.company_profiles (status);
create index if not exists company_profiles_is_verified_idx on public.company_profiles (is_verified);

-- ----------------------------------------------------------------------------
-- 2. Super Admin RLS Policies for Candidate & Employer Management
-- ----------------------------------------------------------------------------

-- Candidate profiles UPDATE policy
drop policy if exists "Super admins can update all candidate profiles" on public.candidate_profiles;
create policy "Super admins can update all candidate profiles"
  on public.candidate_profiles
  for update
  to authenticated
  using (public.is_admin_or_super_admin())
  with check (public.is_admin_or_super_admin());

-- Company profiles UPDATE policy
drop policy if exists "Super admins can update all company profiles" on public.company_profiles;
create policy "Super admins can update all company profiles"
  on public.company_profiles
  for update
  to authenticated
  using (public.is_admin_or_super_admin())
  with check (public.is_admin_or_super_admin());

-- Employer profiles UPDATE policy
drop policy if exists "Super admins can update all employer profiles" on public.employer_profiles;
create policy "Super admins can update all employer profiles"
  on public.employer_profiles
  for update
  to authenticated
  using (public.is_admin_or_super_admin())
  with check (public.is_admin_or_super_admin());

-- Employer accounts UPDATE policy
drop policy if exists "Super admins can update all employer accounts" on public.employer_accounts;
create policy "Super admins can update all employer accounts"
  on public.employer_accounts
  for update
  to authenticated
  using (public.is_admin_or_super_admin())
  with check (public.is_admin_or_super_admin());

-- Candidate child tables SELECT policies for Super Admin
drop policy if exists "Super admins can view candidate skills" on public.candidate_skills;
create policy "Super admins can view candidate skills"
  on public.candidate_skills
  for select
  to authenticated
  using (public.is_admin_or_super_admin() OR (candidate_id = public.current_candidate_id()));

drop policy if exists "Super admins can view candidate experience" on public.candidate_experience;
create policy "Super admins can view candidate experience"
  on public.candidate_experience
  for select
  to authenticated
  using (public.is_admin_or_super_admin() OR (candidate_id = public.current_candidate_id()));

drop policy if exists "Super admins can view candidate education" on public.candidate_education;
create policy "Super admins can view candidate education"
  on public.candidate_education
  for select
  to authenticated
  using (public.is_admin_or_super_admin() OR (candidate_id = public.current_candidate_id()));

drop policy if exists "Super admins can view candidate certifications" on public.candidate_certifications;
create policy "Super admins can view candidate certifications"
  on public.candidate_certifications
  for select
  to authenticated
  using (public.is_admin_or_super_admin() OR (candidate_id = public.current_candidate_id()));

drop policy if exists "Super admins can view candidate resumes" on public.candidate_resumes;
create policy "Super admins can view candidate resumes"
  on public.candidate_resumes
  for select
  to authenticated
  using (public.is_admin_or_super_admin() OR (candidate_id = public.current_candidate_id()));

drop policy if exists "Super admins can view candidate settings" on public.candidate_settings;
create policy "Super admins can view candidate settings"
  on public.candidate_settings
  for select
  to authenticated
  using (public.is_admin_or_super_admin() OR (candidate_id = public.current_candidate_id()));

-- Candidate career highlights
do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'candidate_career_highlights'
  ) then
    execute '
      drop policy if exists "Super admins can view candidate career highlights" on public.candidate_career_highlights;
      create policy "Super admins can view candidate career highlights"
        on public.candidate_career_highlights
        for select
        to authenticated
        using (public.is_admin_or_super_admin() OR (candidate_id = public.current_candidate_id()));
    ';
  end if;
end $$;

-- Employer invitations
drop policy if exists "Super admins can view employer invitations" on public.employer_invitations;
create policy "Super admins can view employer invitations"
  on public.employer_invitations
  for select
  to authenticated
  using (public.is_admin_or_super_admin() OR (company_id = public.current_company_id()));

-- ----------------------------------------------------------------------------
-- 3. Administrative RPCs for Atomic Actions
-- ----------------------------------------------------------------------------

-- Suspend Candidate
create or replace function public.admin_suspend_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'Unauthorized: Super admin permission required';
  end if;

  select user_id into v_user_id
  from public.candidate_profiles
  where id = p_candidate_id;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Candidate not found');
  end if;

  update public.candidate_profiles
  set status = 'suspended',
      updated_at = now()
  where id = p_candidate_id;

  update public.profiles
  set status = 'suspended',
      updated_at = now()
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'candidate_id', p_candidate_id, 'status', 'suspended');
end;
$$;

-- Reactivate Candidate
create or replace function public.admin_reactivate_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'Unauthorized: Super admin permission required';
  end if;

  select user_id into v_user_id
  from public.candidate_profiles
  where id = p_candidate_id;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Candidate not found');
  end if;

  update public.candidate_profiles
  set status = 'active',
      updated_at = now()
  where id = p_candidate_id;

  update public.profiles
  set status = 'active',
      updated_at = now()
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'candidate_id', p_candidate_id, 'status', 'active');
end;
$$;

-- Suspend Employer
create or replace function public.admin_suspend_employer(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'Unauthorized: Super admin permission required';
  end if;

  select user_id into v_user_id
  from public.company_profiles
  where id = p_company_id;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Company not found');
  end if;

  -- Update company profile status
  update public.company_profiles
  set status = 'suspended',
      updated_at = now()
  where id = p_company_id;

  -- Suspend all associated employer_accounts for this company
  update public.employer_accounts
  set status = 'suspended'::public.employer_account_status,
      updated_at = now()
  where company_id = p_company_id;

  -- Suspend owner profile
  update public.profiles
  set status = 'suspended',
      updated_at = now()
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'company_id', p_company_id, 'status', 'suspended');
end;
$$;

-- Reactivate Employer
create or replace function public.admin_reactivate_employer(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'Unauthorized: Super admin permission required';
  end if;

  select user_id into v_user_id
  from public.company_profiles
  where id = p_company_id;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Company not found');
  end if;

  -- Update company profile status
  update public.company_profiles
  set status = 'active',
      updated_at = now()
  where id = p_company_id;

  -- Reactivate owner employer account
  update public.employer_accounts
  set status = 'active'::public.employer_account_status,
      updated_at = now()
  where company_id = p_company_id;

  -- Reactivate owner profile
  update public.profiles
  set status = 'active',
      updated_at = now()
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'company_id', p_company_id, 'status', 'active');
end;
$$;

-- Verify / Unverify Employer
create or replace function public.admin_verify_employer(p_company_id uuid, p_verified boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'Unauthorized: Super admin permission required';
  end if;

  select user_id into v_user_id
  from public.company_profiles
  where id = p_company_id;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Company not found');
  end if;

  update public.company_profiles
  set is_verified = p_verified,
      updated_at = now()
  where id = p_company_id;

  update public.employer_profiles
  set is_verified = p_verified,
      updated_at = now()
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'company_id', p_company_id, 'is_verified', p_verified);
end;
$$;

grant execute on function public.admin_suspend_candidate(uuid) to authenticated;
grant execute on function public.admin_reactivate_candidate(uuid) to authenticated;
grant execute on function public.admin_suspend_employer(uuid) to authenticated;
grant execute on function public.admin_reactivate_employer(uuid) to authenticated;
grant execute on function public.admin_verify_employer(uuid, boolean) to authenticated;
