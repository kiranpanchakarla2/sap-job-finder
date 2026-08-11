-- Architecture alignment: multi-employer company membership
-- Canonical tenant remains company_profiles.id (company_id).
-- Adds employer_accounts + role helpers; does not rebuild Sprint 1–6B tables.
-- Additive / backfill-safe for existing single-owner companies.

-- ---------------------------------------------------------------------------
-- 1) Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.employer_company_role as enum (
    'owner',
    'admin',
    'recruiter',
    'hiring_manager'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.employer_account_status as enum (
    'active',
    'invited',
    'suspended'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2) employer_accounts (canonical company membership)
-- ---------------------------------------------------------------------------
create table if not exists public.employer_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.company_profiles (id) on delete cascade,
  role public.employer_company_role not null default 'recruiter',
  status public.employer_account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_accounts_user_company_unique unique (user_id, company_id)
);

create index if not exists employer_accounts_user_id_idx
  on public.employer_accounts (user_id);

create index if not exists employer_accounts_company_id_idx
  on public.employer_accounts (company_id);

create index if not exists employer_accounts_company_status_idx
  on public.employer_accounts (company_id, status);

create index if not exists employer_accounts_active_user_idx
  on public.employer_accounts (user_id)
  where status = 'active';

drop trigger if exists employer_accounts_set_updated_at on public.employer_accounts;
create trigger employer_accounts_set_updated_at
  before update on public.employer_accounts
  for each row
  execute function public.set_updated_at();

-- One active membership per user (product is single-company membership)
create unique index if not exists employer_accounts_one_active_per_user_idx
  on public.employer_accounts (user_id)
  where status = 'active';

-- At most one owner per company
create unique index if not exists employer_accounts_one_owner_per_company_idx
  on public.employer_accounts (company_id)
  where role = 'owner' and status in ('active', 'invited');

-- Backfill: founding company_profiles.user_id → owner
insert into public.employer_accounts (user_id, company_id, role, status)
select c.user_id, c.id, 'owner'::public.employer_company_role, 'active'::public.employer_account_status
from public.company_profiles c
on conflict (user_id, company_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3) jobs.assigned_to (nullable; employer_accounts)
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists assigned_to uuid references public.employer_accounts (id) on delete set null;

create index if not exists jobs_assigned_to_idx on public.jobs (assigned_to);

create or replace function public.validate_job_assigned_to()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.assigned_to is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.employer_accounts ea
    where ea.id = new.assigned_to
      and ea.company_id = new.company_id
      and ea.status = 'active'
  ) then
    raise exception 'assigned_to must be an active employer account in the same company';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_validate_assigned_to on public.jobs;
create trigger jobs_validate_assigned_to
  before insert or update of assigned_to, company_id on public.jobs
  for each row
  execute function public.validate_job_assigned_to();

-- Allow assigned_to changes (ownership columns still protected)
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

-- ---------------------------------------------------------------------------
-- 4) saved_candidates.saved_by
-- ---------------------------------------------------------------------------
alter table public.saved_candidates
  add column if not exists saved_by uuid references public.employer_accounts (id) on delete set null;

create index if not exists saved_candidates_saved_by_idx
  on public.saved_candidates (saved_by);

update public.saved_candidates sc
set saved_by = ea.id
from public.employer_accounts ea
where sc.saved_by is null
  and ea.company_id = sc.company_id
  and ea.role = 'owner'
  and ea.status = 'active';

alter table public.employer_shortlisted_candidates
  add column if not exists created_by uuid references public.employer_accounts (id) on delete set null;

create index if not exists employer_shortlisted_candidates_created_by_idx
  on public.employer_shortlisted_candidates (created_by);

update public.employer_shortlisted_candidates esc
set created_by = ea.id
from public.employer_accounts ea
where esc.created_by is null
  and ea.company_id = esc.company_id
  and ea.role = 'owner'
  and ea.status = 'active';

-- ---------------------------------------------------------------------------
-- 5) Auth resolution helpers (auth.uid → membership → company + role)
-- ---------------------------------------------------------------------------
create or replace function public.get_current_employer_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select id
  from public.employer_accounts
  where user_id = auth.uid()
    and status = 'active'
  order by created_at asc
  limit 1;
$$;

create or replace function public.get_current_employer_role()
returns public.employer_company_role
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role
  from public.employer_accounts
  where user_id = auth.uid()
    and status = 'active'
  order by created_at asc
  limit 1;
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (
      select company_id
      from public.employer_accounts
      where user_id = auth.uid()
        and status = 'active'
      order by created_at asc
      limit 1
    ),
    (
      select id
      from public.company_profiles
      where user_id = auth.uid()
      limit 1
    )
  );
