-- Sprint 3B Step 14: Fix employer SELECT policy — must NOT expose other companies' active jobs.

drop policy if exists "Employers can view own company jobs" on public.jobs;

create policy "Employers can view own company jobs"
  on public.jobs for select
  to authenticated
  using (
    company_id = (select public.current_company_id())
  );
