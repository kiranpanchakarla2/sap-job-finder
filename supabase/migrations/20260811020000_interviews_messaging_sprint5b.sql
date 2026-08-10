-- Sprint 5B: Interviews + messaging (Supabase)
-- Relates to job_applications → jobs → company_profiles ownership chain.
-- FK target is job_applications (canonical table; applications is a view).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.owns_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.job_applications ja
    where ja.id = p_application_id
      and public.owns_job(ja.job_id)
  );
$$;

revoke all on function public.owns_application(uuid) from public;
grant execute on function public.owns_application(uuid) to authenticated;

create or replace function public.is_application_candidate(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.job_applications ja
    where ja.id = p_application_id
      and ja.candidate_id = public.current_candidate_id()
  );
$$;

revoke all on function public.is_application_candidate(uuid) from public;
grant execute on function public.is_application_candidate(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'UTC',
  type text not null,
  meeting_link text,
  phone_number text,
  location text,
  notes text,
  interviewers jsonb not null default '[]'::jsonb,
  status text not null default 'scheduled',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz,
  no_show_at timestamptz,
  constraint interviews_type_check
    check (type in ('video', 'phone', 'in_person')),
  constraint interviews_status_check
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  constraint interviews_end_after_start_check
    check (end_time > start_time),
  constraint interviews_video_requires_link_check
    check (type <> 'video' or nullif(btrim(meeting_link), '') is not null),
  constraint interviews_phone_requires_number_check
    check (type <> 'phone' or nullif(btrim(phone_number), '') is not null),
  constraint interviews_in_person_requires_location_check
    check (type <> 'in_person' or nullif(btrim(location), '') is not null),
  constraint interviews_interviewers_is_array_check
    check (jsonb_typeof(interviewers) = 'array')
);

create index if not exists interviews_application_id_idx
  on public.interviews (application_id);

create index if not exists interviews_status_date_idx
  on public.interviews (status, scheduled_date, start_time);

create index if not exists interviews_created_by_idx
  on public.interviews (created_by);

drop trigger if exists interviews_set_updated_at on public.interviews;
create trigger interviews_set_updated_at
  before update on public.interviews
  for each row
  execute function public.set_updated_at();

-- Protect immutable ownership fields
create or replace function public.protect_interview_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.application_id is distinct from old.application_id then
      raise exception 'application_id cannot be changed';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception 'created_by cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists interviews_protect_identity on public.interviews;
create trigger interviews_protect_identity
  before update on public.interviews
  for each row
  execute function public.protect_interview_identity();

-- Status timestamps
create or replace function public.set_interview_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'cancelled' and new.cancelled_at is null then
      new.cancelled_at := now();
    elsif new.status = 'completed' and new.completed_at is null then
      new.completed_at := now();
    elsif new.status = 'no_show' and new.no_show_at is null then
      new.no_show_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists interviews_status_timestamps on public.interviews;
create trigger interviews_status_timestamps
  before update on public.interviews
  for each row
  execute function public.set_interview_status_timestamps();

alter table public.interviews enable row level security;

drop policy if exists "Employers can select own interviews" on public.interviews;
create policy "Employers can select own interviews"
  on public.interviews for select
  to authenticated
  using (public.owns_application(application_id));

drop policy if exists "Candidates can select own interviews" on public.interviews;
create policy "Candidates can select own interviews"
  on public.interviews for select
  to authenticated
  using (public.is_application_candidate(application_id));

drop policy if exists "Employers can insert own interviews" on public.interviews;
create policy "Employers can insert own interviews"
  on public.interviews for insert
  to authenticated
  with check (
    public.owns_application(application_id)
    and created_by = (select auth.uid())
  );

drop policy if exists "Employers can update own interviews" on public.interviews;
create policy "Employers can update own interviews"
  on public.interviews for update
  to authenticated
  using (public.owns_application(application_id))
  with check (public.owns_application(application_id));

-- ---------------------------------------------------------------------------
-- interview_feedback
-- ---------------------------------------------------------------------------
create table if not exists public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references public.interviews(id) on delete cascade,
  overall_rating integer,
  technical_skills integer,
  communication integer,
  sap_knowledge integer,
  problem_solving integer,
  strengths text,
  concerns text,
  recommendation text,
  submitted_by uuid not null references auth.users(id),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_feedback_overall_rating_check
    check (overall_rating is null or overall_rating between 1 and 5),
  constraint interview_feedback_technical_skills_check
    check (technical_skills is null or technical_skills between 1 and 5),
  constraint interview_feedback_communication_check
    check (communication is null or communication between 1 and 5),
  constraint interview_feedback_sap_knowledge_check
    check (sap_knowledge is null or sap_knowledge between 1 and 5),
  constraint interview_feedback_problem_solving_check
    check (problem_solving is null or problem_solving between 1 and 5),
  constraint interview_feedback_recommendation_check
    check (
      recommendation is null
      or recommendation in ('strong_hire', 'hire', 'maybe', 'no_hire')
    )
);