$$;

create or replace function public.is_company_owner_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.employer_accounts
    where user_id = auth.uid()
      and status = 'active'
      and role in ('owner'::public.employer_company_role, 'admin'::public.employer_company_role)
  );
$$;

-- Job access: owner/admin all company jobs; recruiter created; HM assigned
create or replace function public.can_access_job(p_job_id uuid)
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
    join public.employer_accounts ea
      on ea.company_id = j.company_id
     and ea.user_id = auth.uid()
     and ea.status = 'active'
    where j.id = p_job_id
      and (
        ea.role in ('owner'::public.employer_company_role, 'admin'::public.employer_company_role)
        or (ea.role = 'recruiter'::public.employer_company_role and j.created_by = auth.uid())
        or (ea.role = 'hiring_manager'::public.employer_company_role and j.assigned_to = ea.id)
        -- Fallback for legacy single-owner companies before assignment exists:
        -- recruiters with no peer jobs can still see all company jobs when they
        -- are the only active member (preserves current Sprint behavior).
        or (
          ea.role = 'recruiter'::public.employer_company_role
          and not exists (
            select 1
            from public.employer_accounts other
            where other.company_id = ea.company_id
              and other.id is distinct from ea.id
              and other.status = 'active'
          )
        )
      )
  )
  -- Legacy path: company_profiles / employer_profiles owner without membership row yet
  or exists (
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

create or replace function public.can_manage_job(p_job_id uuid)
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
    join public.employer_accounts ea
      on ea.company_id = j.company_id
     and ea.user_id = auth.uid()
     and ea.status = 'active'
    where j.id = p_job_id
      and (
        ea.role in ('owner'::public.employer_company_role, 'admin'::public.employer_company_role)
        or (ea.role = 'recruiter'::public.employer_company_role and j.created_by = auth.uid())
        or (
          ea.role = 'recruiter'::public.employer_company_role
          and not exists (
            select 1
            from public.employer_accounts other
            where other.company_id = ea.company_id
              and other.id is distinct from ea.id
              and other.status = 'active'
          )
        )
      )
  )
  or exists (
    select 1
    from public.jobs j
    join public.company_profiles c on c.id = j.company_id
    where j.id = p_job_id
      and c.user_id = auth.uid()
  );
$$;

-- Keep owns_job as alias for read access (used widely by Sprint 4–5 RLS)
create or replace function public.owns_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.can_access_job(p_job_id);
$$;

create or replace function public.require_employer_company_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.app_role;
  v_membership_status public.employer_account_status;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_role := public.current_app_role();
  if v_role is distinct from 'employer' and v_role is distinct from 'admin' then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select company_id, status
  into v_company_id, v_membership_status
  from public.employer_accounts
  where user_id = auth.uid()
    and status = 'active'
  order by created_at asc
  limit 1;

  if v_company_id is null then
    v_company_id := (
      select id from public.company_profiles where user_id = auth.uid() limit 1
    );
  end if;

  if v_company_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  -- Suspended accounts must not pass Talent Search / protected RPCs
  if exists (
    select 1
    from public.employer_accounts
    where user_id = auth.uid()
      and company_id = v_company_id
      and status = 'suspended'
  ) and not exists (
    select 1
    from public.employer_accounts
    where user_id = auth.uid()
      and company_id = v_company_id
      and status = 'active'
  ) then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  return v_company_id;
end;
$$;

-- Auto-create owner membership when a company_profiles row is inserted
create or replace function public.create_owner_employer_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.employer_accounts (user_id, company_id, role, status)
  values (
    new.user_id,
    new.id,
    'owner'::public.employer_company_role,
    'active'::public.employer_account_status
  )
  on conflict (user_id, company_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_company_owner_employer_account on public.company_profiles;
create trigger trg_company_owner_employer_account
  after insert on public.company_profiles
  for each row
  execute function public.create_owner_employer_account();

-- ---------------------------------------------------------------------------
-- 6) Grants on helpers
-- ---------------------------------------------------------------------------
revoke all on function public.get_current_employer_account_id() from public;
revoke all on function public.get_current_employer_role() from public;
revoke all on function public.is_company_owner_or_admin() from public;
revoke all on function public.can_access_job(uuid) from public;
revoke all on function public.can_manage_job(uuid) from public;

