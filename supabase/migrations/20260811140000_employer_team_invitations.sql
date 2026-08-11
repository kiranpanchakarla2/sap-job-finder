-- Team & Users: employer invitations + employer_accounts DELETE policy
-- Reuses employer_accounts / company_profiles. Does not touch Talent Search.

do $$ begin
  create type public.employer_invitation_status as enum (
    'pending',
    'accepted',
    'cancelled',
    'expired'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.employer_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles (id) on delete cascade,
  email text not null,
  role public.employer_company_role not null,
  invited_by uuid references public.employer_accounts (id) on delete set null,
  status public.employer_invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_invitations_email_check
    check (position('@' in email) > 1),
  constraint employer_invitations_role_check
    check (role in (
      'admin'::public.employer_company_role,
      'recruiter'::public.employer_company_role,
      'hiring_manager'::public.employer_company_role
    ))
);

create index if not exists employer_invitations_company_id_idx
  on public.employer_invitations (company_id);

create index if not exists employer_invitations_company_status_idx
  on public.employer_invitations (company_id, status);

-- One pending invite per email per company
create unique index if not exists employer_invitations_pending_email_unique
  on public.employer_invitations (company_id, lower(email))
  where status = 'pending';

drop trigger if exists employer_invitations_set_updated_at on public.employer_invitations;
create trigger employer_invitations_set_updated_at
  before update on public.employer_invitations
  for each row
  execute function public.set_updated_at();

alter table public.employer_invitations enable row level security;

drop policy if exists "Owners admins view company invitations"
  on public.employer_invitations;
create policy "Owners admins view company invitations"
  on public.employer_invitations for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
  );

drop policy if exists "Owners admins insert company invitations"
  on public.employer_invitations;
create policy "Owners admins insert company invitations"
  on public.employer_invitations for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
    and role in (
      'admin'::public.employer_company_role,
      'recruiter'::public.employer_company_role,
      'hiring_manager'::public.employer_company_role
    )
  );

drop policy if exists "Owners admins update company invitations"
  on public.employer_invitations;
create policy "Owners admins update company invitations"
  on public.employer_invitations for update
  to authenticated
  using (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
  )
  with check (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
  );

revoke all on public.employer_invitations from anon;
grant select, insert, update on public.employer_invitations to authenticated;

-- Allow owner/admin to remove memberships (not Auth users)
drop policy if exists "Owners admins can delete employer accounts"
  on public.employer_accounts;
create policy "Owners admins can delete employer accounts"
  on public.employer_accounts for delete
  to authenticated
  using (
    company_id = public.current_company_id()
    and public.is_company_owner_or_admin()
    and role is distinct from 'owner'::public.employer_company_role
  );

-- Safe team list with profile display fields (company-scoped)
create or replace function public.list_company_team_members()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
  v_items jsonb;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  if not public.is_company_owner_or_admin() then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_company_id := public.current_company_id();
  if v_company_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ea.id,
      'userId', ea.user_id,
      'companyId', ea.company_id,
      'role', ea.role,
      'status', ea.status,
      'createdAt', ea.created_at,
      'updatedAt', ea.updated_at,
      'firstName', p.first_name,
      'lastName', p.last_name,
      'email', coalesce(p.email, ''),
      'avatarUrl', p.avatar_url
    )
    order by
      case ea.role
        when 'owner' then 0
        when 'admin' then 1
        when 'recruiter' then 2
        else 3
      end,
      ea.created_at asc
  ), '[]'::jsonb)
  into v_items
  from public.employer_accounts ea
  left join public.profiles p on p.user_id = ea.user_id
  where ea.company_id = v_company_id;

  return jsonb_build_object('items', coalesce(v_items, '[]'::jsonb));
end;
$$;

revoke all on function public.list_company_team_members() from public, anon;
grant execute on function public.list_company_team_members() to authenticated;

comment on table public.employer_invitations is
  'Pending employer team invitations. Email delivery is a separate server-side step.';
