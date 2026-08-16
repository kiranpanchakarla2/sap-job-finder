-- =============================================================================
-- Migration: 20260816190000_contact_notifications.sql
-- Sprint 8F: Contact Us Notifications & Communication
-- Creates contact_notification_logs table, indexes, RLS policies,
-- and notification logging / idempotency RPC functions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table Definition: contact_notification_logs
-- -----------------------------------------------------------------------------
create table if not exists public.contact_notification_logs (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests (id) on delete cascade,
  event_id uuid references public.contact_request_events (id) on delete set null,
  notification_type text not null,
  recipient text not null,
  subject text not null,
  status text not null default 'pending',
  provider text not null default 'console',
  provider_message_id text,
  error_message text,
  retry_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,

  -- Constraints
  constraint contact_notification_logs_type_check check (
    notification_type in (
      'user_confirmation',
      'support_new_request',
      'user_status_update'
    )
  ),
  constraint contact_notification_logs_status_check check (
    status in ('pending', 'sent', 'failed', 'skipped')
  ),
  constraint contact_notification_logs_recipient_check check (
    char_length(trim(recipient)) > 0 and char_length(recipient) <= 255
  ),
  constraint contact_notification_logs_subject_check check (
    char_length(trim(subject)) > 0 and char_length(subject) <= 500
  ),
  constraint contact_notification_logs_retry_count_check check (
    retry_count >= 0
  )
);

-- -----------------------------------------------------------------------------
-- 2. Indexes
-- -----------------------------------------------------------------------------
create index if not exists contact_notification_logs_request_type_idx
  on public.contact_notification_logs (contact_request_id, notification_type);

create index if not exists contact_notification_logs_status_created_idx
  on public.contact_notification_logs (status, created_at desc);

create index if not exists contact_notification_logs_event_id_idx
  on public.contact_notification_logs (event_id)
  where event_id is not null;

create index if not exists contact_notification_logs_recipient_idx
  on public.contact_notification_logs (recipient);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.contact_notification_logs enable row level security;

-- Admin and service role only policies
drop policy if exists "Admins can read contact notification logs" on public.contact_notification_logs;
create policy "Admins can read contact notification logs"
  on public.contact_notification_logs for select
  to authenticated
  using (public.current_app_role() = 'admin');

drop policy if exists "Admins can insert contact notification logs" on public.contact_notification_logs;
create policy "Admins can insert contact notification logs"
  on public.contact_notification_logs for insert
  to authenticated
  with check (public.current_app_role() = 'admin');

drop policy if exists "Admins can update contact notification logs" on public.contact_notification_logs;
create policy "Admins can update contact notification logs"
  on public.contact_notification_logs for update
  to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- Revoke all permissions from public, grant to authenticated for RLS enforcement
revoke all on public.contact_notification_logs from public;
grant select, insert, update on public.contact_notification_logs to authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: log_contact_notification (Safe server-side notification recorder)
-- -----------------------------------------------------------------------------
create or replace function public.log_contact_notification(
  p_contact_request_id uuid,
  p_notification_type text,
  p_recipient text,
  p_subject text,
  p_status text,
  p_provider text default 'console',
  p_provider_message_id text default null,
  p_error_message text default null,
  p_event_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_log_id uuid;
  v_sent_at timestamptz;
  v_result jsonb;
begin
  if p_status = 'sent' then
    v_sent_at := now();
  else
    v_sent_at := null;
  end if;

  insert into public.contact_notification_logs (
    contact_request_id,
    event_id,
    notification_type,
    recipient,
    subject,
    status,
    provider,
    provider_message_id,
    error_message,
    metadata,
    sent_at
  ) values (
    p_contact_request_id,
    p_event_id,
    p_notification_type,
    lower(trim(p_recipient)),
    trim(p_subject),
    p_status,
    coalesce(p_provider, 'console'),
    p_provider_message_id,
    p_error_message,
    coalesce(p_metadata, '{}'::jsonb),
    v_sent_at
  )
  returning id into v_log_id;

  select to_jsonb(l.*) into v_result
  from public.contact_notification_logs l
  where l.id = v_log_id;

  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. RPC: check_contact_notification_sent (Idempotency Helper)
-- -----------------------------------------------------------------------------
create or replace function public.check_contact_notification_sent(
  p_contact_request_id uuid,
  p_notification_type text,
  p_event_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.contact_notification_logs
    where contact_request_id = p_contact_request_id
      and notification_type = p_notification_type
      and status = 'sent'
      and (p_event_id is null or event_id = p_event_id)
  );
$$;
