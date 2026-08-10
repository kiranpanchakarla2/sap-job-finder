-- Sprint 1: Employer auth integration — profiles.email + safer employer signup metadata.
-- profiles / RLS already exist from 20260809190000_sapjobsfinder_schema.sql.
-- This migration is additive and safe to re-run where possible.

-- ---------------------------------------------------------------------------
-- profiles.email (Sprint 1 shape; sourced from auth.users, never passwords)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and (p.email is null or p.email = '');

create index if not exists profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------------------
-- handle_new_user: prefer first_name/last_name for employer signup (Sprint 1 UI)
-- Role is never taken from the browser unchecked — only employer|candidate,
-- never admin. Authorization remains in profiles.role (not user_metadata JWT).
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
  -- Never allow public signup to create admin
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

-- ---------------------------------------------------------------------------
-- RLS: keep own-row access; role changes blocked by prevent_profile_role_change.
-- Recreate update policy with explicit WITH CHECK ownership (defense in depth).
-- ---------------------------------------------------------------------------
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Ensure role-change trigger is present
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Changing profile role is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

-- No INSERT policy for authenticated clients — profiles are created by handle_new_user only.

-- handle_new_user is for the auth.users trigger only — not a public RPC
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
