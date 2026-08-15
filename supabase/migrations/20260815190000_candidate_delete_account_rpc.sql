-- ============================================================================
-- Candidate Account Deletion RPC
-- Allows an authenticated candidate to permanently delete their account,
-- all related database records, and their auth user with full cascade cleanup.
-- ============================================================================

create or replace function public.delete_candidate_account()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_role public.app_role;
  v_candidate_id uuid;
  v_resume_paths text[];
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  -- 1. Check role in profiles
  select role into v_role from public.profiles where user_id = v_user_id;
  if v_role is distinct from 'candidate' then
    raise exception 'FORBIDDEN_NOT_A_CANDIDATE' using errcode = '42501';
  end if;

  -- 2. Get candidate_id
  select id into v_candidate_id from public.candidate_profiles where user_id = v_user_id;
  if v_candidate_id is null then
    raise exception 'CANDIDATE_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- 3. Collect resume storage paths for file cleanup
  select coalesce(array_agg(coalesce(storage_path, resume_url)), array[]::text[])
  into v_resume_paths
  from public.candidate_resumes
  where candidate_id = v_candidate_id;

  -- 4. Clean deletion of messaging, interviews, and candidate-linked interaction data
  delete from public.messages
  where sender_id = v_user_id
     or conversation_id in (
       select c.id from public.conversations c
       join public.job_applications ja on ja.id = c.application_id
       where ja.candidate_id = v_candidate_id
     );

  delete from public.conversations
  where created_by = v_user_id
     or application_id in (
       select ja.id from public.job_applications ja
       where ja.candidate_id = v_candidate_id
     );

  delete from public.interview_feedback
  where submitted_by = v_user_id
     or interview_id in (
       select i.id from public.interviews i
       join public.job_applications ja on ja.id = i.application_id
       where ja.candidate_id = v_candidate_id
     );

  delete from public.interviews
  where application_id in (
    select ja.id from public.job_applications ja
    where ja.candidate_id = v_candidate_id
  );

  -- 5. Delete candidate settings, subscriptions, alerts, saved jobs, notifications
  delete from public.candidate_settings where candidate_id = v_candidate_id;
  delete from public.candidate_subscriptions where candidate_id = v_candidate_id;
  delete from public.job_alerts where candidate_id = v_candidate_id;
  delete from public.saved_jobs where candidate_id = v_candidate_id;
  delete from public.notifications where user_id = v_user_id;
  delete from public.saved_candidates where candidate_id = v_candidate_id;
  delete from public.employer_shortlisted_candidates where candidate_id = v_candidate_id;
  delete from public.talent_search_usage where candidate_id = v_candidate_id;

  -- 6. Delete candidate portfolio & profile details
  delete from public.candidate_career_highlights where candidate_id = v_candidate_id;
  delete from public.candidate_certifications where candidate_id = v_candidate_id;
  delete from public.candidate_education where candidate_id = v_candidate_id;
  delete from public.candidate_experience where candidate_id = v_candidate_id;
  delete from public.candidate_skills where candidate_id = v_candidate_id;
  delete from public.candidate_resumes where candidate_id = v_candidate_id;
  delete from public.job_applications where candidate_id = v_candidate_id;
  delete from public.candidate_profiles where id = v_candidate_id;
  delete from public.profiles where user_id = v_user_id;
  delete from auth.users where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'candidate_id', v_candidate_id,
    'resume_paths', v_resume_paths
  );
end;
$$;

-- Security permissions
revoke execute on function public.delete_candidate_account() from public, anon;
grant execute on function public.delete_candidate_account() to authenticated, service_role;
