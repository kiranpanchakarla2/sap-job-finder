-- Sprint 4 Phase B: Secure Candidate Application Supabase Integration
-- Reuses public.job_applications, public.candidate_resumes, public.candidate_profiles, and public.jobs.

-- 1) Enhance job_applications with withdrawn_at & flexible status check
alter table public.job_applications
  add column if not exists withdrawn_at timestamptz;

alter table public.job_applications alter column status drop default;

alter table public.job_applications
  drop constraint if exists job_applications_status_check;

alter table public.job_applications
  add constraint job_applications_status_check
  check (status in (
    'applied', 'under_review', 'shortlisted', 'interview',
    'offer', 'hired', 'rejected', 'withdrawn', 'new', 'reviewing'
  ));

alter table public.job_applications
  alter column status set default 'applied';

-- 2) Job Application Questions table
create table if not exists public.job_application_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  question text not null check (length(trim(question)) > 0),
  question_type text not null check (question_type in (
    'text', 'textarea', 'number', 'yes_no', 'single_select', 'multiple_select'
  )),
  required boolean not null default false,
  options jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint job_application_questions_options_array
    check (options is null or jsonb_typeof(options) = 'array')
);

-- 3) Application Answers table
create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  question_id uuid not null references public.job_application_questions(id) on delete restrict,
  answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, question_id)
);

-- 4) Application Status History table
create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);

-- 5) Indexes
create index if not exists job_application_questions_job_order_idx
  on public.job_application_questions(job_id, display_order);

create index if not exists application_answers_application_id_idx
  on public.application_answers(application_id);

create index if not exists application_status_history_application_created_idx
  on public.application_status_history(application_id, created_at);

create index if not exists job_applications_candidate_applied_idx
  on public.job_applications(candidate_id, applied_at desc);

create index if not exists job_applications_job_id_idx
  on public.job_applications(job_id);

create index if not exists job_applications_status_idx
  on public.job_applications(status);

-- 6) Triggers
drop trigger if exists application_answers_set_updated_at on public.application_answers;
create trigger application_answers_set_updated_at
  before update on public.application_answers
  for each row execute function public.set_updated_at();

create or replace function public.record_job_application_status_history()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_status_history(application_id, status, created_at)
    values (new.id, new.status, now());
  end if;
  return new;
end;
$$;

drop trigger if exists job_applications_record_status_history on public.job_applications;
create trigger job_applications_record_status_history
  after insert or update of status on public.job_applications
  for each row execute function public.record_job_application_status_history();

-- Backfill initial history for existing applications if missing
insert into public.application_status_history(application_id, status, created_at)
select id, status, applied_at
from public.job_applications a
where not exists (
  select 1 from public.application_status_history h where h.application_id = a.id
);

-- 7) Helper functions verification
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

-- 8) Drop stale signatures before creating canonical RPC
drop function if exists public.submit_candidate_application(jsonb, text, uuid, uuid);
drop function if exists public.submit_candidate_application(uuid, uuid, text, jsonb);

-- 9) Canonical submit_candidate_application RPC
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
  -- Authenticate candidate
  if auth.uid() is null or v_candidate_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Validate active job & deadline
  if not exists (
    select 1 from public.jobs
    where id = p_job_id
      and status = 'active'
      and (application_deadline is null or application_deadline >= (timezone('utc', now()))::date)
  ) then
    raise exception 'This job is no longer accepting applications';
  end if;

  -- Validate resume ownership
  if p_resume_id is not null and not exists (
    select 1 from public.candidate_resumes
    where id = p_resume_id and candidate_id = v_candidate_id
  ) then
    raise exception 'Resume not found';
  end if;

  -- Check duplicate application
  if exists (
    select 1 from public.job_applications
    where candidate_id = v_candidate_id
      and job_id = p_job_id
      and status != 'rejected'
      and withdrawn_at is null
  ) then
    raise exception 'You have already applied to this job';
  end if;

  -- Validate answers payload
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Invalid application answers';
  end if;

  -- Verify questions belong to job
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

  -- Verify required questions are answered
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

  -- Insert application
  insert into public.job_applications(job_id, candidate_id, resume_id, cover_letter, status, applied_at, updated_at)
  values (p_job_id, v_candidate_id, p_resume_id, nullif(trim(p_cover_letter), ''), 'applied', now(), now())
  returning id into v_application_id;

  -- Insert answers
  for v_answer in select value from jsonb_array_elements(p_answers) loop
    v_question_id := (v_answer->>'question_id')::uuid;
    insert into public.application_answers(application_id, question_id, answer)
    values (v_application_id, v_question_id, v_answer->>'answer');
  end loop;

  return v_application_id;
