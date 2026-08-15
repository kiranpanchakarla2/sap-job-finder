-- ============================================================================
-- Migration: 20260816150000_employer_delete_account_rpc.sql
-- Employer Account Deletion RPC
-- Allows an authenticated employer or recruiter to permanently delete their account,
-- related company data (if owner), and auth user with full cascade cleanup.
-- ============================================================================

create or replace function public.delete_employer_account()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_profile_role public.app_role;
  v_company_id uuid;
  v_is_owner boolean := false;
  v_employer_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  -- 1. Check profile role
  select role into v_profile_role from public.profiles where user_id = v_user_id;
  if v_profile_role is not null and v_profile_role is distinct from 'employer' then
    raise exception 'FORBIDDEN_NOT_AN_EMPLOYER' using errcode = '42501';
  end if;

  -- 2. Find employer profile id if exists
  select id into v_employer_id from public.employer_profiles where user_id = v_user_id limit 1;

  -- 3. Check if user is company owner or has company_profiles
  select id into v_company_id from public.company_profiles where user_id = v_user_id limit 1;
  if v_company_id is not null then
    v_is_owner := true;
  else
    -- Check employer_accounts
    select company_id, (role = 'owner')
    into v_company_id, v_is_owner
    from public.employer_accounts
    where user_id = v_user_id
    limit 1;
  end if;

  -- 4. If company owner, delete all company-scoped records
  if v_is_owner and v_company_id is not null then
    -- Clean bulk imports and rows
    delete from public.bulk_import_rows
    where bulk_import_id in (select id from public.bulk_imports where company_id = v_company_id);

    delete from public.bulk_imports where company_id = v_company_id;

    -- Clean messaging, conversations, feedback, interviews for company's jobs
    delete from public.messages
    where conversation_id in (
      select c.id from public.conversations c
      join public.job_applications ja on ja.id = c.application_id
      join public.jobs j on j.id = ja.job_id
      where j.company_id = v_company_id
    ) or sender_id = v_user_id;

    delete from public.conversations
    where application_id in (
      select ja.id from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      where j.company_id = v_company_id
    ) or created_by = v_user_id;

    delete from public.interview_feedback
    where interview_id in (
      select i.id from public.interviews i
      join public.job_applications ja on ja.id = i.application_id
      join public.jobs j on j.id = ja.job_id
      where j.company_id = v_company_id
    ) or submitted_by = v_user_id;

    delete from public.interviews
    where application_id in (
      select ja.id from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      where j.company_id = v_company_id
    );

    -- Delete job applications for company jobs
    delete from public.job_applications
    where job_id in (select id from public.jobs where company_id = v_company_id);

    -- Delete jobs
    delete from public.jobs where company_id = v_company_id;

    -- Delete candidates saved & shortlisted
    delete from public.saved_candidates where company_id = v_company_id;
    delete from public.employer_shortlisted_candidates where company_id = v_company_id;
    delete from public.talent_search_usage where company_id = v_company_id;

    -- Delete team invitations & accounts for this company
    delete from public.employer_invitations where company_id = v_company_id;
    delete from public.employer_accounts where company_id = v_company_id;

    -- Delete company profile
    delete from public.company_profiles where id = v_company_id;
  else
    -- Non-owner team member cleanup
    delete from public.employer_accounts where user_id = v_user_id;
    delete from public.messages where sender_id = v_user_id;
    delete from public.interview_feedback where submitted_by = v_user_id;
  end if;

  -- 5. Delete user-level records
  if v_employer_id is not null then
    delete from public.recruiters where employer_id = v_employer_id;
    delete from public.employer_profiles where id = v_employer_id;
  end if;
  delete from public.recruiters where user_id = v_user_id;
  delete from public.employer_profiles where user_id = v_user_id;
  delete from public.notifications where user_id = v_user_id;
  delete from public.profiles where user_id = v_user_id;

  -- 6. Delete auth user
  delete from auth.users where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'company_id', v_company_id,
    'is_owner', v_is_owner
  );
end;
$$;

-- Permissions
revoke execute on function public.delete_employer_account() from public, anon;
grant execute on function public.delete_employer_account() to authenticated, service_role;
