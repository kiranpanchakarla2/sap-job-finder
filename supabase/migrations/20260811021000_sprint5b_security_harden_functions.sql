-- Sprint 5B follow-up: harden function grants + search_path on trigger helpers

revoke execute on function public.owns_application(uuid) from anon, public;
revoke execute on function public.is_application_candidate(uuid) from anon, public;
revoke execute on function public.schedule_interview(uuid, date, time, time, text, text, text, text, text, text, jsonb) from anon, public;
revoke execute on function public.get_or_create_conversation(uuid) from anon, public;
revoke execute on function public.touch_conversation_on_message() from anon, public, authenticated;

grant execute on function public.owns_application(uuid) to authenticated;
grant execute on function public.is_application_candidate(uuid) to authenticated;
grant execute on function public.schedule_interview(uuid, date, time, time, text, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;

create or replace function public.protect_interview_identity()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.set_interview_status_timestamps()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.protect_interview_feedback_identity()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.protect_conversation_identity()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.protect_message_identity()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.trim_message_content()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.content := btrim(new.content);
  return new;
end;
$$;
