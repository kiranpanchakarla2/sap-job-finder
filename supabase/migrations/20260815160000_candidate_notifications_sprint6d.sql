-- Migration: 20260815160000_candidate_notifications_sprint6d.sql
-- Sprint 6D: Candidate Notifications Supabase Integration
-- Reuses public.notifications table.
-- Adds read_at, description, priority, related entity columns, RLS, indexes, and triggers.

-- 1. Evolve public.notifications table schema
alter table public.notifications
  add column if not exists description text,
  add column if not exists read_at timestamptz,
  add column if not exists priority text not null default 'normal',
  add column if not exists related_entity_type text,
  add column if not exists related_entity_id text,
  add column if not exists action_url text,
  add column if not exists action_label text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Backfill description from message if present
update public.notifications
set description = message
where (description is null or description = '') and message is not null;

-- Ensure description is not null with default
alter table public.notifications
  alter column description set default '',
  alter column description set not null;

-- Allow message to be nullable or maintain backwards compatibility
alter table public.notifications
  alter column message drop not null;

-- Backfill read_at from is_read if any records exist
update public.notifications
set read_at = now()
where is_read = true and read_at is null;

-- Add constraints
alter table public.notifications
  drop constraint if exists notifications_priority_check;

alter table public.notifications
  add constraint notifications_priority_check
  check (priority in ('normal', 'important'));

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'application', 'message', 'job_alert', 'interview',
    'saved_job', 'subscription', 'security', 'system', 'general'
  ));

alter table public.notifications
  drop constraint if exists notifications_related_entity_type_check;

alter table public.notifications
  add constraint notifications_related_entity_type_check
  check (
    related_entity_type is null
    or related_entity_type in (
      'application', 'message', 'job', 'job_alert',
      'interview', 'saved_job', 'subscription', 'security', 'system', 'settings'
    )
  );

-- 2. Performance Indexes
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at)
  where read_at is null;

create index if not exists notifications_related_idx
  on public.notifications (related_entity_type, related_entity_id);

-- 3. Protect immutable notification columns on update
create or replace function public.protect_notification_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'id cannot be changed';
    end if;
    if new.user_id is distinct from old.user_id then
      raise exception 'user_id cannot be changed';
    end if;
    if new.type is distinct from old.type then
      raise exception 'type cannot be changed';
    end if;
    if new.title is distinct from old.title then
      raise exception 'title cannot be changed';
    end if;
    if new.description is distinct from old.description then
      raise exception 'description cannot be changed';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'created_at cannot be changed';
    end if;
    if new.related_entity_type is distinct from old.related_entity_type then
      raise exception 'related_entity_type cannot be changed';
    end if;
    if new.related_entity_id is distinct from old.related_entity_id then
      raise exception 'related_entity_id cannot be changed';
    end if;
    if new.priority is distinct from old.priority then
      raise exception 'priority cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_protect_columns on public.notifications;
create trigger notifications_protect_columns
  before update on public.notifications
  for each row execute function public.protect_notification_columns();

-- 4. Row Level Security (RLS) Policies
alter table public.notifications enable row level security;
alter table public.notifications force row level security;

drop policy if exists "Users manage own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Users can select own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

-- Candidates & Employers can SELECT their own notifications
create policy "Users can select own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Candidates & Employers can UPDATE their own notifications (e.g. read_at)
create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Direct INSERT and DELETE by browser clients are intentionally blocked (no policy granted)
grant select, update on table public.notifications to authenticated;

-- 5. Realtime Publication
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;

-- 6. Trigger: Create Notification on New Message
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_conv public.conversations;
  v_app public.job_applications;
  v_job public.jobs;
  v_company public.company_profiles;
  v_cand_profile public.candidate_profiles;
  v_recipient_user_id uuid;
  v_is_sender_candidate boolean;
  v_company_name text;
