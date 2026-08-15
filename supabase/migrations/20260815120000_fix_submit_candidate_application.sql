-- Sprint 4 Phase B: Fix submit_candidate_application function
-- Aligns function to use Sprint 4B status values (new, reviewing, shortlisted, etc.)
-- Replaces the candidate_application_supabase_integration migration's conflicting status values

-- Drop any stale overloads created by earlier failed implementations before recreating the
-- exact signature used by the app: public.submit_candidate_application(p_job_id, p_resume_id, p_cover_letter, p_answers)
drop function if exists public.submit_candidate_application(jsonb, text, uuid, uuid);
drop function if exists public.submit_candidate_application(uuid, uuid, text, jsonb);

-- ====================================================================
-- 1) Recreate submit_candidate_application with correct status values
-- ====================================================================
create or replace function public.submit_candidate_application(
  p_job_id uuid,
  p_resume_id uuid,
  p_cover_letter text,
  p_answers jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid := public.current_candidate_id();
  v_application_id uuid;
  v_answer jsonb;
  v_question_id uuid;
begin
  if auth.uid() is null or v_candidate_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.jobs
    where id = p_job_id
      and status = 'active'
      and (application_deadline is null or application_deadline >= (timezone('utc', now()))::date)
  ) then
    raise exception 'This job is no longer accepting applications';
  end if;

  if p_resume_id is not null and not exists (
    select 1 from public.candidate_resumes
    where id = p_resume_id and candidate_id = v_candidate_id
  ) then
    raise exception 'Resume not found';
  end if;

  if exists (
    select 1 from public.job_applications
    where candidate_id = v_candidate_id
      and job_id = p_job_id
      and status != 'rejected'
      and withdrawn_at is null
  ) then
    raise exception 'You have already applied to this job';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Invalid application answers';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_answers) value
    where not (value ? 'question_id')
      or not exists (
        select 1 from public.job_application_questions q
        where q.id = (value->>'question_id')::uuid and q.job_id = p_job_id
      )
  ) then
    raise exception 'Invalid application question';
  end if;

  if exists (
    select 1 from public.job_application_questions q
    where q.job_id = p_job_id and q.required
      and not exists (
        select 1 from jsonb_array_elements(p_answers) value
        where (value->>'question_id')::uuid = q.id
          and coalesce(nullif(trim(value->>'answer'), ''), '') <> ''
      )
  ) then
    raise exception 'Required application questions are unanswered';
  end if;

  -- Insert application with 'new' status (Sprint 4B terminology)
  insert into public.job_applications(job_id, candidate_id, resume_id, cover_letter, status)
  values (p_job_id, v_candidate_id, p_resume_id, nullif(trim(p_cover_letter), ''), 'new')
  returning id into v_application_id;

  -- Insert application answers
  for v_answer in select value from jsonb_array_elements(p_answers) loop
    v_question_id := (v_answer->>'question_id')::uuid;
    insert into public.application_answers(application_id, question_id, answer)
    values (v_application_id, v_question_id, v_answer->>'answer');
  end loop;

  return v_application_id;
end;
$$;

-- ====================================================================
-- 2) Permissions (must remain after SECURITY DEFINER function)
-- ====================================================================
revoke all on function public.submit_candidate_application(uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.submit_candidate_application(uuid, uuid, text, jsonb) to authenticated;

-- ====================================================================
-- 3) Verify critical functions exist (idempotent helper functions)
-- ====================================================================

-- Ensure current_candidate_id exists (created in 20260809193000)
create or replace function public.current_candidate_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select id from public.candidate_profiles where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_candidate_id() to anon, authenticated, service_role;

-- Ensure owns_job exists (created in 20260809193000)
create or replace function public.owns_job(p_job_id uuid)
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
    join public.company_profiles c on j.company_id = c.id
    where j.id = p_job_id
      and c.user_id = auth.uid()
  );
$$;

grant execute on function public.owns_job(uuid) to anon, authenticated, service_role;

-- ====================================================================
-- 4) Ensure application status history is recorded on insert via trigger
-- ====================================================================

-- Already created in 20260812183856, but verify it exists and is correct
create or replace function public.record_job_application_status_history()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_status_history(application_id, status)
    values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists job_applications_record_status_history on public.job_applications;
create trigger job_applications_record_status_history
  after insert or update of status on public.job_applications
  for each row execute function public.record_job_application_status_history();

-- ====================================================================
-- 5) RLS policies for application tables (idempotent)
-- ====================================================================

alter table public.job_application_questions enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_status_history enable row level security;

-- Candidates can view job application questions for active jobs
drop policy if exists "Candidates can view application questions" on public.job_application_questions;
create policy "Candidates can view application questions"
  on public.job_application_questions for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_id and j.status = 'active'
  ));

-- Employers manage application questions for own jobs
drop policy if exists "Employers manage own application questions" on public.job_application_questions;
create policy "Employers manage own application questions"
  on public.job_application_questions for all to authenticated
  using (public.owns_job(job_id)) with check (public.owns_job(job_id));

-- Candidates view own application answers
drop policy if exists "Candidates view own application answers" on public.application_answers;
create policy "Candidates view own application answers"
  on public.application_answers for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and a.candidate_id = (select public.current_candidate_id())
  ));

-- Employers view answers for own job applications
drop policy if exists "Employers view answers for own job applications" on public.application_answers;
create policy "Employers view answers for own job applications"
  on public.application_answers for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and public.owns_job(a.job_id)
  ));

-- Candidates view own application history
drop policy if exists "Candidates view own application history" on public.application_status_history;
create policy "Candidates view own application history"
  on public.application_status_history for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and a.candidate_id = (select public.current_candidate_id())
  ));

-- Employers view own application history
drop policy if exists "Employers view own application history" on public.application_status_history;
create policy "Employers view own application history"
  on public.application_status_history for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and public.owns_job(a.job_id)
  ));

-- Permit candidates to view applied jobs (historical access)
drop policy if exists "Candidates can view applied jobs" on public.jobs;
create policy "Candidates can view applied jobs"
  on public.jobs for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.job_id = jobs.id and a.candidate_id = (select public.current_candidate_id())
  ));
