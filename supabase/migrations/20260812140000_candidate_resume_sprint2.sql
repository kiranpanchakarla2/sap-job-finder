-- Sprint 2 Phase B: resume metadata extensions, experience/education fields,
-- career highlights, one-primary-resume enforcement, set-primary RPC.
-- Reuses candidate_resumes, candidate_experience, candidate_education,
-- and the private candidate-resumes storage bucket.

-- ---------------------------------------------------------------------------
-- 1) candidate_resumes metadata
-- ---------------------------------------------------------------------------
alter table public.candidate_resumes
  add column if not exists storage_path text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text,
  add column if not exists file_type text,
  add column if not exists original_file_name text,
  add column if not exists version_number integer;

-- Backfill storage_path from resume_url when it looks like a storage path
update public.candidate_resumes
set storage_path = resume_url
where storage_path is null
  and resume_url is not null
  and resume_url not like 'http%';

create unique index if not exists candidate_resumes_one_primary_idx
  on public.candidate_resumes (candidate_id)
  where is_primary = true;

create index if not exists candidate_resumes_candidate_id_idx
  on public.candidate_resumes (candidate_id);

create index if not exists candidate_resumes_candidate_created_idx
  on public.candidate_resumes (candidate_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) Atomic set-primary + sync profile resume columns
-- ---------------------------------------------------------------------------
create or replace function public.set_candidate_resume_primary(p_resume_id uuid)
returns public.candidate_resumes
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.candidate_resumes;
  v_candidate_id uuid := public.current_candidate_id();
begin
  if v_candidate_id is null then
    raise exception 'Candidate profile not found';
  end if;

  select * into v_row
  from public.candidate_resumes
  where id = p_resume_id
    and candidate_id = v_candidate_id;

  if not found then
    raise exception 'Resume not found';
  end if;

  update public.candidate_resumes
  set is_primary = false
  where candidate_id = v_candidate_id
    and is_primary = true
    and id is distinct from p_resume_id;

  update public.candidate_resumes
  set is_primary = true
  where id = p_resume_id
  returning * into v_row;

  update public.candidate_profiles
  set
    resume_url = coalesce(v_row.storage_path, v_row.resume_url),
    resume_file_name = coalesce(v_row.original_file_name, v_row.resume_name)
  where id = v_candidate_id;

  return v_row;
end;
$$;

revoke all on function public.set_candidate_resume_primary(uuid) from public;
grant execute on function public.set_candidate_resume_primary(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Experience field parity with Sprint 2 UI
-- ---------------------------------------------------------------------------
alter table public.candidate_experience
  add column if not exists location text,
  add column if not exists employment_type text;

create index if not exists candidate_experience_candidate_id_idx
  on public.candidate_experience (candidate_id);

-- ---------------------------------------------------------------------------
-- 4) Education field parity with Sprint 2 UI
-- ---------------------------------------------------------------------------
alter table public.candidate_education
  add column if not exists field_of_study text,
  add column if not exists location text,
  add column if not exists grade text,
  add column if not exists start_date date,
  add column if not exists end_date date;

-- Backfill dates from year columns when present
update public.candidate_education
set
  start_date = coalesce(
    start_date,
    case when start_year is not null then make_date(start_year, 1, 1) else null end
  ),
  end_date = coalesce(
    end_date,
    case when end_year is not null then make_date(end_year, 12, 31) else null end
  ),
  grade = coalesce(grade, case when percentage is not null then percentage::text else null end);

create index if not exists candidate_education_candidate_id_idx
  on public.candidate_education (candidate_id);

-- ---------------------------------------------------------------------------
-- 5) Career highlights
-- ---------------------------------------------------------------------------
create table if not exists public.candidate_career_highlights (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  content text not null,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_career_highlights_content_len check (char_length(content) <= 500)
);

create index if not exists candidate_career_highlights_candidate_id_idx
  on public.candidate_career_highlights (candidate_id);

create index if not exists candidate_career_highlights_order_idx
  on public.candidate_career_highlights (candidate_id, display_order);

drop trigger if exists candidate_career_highlights_set_updated_at
  on public.candidate_career_highlights;
create trigger candidate_career_highlights_set_updated_at
  before update on public.candidate_career_highlights
  for each row execute function public.set_updated_at();

alter table public.candidate_career_highlights enable row level security;

drop policy if exists "Candidates manage own career highlights"
  on public.candidate_career_highlights;
create policy "Candidates manage own career highlights"
  on public.candidate_career_highlights for all
  to authenticated
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

revoke all on public.candidate_career_highlights from anon;
grant select, insert, update, delete on public.candidate_career_highlights to authenticated;