create index if not exists interview_feedback_interview_id_idx
  on public.interview_feedback (interview_id);

drop trigger if exists interview_feedback_set_updated_at on public.interview_feedback;
create trigger interview_feedback_set_updated_at
  before update on public.interview_feedback
  for each row
  execute function public.set_updated_at();

create or replace function public.protect_interview_feedback_identity()
returns trigger
language plpgsql
as $$
begin
  if new.interview_id is distinct from old.interview_id then
    raise exception 'interview_id cannot be changed';
  end if;
  if new.submitted_by is distinct from old.submitted_by then
    raise exception 'submitted_by cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists interview_feedback_protect_identity on public.interview_feedback;
create trigger interview_feedback_protect_identity
  before update on public.interview_feedback
  for each row
  execute function public.protect_interview_feedback_identity();

alter table public.interview_feedback enable row level security;

drop policy if exists "Employers can select own interview feedback" on public.interview_feedback;
create policy "Employers can select own interview feedback"
  on public.interview_feedback for select
  to authenticated
  using (
    exists (
      select 1
      from public.interviews i
      where i.id = interview_feedback.interview_id
        and public.owns_application(i.application_id)
    )
  );

drop policy if exists "Employers can insert own interview feedback" on public.interview_feedback;
create policy "Employers can insert own interview feedback"
  on public.interview_feedback for insert
  to authenticated
  with check (
    submitted_by = (select auth.uid())
    and exists (
      select 1
      from public.interviews i
      where i.id = interview_id
        and public.owns_application(i.application_id)
    )
  );

drop policy if exists "Employers can update own interview feedback" on public.interview_feedback;
create policy "Employers can update own interview feedback"
  on public.interview_feedback for update
  to authenticated
  using (
    exists (
      select 1
      from public.interviews i
      where i.id = interview_feedback.interview_id
        and public.owns_application(i.application_id)
    )
  )
  with check (
    submitted_by = (select auth.uid())
    and exists (
      select 1
      from public.interviews i
      where i.id = interview_id
        and public.owns_application(i.application_id)
    )
  );

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.job_applications(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row
  execute function public.set_updated_at();

create or replace function public.protect_conversation_identity()
returns trigger
language plpgsql
as $$
begin
  if new.application_id is distinct from old.application_id then
    raise exception 'application_id cannot be changed';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_protect_identity on public.conversations;
create trigger conversations_protect_identity
  before update on public.conversations
  for each row
  execute function public.protect_conversation_identity();

alter table public.conversations enable row level security;

drop policy if exists "Employers can select own conversations" on public.conversations;
create policy "Employers can select own conversations"
  on public.conversations for select
  to authenticated
  using (public.owns_application(application_id));

drop policy if exists "Candidates can select own conversations" on public.conversations;
create policy "Candidates can select own conversations"
  on public.conversations for select
  to authenticated
  using (public.is_application_candidate(application_id));

drop policy if exists "Employers can insert own conversations" on public.conversations;
create policy "Employers can insert own conversations"
  on public.conversations for insert
  to authenticated
  with check (
    public.owns_application(application_id)
    and created_by = (select auth.uid())
  );

drop policy if exists "Candidates can insert own conversations" on public.conversations;
create policy "Candidates can insert own conversations"
  on public.conversations for insert
  to authenticated
  with check (
    public.is_application_candidate(application_id)
    and created_by = (select auth.uid())
  );

drop policy if exists "Employers can update own conversations" on public.conversations;
create policy "Employers can update own conversations"
  on public.conversations for update
  to authenticated
  using (public.owns_application(application_id))
  with check (public.owns_application(application_id));

drop policy if exists "Candidates can update own conversations" on public.conversations;
create policy "Candidates can update own conversations"
  on public.conversations for update
  to authenticated
  using (public.is_application_candidate(application_id))
  with check (public.is_application_candidate(application_id));

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_content_not_blank_check
    check (char_length(btrim(content)) > 0),
  constraint messages_content_max_length_check
    check (char_length(content) <= 5000)
);

create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists messages_unread_idx
  on public.messages (conversation_id, sender_id)
  where read_at is null;

