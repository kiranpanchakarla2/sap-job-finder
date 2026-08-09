-- Harden ownership helpers and fix jobs RLS for INSERT RETURNING.
-- owns_job(id) cannot see in-flight rows during RETURNING checks.

create or replace function public.current_employer_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select id from public.employer_profiles where user_id = auth.uid() limit 1;
$$;

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
    join public.employer_profiles e on e.id = j.employer_id
    where j.id = p_job_id
      and e.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_employer(p_employer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.employer_profiles e
    where e.id = p_employer_id
      and e.user_id = auth.uid()
  );
$$;

grant execute on function public.current_employer_id() to anon, authenticated, service_role;
grant execute on function public.current_candidate_id() to anon, authenticated, service_role;
grant execute on function public.owns_job(uuid) to anon, authenticated, service_role;
grant execute on function public.can_manage_employer(uuid) to anon, authenticated, service_role;

drop policy if exists "Employers can insert own jobs" on public.jobs;
create policy "Employers can insert own jobs"
  on public.jobs
  for insert
  to authenticated
  with check (public.can_manage_employer(employer_id));

drop policy if exists "Public can view published jobs" on public.jobs;
create policy "Public can view published jobs"
  on public.jobs
  for select
  using (
    status = 'published'
    or employer_id = public.current_employer_id()
  );

drop policy if exists "Employers can update own jobs" on public.jobs;
create policy "Employers can update own jobs"
  on public.jobs
  for update
  using (employer_id = public.current_employer_id())
  with check (employer_id = public.current_employer_id());

drop policy if exists "Employers can delete own jobs" on public.jobs;
create policy "Employers can delete own jobs"
  on public.jobs
  for delete
  using (employer_id = public.current_employer_id());
