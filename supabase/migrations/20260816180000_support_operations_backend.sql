-- =============================================================================
-- Migration: 20260816180000_support_operations_backend.sql
-- Sprint 8E: Support Operations Backend
-- Creates contact_request_notes, contact_request_events (audit log),
-- automated audit triggers, search indexes, and privileged support RPCs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table Definition: contact_request_notes (Internal Support Notes)
-- -----------------------------------------------------------------------------
create table if not exists public.contact_request_notes (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contact_request_notes_note_check check (
    char_length(trim(note)) > 0 and char_length(note) <= 5000
  )
);

create index if not exists contact_request_notes_request_id_idx
  on public.contact_request_notes (contact_request_id, created_at asc);

create index if not exists contact_request_notes_author_idx
  on public.contact_request_notes (author_user_id)
  where author_user_id is not null;

drop trigger if exists contact_request_notes_set_updated_at on public.contact_request_notes;
create trigger contact_request_notes_set_updated_at
  before update on public.contact_request_notes
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Table Definition: contact_request_events (Immutable Audit Log)
-- -----------------------------------------------------------------------------
create table if not exists public.contact_request_events (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  old_value text,
  new_value text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint contact_request_events_type_check check (
    event_type in (
      'created',
      'status_changed',
      'priority_changed',
      'assigned',
      'unassigned',
      'note_added',
      'attachment_uploaded'
    )
  )
);

create index if not exists contact_request_events_request_id_idx
  on public.contact_request_events (contact_request_id, created_at asc);

create index if not exists contact_request_events_actor_idx
  on public.contact_request_events (actor_user_id)
  where actor_user_id is not null;

create index if not exists contact_request_events_type_idx
  on public.contact_request_events (event_type);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security: Notes & Audit Events
-- -----------------------------------------------------------------------------
alter table public.contact_request_notes enable row level security;
alter table public.contact_request_events enable row level security;

-- contact_request_notes: Accessible exclusively to Admins
drop policy if exists "Admins can read contact request notes" on public.contact_request_notes;
create policy "Admins can read contact request notes"
  on public.contact_request_notes for select
  to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists "Admins can insert contact request notes" on public.contact_request_notes;
create policy "Admins can insert contact request notes"
  on public.contact_request_notes for insert
  to authenticated
  with check (public.current_app_role() = 'admin');

drop policy if exists "Admins can update contact request notes" on public.contact_request_notes;
create policy "Admins can update contact request notes"
  on public.contact_request_notes for update
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists "Admins can delete contact request notes" on public.contact_request_notes;
create policy "Admins can delete contact request notes"
  on public.contact_request_notes for delete
  to authenticated
  using (public.current_app_role() = 'admin');

-- contact_request_events: Read-only for Admins. No UPDATE or DELETE policies (Immutable).
drop policy if exists "Admins can read contact request events" on public.contact_request_events;
create policy "Admins can read contact request events"
  on public.contact_request_events for select
  to authenticated
  using (public.current_app_role() = 'admin');

-- Explicit Grants
revoke all on public.contact_request_notes from public;
grant select, insert, update, delete on public.contact_request_notes to authenticated;