create or replace function public.protect_message_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.conversation_id is distinct from old.conversation_id then
      raise exception 'conversation_id cannot be changed';
    end if;
    if new.sender_id is distinct from old.sender_id then
      raise exception 'sender_id cannot be changed';
    end if;
    if new.content is distinct from old.content then
      raise exception 'message content cannot be changed';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'created_at cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_protect_identity on public.messages;
create trigger messages_protect_identity
  before update on public.messages
  for each row
  execute function public.protect_message_identity();

-- Trim content on insert
create or replace function public.trim_message_content()
returns trigger
language plpgsql
as $$
begin
  new.content := btrim(new.content);
  return new;
end;
$$;

drop trigger if exists messages_trim_content on public.messages;
create trigger messages_trim_content
  before insert on public.messages
  for each row
  execute function public.trim_message_content();

-- Bump conversation.updated_at when a message is inserted
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row
  execute function public.touch_conversation_on_message();

alter table public.messages enable row level security;

drop policy if exists "Participants can select conversation messages" on public.messages;
create policy "Participants can select conversation messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          public.owns_application(c.application_id)
          or public.is_application_candidate(c.application_id)
        )
    )
  );

drop policy if exists "Participants can insert conversation messages" on public.messages;
create policy "Participants can insert conversation messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (
          public.owns_application(c.application_id)
          or public.is_application_candidate(c.application_id)
        )
    )
  );

-- Only allow updating read_at on messages from the other party
drop policy if exists "Participants can mark messages read" on public.messages;
create policy "Participants can mark messages read"
  on public.messages for update
  to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          public.owns_application(c.application_id)
          or public.is_application_candidate(c.application_id)
        )
    )
  )
  with check (
    sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (
          public.owns_application(c.application_id)
          or public.is_application_candidate(c.application_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: schedule interview + set application status to interview (if shortlisted)
-- ---------------------------------------------------------------------------
create or replace function public.schedule_interview(
  p_application_id uuid,
  p_scheduled_date date,
  p_start_time time,
  p_end_time time,
  p_timezone text,
  p_type text,
  p_meeting_link text default null,
  p_phone_number text default null,
  p_location text default null,
  p_notes text default null,
  p_interviewers jsonb default '[]'::jsonb
)
returns public.interviews
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_interview public.interviews;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.owns_application(p_application_id) then
    raise exception 'Not authorized';
  end if;

  select ja.status into v_status
  from public.job_applications ja
  where ja.id = p_application_id;

  if v_status is null then
    raise exception 'Application not found';
  end if;

  if v_status in ('hired', 'rejected') then
    raise exception 'Cannot schedule interview for this application status';
  end if;

  insert into public.interviews (
    application_id,
    scheduled_date,
    start_time,
    end_time,
    timezone,
    type,
    meeting_link,
    phone_number,
    location,
    notes,
    interviewers,
    status,
    created_by
  )
  values (
    p_application_id,
    p_scheduled_date,
    p_start_time,
    p_end_time,
    coalesce(nullif(btrim(p_timezone), ''), 'UTC'),
    p_type,
    nullif(btrim(p_meeting_link), ''),
    nullif(btrim(p_phone_number), ''),
    nullif(btrim(p_location), ''),
    nullif(btrim(p_notes), ''),
    coalesce(p_interviewers, '[]'::jsonb),
    'scheduled',
    v_uid
  )
  returning * into v_interview;

  if v_status = 'shortlisted' then
    update public.job_applications
    set status = 'interview',
        updated_at = now()
    where id = p_application_id
      and status = 'shortlisted';
  end if;

  return v_interview;
end;
$$;

revoke all on function public.schedule_interview(
  uuid, date, time, time, text, text, text, text, text, text, jsonb
) from public;
grant execute on function public.schedule_interview(
  uuid, date, time, time, text, text, text, text, text, text, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: get or create conversation for an application (race-safe)
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_conversation(p_application_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_conversation public.conversations;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not (
    public.owns_application(p_application_id)
    or public.is_application_candidate(p_application_id)
  ) then
    raise exception 'Not authorized';
  end if;

  select * into v_conversation
  from public.conversations
  where application_id = p_application_id;

  if found then
    return v_conversation;
  end if;

  begin
    insert into public.conversations (application_id, created_by)
    values (p_application_id, v_uid)
    returning * into v_conversation;
  exception
    when unique_violation then
      select * into v_conversation
      from public.conversations
      where application_id = p_application_id;
  end;

  return v_conversation;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid) from public;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;

-- Grants for Data API
grant select, insert, update on public.interviews to authenticated;
grant select, insert, update on public.interview_feedback to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert, update on public.messages to authenticated;

-- Realtime (optional; RLS still applies)
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;