grant execute on function public.get_current_employer_account_id() to authenticated;
grant execute on function public.get_current_employer_role() to authenticated;
grant execute on function public.is_company_owner_or_admin() to authenticated;
grant execute on function public.can_access_job(uuid) to authenticated;
grant execute on function public.can_manage_job(uuid) to authenticated;
grant execute on function public.current_company_id() to anon, authenticated, service_role;
grant execute on function public.owns_job(uuid) to anon, authenticated, service_role;
grant execute on function public.require_employer_company_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 7) RLS: employer_accounts
-- ---------------------------------------------------------------------------
alter table public.employer_accounts enable row level security;

drop policy if exists "Members can view company employer accounts" on public.employer_accounts;
create policy "Members can view company employer accounts"
  on public.employer_accounts for select
  to authenticated
  using (
    company_id = public.current_company_id()
    or user_id = (select auth.uid())
  );

drop policy if exists "Owners admins can insert employer accounts" on public.employer_accounts;
create policy "Owners admins can insert employer accounts"
  on public.employer_accounts for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
  );

drop policy if exists "Owners admins can update employer accounts" on public.employer_accounts;
create policy "Owners admins can update employer accounts"
  on public.employer_accounts for update
  to authenticated
  using (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
  )
  with check (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
  );

revoke all on public.employer_accounts from anon;
grant select, insert, update on public.employer_accounts to authenticated;

-- ---------------------------------------------------------------------------
-- 8) RLS: company_profiles — members read; owner/admin update
-- ---------------------------------------------------------------------------
drop policy if exists "Employers can view own company profile" on public.company_profiles;
create policy "Employers can view own company profile"
  on public.company_profiles for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or id = public.current_company_id()
  );

drop policy if exists "Employers can update own company profile" on public.company_profiles;
create policy "Employers can update own company profile"
  on public.company_profiles for update
  to authenticated
  using (
    (
      user_id = (select auth.uid())
      or (
        id = public.current_company_id()
        and public.is_company_owner_or_admin()
      )
    )
  )
  with check (
    (
      user_id = (select auth.uid())
      or (
        id = public.current_company_id()
        and public.is_company_owner_or_admin()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 9) RLS: jobs — role-aware manage; company-scoped select for members
-- ---------------------------------------------------------------------------
drop policy if exists "Employers can view own company jobs" on public.jobs;
create policy "Employers can view own company jobs"
  on public.jobs for select
  to authenticated
  using (
    company_id = (select public.current_company_id())
    and public.can_access_job(id)
  );

drop policy if exists "Employers can update own company jobs" on public.jobs;
create policy "Employers can update own company jobs"
  on public.jobs for update
  to authenticated
  using (public.can_manage_job(id))
  with check (
    company_id = (select public.current_company_id())
    and public.can_manage_job(id)
  );

drop policy if exists "Employers can delete own draft jobs" on public.jobs;
create policy "Employers can delete own draft jobs"
  on public.jobs for delete
  to authenticated
  using (
    public.can_manage_job(id)
    and status = 'draft'
  );

-- Insert still derives company from membership; created_by remains auth.uid()
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
    and exists (
      select 1
      from public.employer_accounts ea
      where ea.user_id = (select auth.uid())
        and ea.company_id = company_id
        and ea.status = 'active'
        and ea.role in (
          'owner'::public.employer_company_role,
          'admin'::public.employer_company_role,
          'recruiter'::public.employer_company_role
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 10) saved / shortlist insert sets actor when possible (RLS still company-scoped)
-- ---------------------------------------------------------------------------
drop policy if exists "Employers can insert own company saved candidates"
  on public.saved_candidates;
create policy "Employers can insert own company saved candidates"
  on public.saved_candidates for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and (
      saved_by is null
      or saved_by = public.get_current_employer_account_id()
    )
  );

drop policy if exists "Employers can insert own company talent shortlist"
  on public.employer_shortlisted_candidates;
create policy "Employers can insert own company talent shortlist"
  on public.employer_shortlisted_candidates for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and (
      created_by is null
      or created_by = public.get_current_employer_account_id()
    )
  );

comment on table public.employer_accounts is
  'Canonical employer membership: auth user ↔ company with role/status. Tenant key is company_id (= company_profiles.id).';

comment on column public.jobs.assigned_to is
  'Optional hiring manager (employer_accounts.id) for the job; must belong to jobs.company_id.';

comment on column public.jobs.created_by is
  'Auth user who created the job (historical). Prefer resolving membership via employer_accounts.user_id.';

-- Applicant profile visibility via job access (membership-aware)
drop policy if exists "Employers can view candidate profiles of applicants"
  on public.candidate_profiles;
create policy "Employers can view candidate profiles of applicants"
  on public.candidate_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      where ja.candidate_id = candidate_profiles.id
        and public.can_access_job(ja.job_id)
    )
  );
