-- Applicant profile visibility via job access (membership-aware)

drop policy if exists "Employers can view candidate profiles of applicants"
  on public.candidate_profiles;
create policy "Employers can view candidate profiles of applicants"
  on public.candidate_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      where ja.candidate_id = candidate_profiles.id
        and public.can_access_job(ja.job_id)
    )
  );