revoke all on public.contact_request_events from public;
grant select on public.contact_request_events to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Automated Audit Triggers
-- -----------------------------------------------------------------------------
create or replace function public.log_contact_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();

  if TG_OP = 'INSERT' then
    insert into public.contact_request_events (
      contact_request_id,
      actor_user_id,
      event_type,
      old_value,
      new_value,
      metadata
    ) values (
      new.id,
      coalesce(v_actor_id, new.user_id),
      'created',
      null,
      new.status,
      jsonb_build_object(
        'user_type', new.user_type,
        'category', new.category,
        'has_attachment', (new.attachment_url is not null)
      )
    );
  elsif TG_OP = 'UPDATE' then
    -- Status change
    if old.status is distinct from new.status then
      insert into public.contact_request_events (
        contact_request_id,
        actor_user_id,
        event_type,
        old_value,
        new_value
      ) values (
        new.id,
        v_actor_id,
        'status_changed',
        old.status,
        new.status
      );
    end if;

    -- Priority change
    if old.priority is distinct from new.priority then
      insert into public.contact_request_events (
        contact_request_id,
        actor_user_id,
        event_type,
        old_value,
        new_value
      ) values (
        new.id,
        v_actor_id,
        'priority_changed',
        old.priority,
        new.priority
      );
    end if;

    -- Assignment change
    if old.assigned_to is distinct from new.assigned_to then
      if new.assigned_to is not null then
        insert into public.contact_request_events (
          contact_request_id,
          actor_user_id,
          event_type,
          old_value,
          new_value
        ) values (
          new.id,
          v_actor_id,
          'assigned',
          old.assigned_to::text,
          new.assigned_to::text
        );
      else
        insert into public.contact_request_events (
          contact_request_id,
          actor_user_id,
          event_type,
          old_value,
          new_value
        ) values (
          new.id,
          v_actor_id,
          'unassigned',
          old.assigned_to::text,
          null
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists contact_requests_audit on public.contact_requests;
create trigger contact_requests_audit
  after insert or update on public.contact_requests
  for each row
  execute function public.log_contact_request_change();

create or replace function public.log_contact_request_note_change()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  insert into public.contact_request_events (
    contact_request_id,
    actor_user_id,
    event_type,
    old_value,
    new_value,
    metadata
  ) values (
    new.contact_request_id,
    coalesce(auth.uid(), new.author_user_id),
    'note_added',
    null,
    null,
    jsonb_build_object('note_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists contact_request_notes_audit on public.contact_request_notes;
create trigger contact_request_notes_audit
  after insert on public.contact_request_notes
  for each row
  execute function public.log_contact_request_note_change();

-- -----------------------------------------------------------------------------
-- 5. Search Optimization Indexes
-- -----------------------------------------------------------------------------
create index if not exists contact_requests_updated_at_idx
  on public.contact_requests (updated_at desc);

create index if not exists contact_requests_search_idx
  on public.contact_requests
  using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(message, '')));

-- -----------------------------------------------------------------------------
-- 6. Helper: Verify Support Admin Permissions
-- -----------------------------------------------------------------------------
create or replace function public.check_support_admin_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Direct backend superuser/service_role connection check
  if session_user in ('postgres', 'service_role') and (auth.role() is null or auth.role() in ('service_role', 'supabase_admin')) then
    return;
  end if;

  -- PostgREST client session: must be authenticated and have platform role 'admin'
  if auth.uid() is null or public.current_app_role() is distinct from 'admin' then
    raise exception 'Access denied: Support operations require administrator privileges'
      using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. RPC: get_support_requests (Paginated Search & Filter)
-- -----------------------------------------------------------------------------
create or replace function public.get_support_requests(
  p_search text default null,
  p_user_type text default null,
  p_status text default null,
  p_priority text default null,
  p_category text default null,
  p_company_id uuid default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_page integer default 1,
  p_page_size integer default 20,
  p_sort_by text default 'created_at',
  p_sort_direction text default 'desc'
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_page integer := coalesce(p_page, 1);
  v_page_size integer := coalesce(p_page_size, 20);
  v_offset integer;
  v_total bigint;
  v_data jsonb;
  v_search text := nullif(trim(p_search), '');
begin
  -- 1. Authorization check
  perform public.check_support_admin_access();

  -- Normalize pagination boundaries
  if v_page < 1 then v_page := 1; end if;
  if v_page_size < 1 then v_page_size := 20; end if;
  if v_page_size > 100 then v_page_size := 100; end if;
  v_offset := (v_page - 1) * v_page_size;

  -- 2. Compute total matching rows
  select count(*) into v_total
  from public.contact_requests cr
  left join public.company_profiles cp on cp.id = cr.company_id
  where
    (p_user_type is null or cr.user_type = p_user_type)
    and (p_status is null or cr.status = p_status)
    and (p_priority is null or cr.priority = p_priority)
    and (p_category is null or cr.category = p_category)
    and (p_company_id is null or cr.company_id = p_company_id)
    and (p_date_from is null or cr.created_at >= p_date_from)
    and (p_date_to is null or cr.created_at <= p_date_to)
    and (
      v_search is null
      or to_tsvector('english', coalesce(cr.name, '') || ' ' || coalesce(cr.email, '') || ' ' || coalesce(cr.subject, '') || ' ' || coalesce(cr.message, '')) @@ plainto_tsquery('english', v_search)
      or cr.name ilike '%' || v_search || '%'
      or cr.email ilike '%' || v_search || '%'
      or cr.subject ilike '%' || v_search || '%'
      or cr.message ilike '%' || v_search || '%'
      or (cp.company_name is not null and cp.company_name ilike '%' || v_search || '%')
    );

  -- 3. Fetch paginated records with joined context
  select coalesce(jsonb_agg(item), '[]'::jsonb) into v_data
  from (
    select
      cr.id,
      cr.user_id,
      cr.user_type,
      cr.company_id,
      cr.name,
      cr.email,
      cr.category,
      cr.subject,
      cr.message,
      cr.attachment_url,
      cr.attachment_name,
      cr.attachment_size,
      cr.status,
      cr.priority,
      cr.assigned_to,
      cr.admin_notes,
      cr.created_at,
      cr.updated_at,
      cp.company_name,
      cp.logo_url as company_logo_url,
      coalesce(
        nullif(trim(concat(p.first_name, ' ', p.last_name)), ''),
        nullif(trim(concat(cand.first_name, ' ', cand.last_name)), ''),
        cr.name
      ) as user_display_name,
      p.role as user_role,
      (
        select count(*)::int
        from public.contact_request_notes n
        where n.contact_request_id = cr.id
      ) as notes_count,
      (
        select count(*)::int
        from public.contact_request_events e
        where e.contact_request_id = cr.id
      ) as events_count
    from public.contact_requests cr
    left join public.company_profiles cp on cp.id = cr.company_id
    left join public.profiles p on p.user_id = cr.user_id
    left join public.candidate_profiles cand on cand.user_id = cr.user_id
    where
      (p_user_type is null or cr.user_type = p_user_type)
      and (p_status is null or cr.status = p_status)
      and (p_priority is null or cr.priority = p_priority)
      and (p_category is null or cr.category = p_category)
      and (p_company_id is null or cr.company_id = p_company_id)
      and (p_date_from is null or cr.created_at >= p_date_from)
      and (p_date_to is null or cr.created_at <= p_date_to)
      and (
        v_search is null
        or to_tsvector('english', coalesce(cr.name, '') || ' ' || coalesce(cr.email, '') || ' ' || coalesce(cr.subject, '') || ' ' || coalesce(cr.message, '')) @@ plainto_tsquery('english', v_search)
        or cr.name ilike '%' || v_search || '%'
        or cr.email ilike '%' || v_search || '%'
        or cr.subject ilike '%' || v_search || '%'
        or cr.message ilike '%' || v_search || '%'
        or (cp.company_name is not null and cp.company_name ilike '%' || v_search || '%')
      )
    order by
      case when p_sort_by = 'priority' and p_sort_direction = 'asc' then
        case cr.priority when 'low' then 1 when 'normal' then 2 when 'high' then 3 when 'urgent' then 4 else 5 end
      end asc,
      case when p_sort_by = 'priority' and (p_sort_direction is null or p_sort_direction = 'desc') then
        case cr.priority when 'urgent' then 1 when 'high' then 2 when 'normal' then 3 when 'low' then 4 else 5 end
      end asc,
      case when p_sort_by = 'updated_at' and p_sort_direction = 'asc' then cr.updated_at end asc,
      case when p_sort_by = 'updated_at' and (p_sort_direction is null or p_sort_direction = 'desc') then cr.updated_at end desc,
      case when (p_sort_by is null or p_sort_by = 'created_at') and p_sort_direction = 'asc' then cr.created_at end asc,
      case when (p_sort_by is null or p_sort_by = 'created_at') and (p_sort_direction is null or p_sort_direction = 'desc') then cr.created_at end desc
    offset v_offset
    limit v_page_size
  ) item;

  return jsonb_build_object(
    'data', v_data,
    'total', v_total,
    'page', v_page,
    'pageSize', v_page_size,
    'totalPages', ceil(v_total::numeric / v_page_size)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. RPC: get_support_request_by_id (Detailed Single Request with Notes & Events)
-- -----------------------------------------------------------------------------
create or replace function public.get_support_request_by_id(
  p_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_record jsonb;
  v_notes jsonb;
  v_events jsonb;
begin
  -- 1. Authorization check
  perform public.check_support_admin_access();

  -- 2. Fetch base request + context
  select to_jsonb(t) into v_record
  from (
    select
      cr.id,
      cr.user_id,
      cr.user_type,
      cr.company_id,
      cr.name,
      cr.email,
      cr.category,
      cr.subject,
      cr.message,
      cr.attachment_url,
      cr.attachment_name,
      cr.attachment_size,
      cr.status,
      cr.priority,
      cr.assigned_to,
      cr.admin_notes,
      cr.created_at,
      cr.updated_at,
      cp.company_name,
      cp.logo_url as company_logo_url,
      cp.website as company_website,
      coalesce(
        nullif(trim(concat(p.first_name, ' ', p.last_name)), ''),
        nullif(trim(concat(cand.first_name, ' ', cand.last_name)), ''),
        cr.name
      ) as user_display_name,
      p.role as user_role,
      p.avatar_url as user_avatar_url
    from public.contact_requests cr
    left join public.company_profiles cp on cp.id = cr.company_id
    left join public.profiles p on p.user_id = cr.user_id
    left join public.candidate_profiles cand on cand.user_id = cr.user_id
    where cr.id = p_id
  ) t;

  if v_record is null then
    return null;
  end if;

  -- 3. Fetch notes with author profile
  select coalesce(jsonb_agg(n_item), '[]'::jsonb) into v_notes
  from (
    select
      n.id,
      n.contact_request_id,
      n.author_user_id,
      n.note,
      n.created_at,
      n.updated_at,
      coalesce(nullif(trim(concat(ap.first_name, ' ', ap.last_name)), ''), 'Support Admin') as author_name,
      ap.avatar_url as author_avatar_url
    from public.contact_request_notes n
    left join public.profiles ap on ap.user_id = n.author_user_id
    where n.contact_request_id = p_id
    order by n.created_at asc
  ) n_item;

  -- 4. Fetch audit events
  select coalesce(jsonb_agg(e_item), '[]'::jsonb) into v_events
  from (
    select
      e.id,
      e.contact_request_id,
      e.actor_user_id,
      e.event_type,
      e.old_value,
      e.new_value,
      e.metadata,
      e.created_at,
      coalesce(nullif(trim(concat(ep.first_name, ' ', ep.last_name)), ''), 'System / User') as actor_name
    from public.contact_request_events e
    left join public.profiles ep on ep.user_id = e.actor_user_id
    where e.contact_request_id = p_id
    order by e.created_at asc
  ) e_item;

  return v_record || jsonb_build_object('notes', v_notes, 'events', v_events);
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. RPC: update_support_request_status
-- -----------------------------------------------------------------------------
create or replace function public.update_support_request_status(
  p_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_current_status text;
  v_updated jsonb;
begin
  -- 1. Authorization check
  perform public.check_support_admin_access();

  -- 2. Validate input status
  if p_status not in ('new', 'in_progress', 'resolved', 'closed') then
    raise exception 'Invalid status "%". Status must be new, in_progress, resolved, or closed.', p_status
      using errcode = '22023';
  end if;

  -- 3. Fetch current status
  select status into v_current_status
  from public.contact_requests
  where id = p_id;

  if not found then
    raise exception 'Contact request with ID % not found.', p_id
      using errcode = 'P0002';
  end if;

  -- If status is unchanged, return current row
  if v_current_status = p_status then
    select to_jsonb(cr.*) into v_updated from public.contact_requests cr where cr.id = p_id;
    return v_updated;
  end if;

  -- 4. Validate status transitions
  -- Allowed transitions:
  -- new -> in_progress, resolved, closed
  -- in_progress -> resolved, closed, new
  -- resolved -> in_progress, closed
  -- closed -> in_progress (reopen)
  if v_current_status = 'closed' and p_status not in ('in_progress') then
    raise exception 'Invalid transition from "closed" to "%". Closed requests can only be reopened to "in_progress".', p_status
      using errcode = '22023';
  end if;

  -- 5. Update record
  update public.contact_requests
  set status = p_status,
      updated_at = now()
  where id = p_id
  returning to_jsonb(contact_requests.*) into v_updated;

  return v_updated;
end;
$$;

-- -----------------------------------------------------------------------------
-- 10. RPC: update_support_request_priority
-- -----------------------------------------------------------------------------
create or replace function public.update_support_request_priority(
  p_id uuid,
  p_priority text
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_updated jsonb;
begin
  -- 1. Authorization check
  perform public.check_support_admin_access();

  -- 2. Validate priority
  if p_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Invalid priority "%". Priority must be low, normal, high, or urgent.', p_priority
      using errcode = '22023';
  end if;

  -- 3. Update record
  update public.contact_requests
  set priority = p_priority,
      updated_at = now()
  where id = p_id
  returning to_jsonb(contact_requests.*) into v_updated;

  if not found then
    raise exception 'Contact request with ID % not found.', p_id
      using errcode = 'P0002';
  end if;

  return v_updated;
end;
$$;

-- -----------------------------------------------------------------------------
-- 11. RPC: assign_support_request
-- -----------------------------------------------------------------------------
create or replace function public.assign_support_request(
  p_id uuid,
  p_assigned_to uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_updated jsonb;
  v_user_exists boolean;
begin
  -- 1. Authorization check
  perform public.check_support_admin_access();

  -- 2. Validate assignee if provided
  if p_assigned_to is not null then
    select exists (
      select 1 from auth.users where id = p_assigned_to
    ) into v_user_exists;

    if not v_user_exists then
      raise exception 'Assigned user with ID % does not exist.', p_assigned_to
        using errcode = '23503';
    end if;
  end if;

  -- 3. Update record
  update public.contact_requests
  set assigned_to = p_assigned_to,
      updated_at = now()
  where id = p_id
  returning to_jsonb(contact_requests.*) into v_updated;

  if not found then
    raise exception 'Contact request with ID % not found.', p_id
      using errcode = 'P0002';
  end if;

  return v_updated;
end;
$$;

-- -----------------------------------------------------------------------------
-- 12. RPC: add_support_request_note
-- -----------------------------------------------------------------------------
create or replace function public.add_support_request_note(
  p_id uuid,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_note text := trim(p_note);
  v_note_id uuid;
  v_author_id uuid;
  v_result jsonb;
begin
  -- 1. Authorization check
  perform public.check_support_admin_access();

  -- 2. Validate note
  if v_note is null or char_length(v_note) = 0 then
    raise exception 'Internal note cannot be empty.'
      using errcode = '22023';
  end if;
  if char_length(v_note) > 5000 then
    raise exception 'Internal note cannot exceed 5000 characters.'
      using errcode = '22023';
  end if;

  -- Verify request exists
  if not exists (select 1 from public.contact_requests where id = p_id) then
    raise exception 'Contact request with ID % not found.', p_id
      using errcode = 'P0002';
  end if;

  v_author_id := auth.uid();

  -- 3. Insert note
  insert into public.contact_request_notes (
    contact_request_id,
    author_user_id,
    note
  ) values (
    p_id,
    v_author_id,
    v_note
  )
  returning id into v_note_id;

  -- 4. Return note with author name
  select jsonb_build_object(
    'id', n.id,
    'contact_request_id', n.contact_request_id,
    'author_user_id', n.author_user_id,
    'note', n.note,
    'created_at', n.created_at,
    'updated_at', n.updated_at,
    'author_name', coalesce(nullif(trim(concat(p.first_name, ' ', p.last_name)), ''), 'Support Admin')
  ) into v_result
  from public.contact_request_notes n
  left join public.profiles p on p.user_id = n.author_user_id
  where n.id = v_note_id;

  return v_result;
end;
$$;
