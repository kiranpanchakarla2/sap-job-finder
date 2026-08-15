-- Migration: 20260815150000_candidate_messages_sprint6b.sql
-- Sprint 6B: Candidate Messages Supabase Integration
-- Reuses conversations + messages tables from Sprint 5B.
-- Ensures RLS, Realtime publication, and helper functions for Candidate + Employer cross-portal messaging.

-- 1. Helper function checks and grants
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
grant execute on function public.is_application_candidate(uuid) to anon, authenticated, service_role;

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
grant execute on function public.get_or_create_conversation(uuid) to anon, authenticated, service_role;

-- 2. Ensure company_profiles select policy allows reading company metadata for jobs and conversations
drop policy if exists "Anyone can view company profiles for active jobs" on public.company_profiles;
create policy "Anyone can view company profiles for active jobs"
  on public.company_profiles for select
  to anon, authenticated
  using (true);

-- 3. Grants for conversations and messages
grant select, insert, update on public.conversations to authenticated;
grant select, insert, update on public.messages to authenticated;

-- 4. Enable Realtime on conversations and messages
do $$
begin
  begin
    alter publication supabase_realtime add table public.conversations;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;

-- 5. Helpful indexes for fast querying and unread counting
create index if not exists conversations_application_id_idx
  on public.conversations (application_id);

create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists messages_unread_idx
  on public.messages (conversation_id, sender_id)
  where read_at is null;
