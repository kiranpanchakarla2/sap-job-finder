-- Keep ownership checks on the row being inserted. Calling can_access_job(id)
-- from a SELECT policy cannot see an in-flight INSERT row during RETURNING.
drop policy if exists "Employers can view own company jobs" on public.jobs;
create policy "Employers can view own company jobs"
  on public.jobs for select
  to authenticated
  using (
    company_id = (select public.current_company_id())
    and (
      exists (
        select 1
        from public.employer_accounts ea
        where ea.user_id = (select auth.uid())
          and ea.company_id = jobs.company_id
          and ea.status = 'active'
          and (
            ea.role in (
              'owner'::public.employer_company_role,
              'admin'::public.employer_company_role
            )
            or (
              ea.role = 'recruiter'::public.employer_company_role
              and jobs.created_by = (select auth.uid())
            )
            or (
              ea.role = 'hiring_manager'::public.employer_company_role
              and jobs.assigned_to = ea.id
            )
            or (
              ea.role = 'recruiter'::public.employer_company_role
              and not exists (
                select 1
                from public.employer_accounts other
                where other.company_id = ea.company_id
                  and other.id is distinct from ea.id
                  and other.status = 'active'
              )
            )
          )
      )
      or exists (
        select 1
        from public.company_profiles c
        where c.id = jobs.company_id
          and c.user_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.employer_profiles e
        where e.id = jobs.employer_id
          and e.user_id = (select auth.uid())
      )
    )
  );

-- Qualify the outer jobs row explicitly. The previous policy accidentally
-- compared employer_accounts.company_id to itself.
drop policy if exists "Employers can insert own company jobs" on public.jobs;
create policy "Employers can insert own company jobs"
  on public.jobs for insert
  to authenticated
  with check (
    company_id = (select public.current_company_id())
    and created_by = (select auth.uid())
    and employer_id = (select public.current_employer_id())
    and exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('employer'::public.app_role, 'admin'::public.app_role)
    )
    and exists (
      select 1
      from public.employer_accounts ea
      where ea.user_id = (select auth.uid())
        and ea.company_id = jobs.company_id
        and ea.status = 'active'
        and ea.role in (
          'owner'::public.employer_company_role,
          'admin'::public.employer_company_role,
          'recruiter'::public.employer_company_role
        )
    )
  );