begin
  -- Fetch conversation
  select * into v_conv
  from public.conversations
  where id = new.conversation_id;

  if not found or v_conv.application_id is null then
    return new;
  end if;

  -- Fetch application
  select * into v_app
  from public.job_applications
  where id = v_conv.application_id;

  if not found then
    return new;
  end if;

  -- Fetch candidate profile
  select * into v_cand_profile
  from public.candidate_profiles
  where id = v_app.candidate_id;

  -- Fetch job & company
  select * into v_job
  from public.jobs
  where id = v_app.job_id;

  if found and v_job.company_id is not null then
    select * into v_company
    from public.company_profiles
    where id = v_job.company_id;
  end if;

  v_company_name := coalesce(v_company.company_name, 'the Employer');

  -- Determine if sender is the candidate
  v_is_sender_candidate := (v_cand_profile.user_id = new.sender_id);

  if v_is_sender_candidate then
    -- Candidate sent message -> Recipient is employer
    if v_company.user_id is not null and v_company.user_id <> new.sender_id then
      v_recipient_user_id := v_company.user_id;
    else
      -- Fallback to conversation creator if different
      if v_conv.created_by is not null and v_conv.created_by <> new.sender_id then
        v_recipient_user_id := v_conv.created_by;
      end if;
    end if;
  else
    -- Employer sent message -> Recipient is candidate
    v_recipient_user_id := v_cand_profile.user_id;
  end if;

  -- Create notification for recipient only (never notify sender)
  if v_recipient_user_id is not null and v_recipient_user_id <> new.sender_id then
    insert into public.notifications (
      user_id,
      type,
      title,
      description,
      priority,
      related_entity_type,
      related_entity_id,
      action_url,
      action_label,
      metadata
    ) values (
      v_recipient_user_id,
      'message',
      'New Message',
      case
        when v_is_sender_candidate then
          coalesce('New message received from candidate for ' || v_job.title, 'You received a new message.')
        else
          coalesce('You received a new message from ' || v_company_name, 'You received a new message regarding your application.')
      end,
      'normal',
      'message',
      new.conversation_id::text,
      case
        when v_is_sender_candidate then
          '/employer/messages'
        else
          '/candidate/messages?conversationId=' || new.conversation_id::text
      end,
      'View Message',
      jsonb_build_object(
        'conversation_id', new.conversation_id,
        'message_id', new.id,
        'application_id', v_app.id
      )
    );
  end if;

  return new;
exception
  when others then
    -- Never fail message insertion due to notification error
    return new;
end;
$$;

drop trigger if exists messages_notify_on_new on public.messages;
create trigger messages_notify_on_new
  after insert on public.messages
  for each row execute function public.notify_on_new_message();

-- 7. Trigger: Create Notification on Job Application Events (Submission & Status Update)
create or replace function public.notify_on_job_application_event()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_cand_user_id uuid;
  v_job_title text;
  v_company_name text;
  v_formatted_status text;
  v_title text;
  v_description text;
  v_priority text := 'normal';
  v_notif_type text := 'application';
