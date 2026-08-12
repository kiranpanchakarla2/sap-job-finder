-- Sprint 4 Phase B: secure candidate application persistence.
-- Reuses public.job_applications, public.candidate_resumes, and public.jobs.

alter table public.job_applications
  add column if not exists withdrawn_at timestamptz;

-- The previous Sprint 4B migration used employer UI labels (new/reviewing).
-- Normalize the stored values to the candidate application lifecycle.
alter table public.job_applications alter column status drop default;
update public.job_applications
set status = case status
  when 'new' then 'applied'
  when 'reviewing' then 'under_review'
  else status
end;
alter table public.job_applications
  drop constraint if exists job_applications_status_check;
alter table public.job_applications
  add constraint job_applications_status_check
  check (status in (
    'applied', 'under_review', 'shortlisted', 'interview',
    'offer', 'hired', 'rejected', 'withdrawn'
  ));
alter table public.job_applications
  alter column status set default 'applied';

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

create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  question_id uuid not null references public.job_application_questions(id) on delete restrict,
  answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, question_id)
);

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  status text not null check (status in (
    'applied', 'under_review', 'shortlisted', 'interview',
    'offer', 'hired', 'rejected', 'withdrawn'
  )),
  created_at timestamptz not null default now()
);

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

drop trigger if exists application_answers_set_updated_at on public.application_answers;
create trigger application_answers_set_updated_at
  before update on public.application_answers
  for each row execute function public.set_updated_at();

-- Employer status transitions are preserved as immutable timeline entries.
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

insert into public.application_status_history(application_id, status, created_at)
select id, status, applied_at
from public.job_applications a
where not exists (
  select 1 from public.application_status_history h where h.application_id = a.id
);

alter table public.job_application_questions enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_status_history enable row level security;

drop policy if exists "Candidates update own applications" on public.job_applications;

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

-- Permit historical job details for the candidate who applied, even after closure.
drop policy if exists "Candidates can view applied jobs" on public.jobs;
create policy "Candidates can view applied jobs"
  on public.jobs for select to authenticated
  using (exists (
    select 1 from public.job_applications a
    where a.job_id = jobs.id and a.candidate_id = (select public.current_candidate_id())
  ));

-- Atomic submission prevents partial rows and derives candidate identity server-side.
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

  insert into public.job_applications(job_id, candidate_id, resume_id, cover_letter, status)
  values (p_job_id, v_candidate_id, p_resume_id, nullif(trim(p_cover_letter), ''), 'applied')
  returning id into v_application_id;

  for v_answer in select value from jsonb_array_elements(p_answers) loop
    v_question_id := (v_answer->>'question_id')::uuid;
    insert into public.application_answers(application_id, question_id, answer)
    values (v_application_id, v_question_id, v_answer->>'answer');
  end loop;
  return v_application_id;
end;
$$;

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
  set status = 'withdrawn', withdrawn_at = now()
  where id = p_application_id
    and candidate_id = v_candidate_id
    and status in ('applied', 'under_review', 'shortlisted', 'interview');
  if not found then
    raise exception 'Application cannot be withdrawn';
  end if;
end;
$$;

revoke all on function public.submit_candidate_application(uuid, uuid, text, jsonb) from public, anon;
revoke all on function public.withdraw_candidate_application(uuid) from public, anon;
grant execute on function public.submit_candidate_application(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.withdraw_candidate_application(uuid) to authenticated;
grant select on public.job_application_questions, public.application_answers, public.application_status_history to authenticated;