end;
$$;

-- 10) Canonical withdraw_candidate_application RPC
drop function if exists public.withdraw_candidate_application(uuid);

create or replace function public.withdraw_candidate_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid := public.current_candidate_id();
begin
  if auth.uid() is null or v_candidate_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.job_applications
  set status = 'withdrawn',
      withdrawn_at = now(),
      updated_at = now()
  where id = p_application_id
    and candidate_id = v_candidate_id
    and status in ('applied', 'new', 'under_review', 'reviewing', 'shortlisted', 'interview');

  if not found then
    raise exception 'Application cannot be withdrawn';
  end if;
end;
$$;

-- 11) Row Level Security (RLS)
alter table public.job_application_questions enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_status_history enable row level security;
alter table public.job_applications enable row level security;

-- job_application_questions RLS
drop policy if exists "Candidates can view application questions" on public.job_application_questions;
create policy "Candidates can view application questions"
  on public.job_application_questions for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_id and j.status = 'active'
  ));

drop policy if exists "Employers manage own application questions" on public.job_application_questions;
create policy "Employers manage own application questions"
  on public.job_application_questions for all to authenticated
  using (public.owns_job(job_id)) with check (public.owns_job(job_id));

-- application_answers RLS
drop policy if exists "Candidates view own application answers" on public.application_answers;
create policy "Candidates view own application answers"
  on public.application_answers for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and a.candidate_id = (select public.current_candidate_id())
  ));

drop policy if exists "Employers view answers for own job applications" on public.application_answers;
create policy "Employers view answers for own job applications"
  on public.application_answers for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and public.owns_job(a.job_id)
  ));

-- application_status_history RLS
drop policy if exists "Candidates view own application history" on public.application_status_history;
create policy "Candidates view own application history"
  on public.application_status_history for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and a.candidate_id = (select public.current_candidate_id())
  ));

drop policy if exists "Employers view own application history" on public.application_status_history;
create policy "Employers view own application history"
  on public.application_status_history for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.id = application_id and public.owns_job(a.job_id)
  ));

-- job_applications RLS
drop policy if exists "Candidates view own applications" on public.job_applications;
create policy "Candidates view own applications"
  on public.job_applications for select
  to authenticated
  using (candidate_id = (select public.current_candidate_id()));

drop policy if exists "Candidates create own applications" on public.job_applications;
create policy "Candidates create own applications"
  on public.job_applications for insert
  to authenticated
  with check (
    candidate_id = (select public.current_candidate_id())
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.status = 'active'
    )
  );

drop policy if exists "Employers view applications for own jobs" on public.job_applications;
create policy "Employers view applications for own jobs"
  on public.job_applications for select
  to authenticated
  using (public.owns_job(job_id));

drop policy if exists "Employers update applications for own jobs" on public.job_applications;
create policy "Employers update applications for own jobs"
  on public.job_applications for update
  to authenticated
  using (public.owns_job(job_id))
  with check (public.owns_job(job_id));

-- jobs RLS: Permit candidates to view jobs they applied to even after closure
drop policy if exists "Candidates can view applied jobs" on public.jobs;
create policy "Candidates can view applied jobs"
  on public.jobs for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.job_id = jobs.id and a.candidate_id = (select public.current_candidate_id())
  ));

-- 12) Permissions
revoke all on function public.submit_candidate_application(uuid, uuid, text, jsonb) from public, anon;
revoke all on function public.withdraw_candidate_application(uuid) from public, anon;
grant execute on function public.submit_candidate_application(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.withdraw_candidate_application(uuid) to authenticated;

grant select on public.job_application_questions, public.application_answers, public.application_status_history to authenticated;
grant select, insert on public.job_applications to authenticated;

-- 13) Refresh PostgREST schema cache
notify pgrst, 'reload schema';