begin
  -- Resolve candidate's auth user_id
  select user_id into v_cand_user_id
  from public.candidate_profiles
  where id = new.candidate_id;

  if v_cand_user_id is null then
    return new;
  end if;

  -- Resolve job and company details
  select
    j.title,
    coalesce(c.company_name, 'the Employer')
  into
    v_job_title,
    v_company_name
  from public.jobs j
  left join public.company_profiles c on j.company_id = c.id
  where j.id = new.job_id;

  v_job_title := coalesce(v_job_title, 'the SAP role');

  if tg_op = 'INSERT' then
    -- Application Submitted Notification
    insert into public.notifications (
      user_id,
      type,
      title,
      description,
      priority,
      related_entity_type,
      related_entity_id,
      action_url,
      action_label,
      metadata
    ) values (
      v_cand_user_id,
      'application',
      'Application Submitted',
      'Your application for ' || v_job_title || ' at ' || v_company_name || ' has been successfully submitted.',
      'normal',
      'application',
      new.id::text,
      '/candidate/applications/' || new.id::text,
      'View Application',
      jsonb_build_object(
        'application_id', new.id,
        'job_id', new.job_id,
        'status', new.status
      )
    );
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    -- Skip notification if candidate withdrew their own application
    if new.status = 'withdrawn' then
      return new;
    end if;

    -- Format status string nicely
    v_formatted_status := case new.status
      when 'under_review' then 'Under Review'
      when 'reviewing' then 'Under Review'
      when 'shortlisted' then 'Shortlisted'
      when 'interview' then 'Interview'
      when 'offer' then 'Job Offer'
      when 'hired' then 'Hired'
      when 'rejected' then 'Declined'
      else initcap(replace(new.status, '_', ' '))
    end;

    -- Determine notification type, title, and priority
    if new.status = 'interview' then
      v_notif_type := 'interview';
      v_title := 'Interview Invitation';
      v_priority := 'important';
      v_description := 'Great news! You have been invited to interview for ' || v_job_title || ' at ' || v_company_name || '.';
    elsif new.status in ('offer', 'hired') then
      v_notif_type := 'application';
      v_title := case new.status when 'offer' then 'Job Offer Received' else 'Congratulations on Being Hired!' end;
      v_priority := 'important';
      v_description := 'Your application for ' || v_job_title || ' moved to ' || v_formatted_status || '.';
    else
      v_notif_type := 'application';
      v_title := 'Application Update';
      v_priority := 'normal';
      v_description := 'Your application for ' || v_job_title || ' moved to ' || v_formatted_status || '.';
    end if;

    insert into public.notifications (
      user_id,
      type,
      title,
      description,
      priority,
      related_entity_type,
      related_entity_id,
      action_url,
      action_label,
      metadata
    ) values (
      v_cand_user_id,
      v_notif_type,
      v_title,
      v_description,
      v_priority,
      'application',
      new.id::text,
      '/candidate/applications/' || new.id::text,
      'View Application',
      jsonb_build_object(
        'application_id', new.id,
        'job_id', new.job_id,
        'old_status', old.status,
        'new_status', new.status
      )
    );
  end if;

  return new;
exception
  when others then
    -- Never block application operations due to notification issue
    return new;
end;
$$;

drop trigger if exists job_applications_notify_on_event on public.job_applications;
create trigger job_applications_notify_on_event
  after insert or update of status on public.job_applications
  for each row execute function public.notify_on_job_application_event();

-- 8. Trigger: Create Notification on Scheduled Interview
create or replace function public.notify_on_interview_scheduled()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_app public.job_applications;
  v_cand_user_id uuid;
  v_job_title text;
  v_company_name text;
begin
  -- Resolve application
  select * into v_app
  from public.job_applications
  where id = new.application_id;

  if not found then
    return new;
  end if;

  -- Resolve candidate user_id
  select user_id into v_cand_user_id
  from public.candidate_profiles
  where id = v_app.candidate_id;

  if v_cand_user_id is null then
    return new;
  end if;

  -- Resolve job and company details
  select
    j.title,
    coalesce(c.company_name, 'the Employer')
  into
    v_job_title,
    v_company_name
  from public.jobs j
  left join public.company_profiles c on j.company_id = c.id
  where j.id = v_app.job_id;

  v_job_title := coalesce(v_job_title, 'the SAP role');

  insert into public.notifications (
    user_id,
    type,
    title,
    description,
    priority,
    related_entity_type,
    related_entity_id,
    action_url,
    action_label,
    metadata
  ) values (
    v_cand_user_id,
    'interview',
    'Interview Scheduled',
    'An interview has been scheduled for ' || v_job_title || ' with ' || v_company_name || ' on ' || to_char(new.scheduled_date, 'Mon DD, YYYY') || '.',
    'important',
    'interview',
    new.application_id::text,
    '/candidate/applications/' || new.application_id::text,
    'View Interview Details',
    jsonb_build_object(
      'interview_id', new.id,
      'application_id', new.application_id,
      'scheduled_date', new.scheduled_date,
      'start_time', new.start_time
    )
  );

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists interviews_notify_on_scheduled on public.interviews;
create trigger interviews_notify_on_scheduled
  after insert on public.interviews
  for each row execute function public.notify_on_interview_scheduled();
