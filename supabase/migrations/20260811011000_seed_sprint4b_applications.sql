-- Sprint 4B demo seed: two candidates applying to the active employer job.
-- Safe to re-run: uses fixed UUIDs and ON CONFLICT.

do $$
declare
  v_job_id uuid := '2b3b14e3-75ea-4422-831a-21beb4cae420';
  v_cand1_user uuid := 'a1111111-1111-4111-8111-111111111111';
  v_cand2_user uuid := 'a2222222-2222-4222-8222-222222222222';
  v_cand1_id uuid;
  v_cand2_id uuid;
  v_job_exists boolean;
begin
  select exists(select 1 from public.jobs where id = v_job_id and status = 'active')
    into v_job_exists;

  if not v_job_exists then
    raise notice 'Active seed job % not found; skipping Sprint 4B seed.', v_job_id;
    return;
  end if;

  -- Candidate 1 auth user
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_cand1_user,
    'authenticated',
    'authenticated',
    'candidate1.sprint4b@example.com',
    crypt('SeedPass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"candidate","first_name":"Arjun","last_name":"Mehta"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  )
  on conflict (id) do nothing;

  -- Candidate 2 auth user
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_cand2_user,
    'authenticated',
    'authenticated',
    'candidate2.sprint4b@example.com',
    crypt('SeedPass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"candidate","first_name":"Priya","last_name":"Nair"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  )
  on conflict (id) do nothing;

  -- Ensure identity rows exist for email login tooling
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  values
    (
      v_cand1_user,
      v_cand1_user,
      jsonb_build_object('sub', v_cand1_user::text, 'email', 'candidate1.sprint4b@example.com'),
      'email',
      v_cand1_user::text,
      now(),
      now(),
      now()
    ),
    (
      v_cand2_user,
      v_cand2_user,
      jsonb_build_object('sub', v_cand2_user::text, 'email', 'candidate2.sprint4b@example.com'),
      'email',
      v_cand2_user::text,
      now(),
      now(),
      now()
    )
  on conflict do nothing;

  -- Ensure profiles / candidate_profiles (trigger may have created them)
  insert into public.profiles (user_id, role, first_name, last_name, email)
  values
    (v_cand1_user, 'candidate', 'Arjun', 'Mehta', 'candidate1.sprint4b@example.com'),
    (v_cand2_user, 'candidate', 'Priya', 'Nair', 'candidate2.sprint4b@example.com')
  on conflict (user_id) do update
    set role = excluded.role,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email;

  insert into public.candidate_profiles (
    user_id, first_name, last_name, headline, current_job_role, location, phone,
    professional_summary, total_experience, years_of_experience, expected_salary, currency,
    notice_period, availability, sap_skills, skills, certifications, education,
    work_experience, languages, resume_file_name
  )
  values
    (
      v_cand1_user,
      'Arjun',
      'Mehta',
      'Senior SAP Commerce Consultant',
      'Senior SAP Commerce Consultant',
      'Hyderabad, India',
      '+91 98765 41001',
      'SAP Commerce consultant with multi-site B2B/B2C implementation experience.',
      7,
      7,
      2800000,
      'INR',
      '30 days',
      'Immediate',
      array['SAP Commerce', 'Spartacus', 'OCC APIs', 'S/4HANA Integration'],
      array['Java', 'Spring'],
      '[{"name":"SAP Commerce Cloud Developer","issuer":"SAP","year":2024}]'::jsonb,
      '[{"degree":"B.Tech Computer Science","institution":"Osmania University","year":"2016"}]'::jsonb,
      '[{"company":"Nova ERP Partners","role":"Senior SAP Commerce Consultant","start_date":"2021-01-01","end_date":null,"description":"Led storefront and OCC integrations."}]'::jsonb,
      array['English', 'Hindi', 'Telugu'],
      'Arjun_Mehta_Commerce.pdf'
    ),
    (
      v_cand2_user,
      'Priya',
      'Nair',
      'SAP Commerce Lead',
      'SAP Commerce Lead',
      'Bangalore, India',
      '+91 98765 41002',
      'Lead consultant specializing in Commerce Cloud architecture and team delivery.',
      10,
      10,
      3800000,
      'INR',
      '60 days',
      '2 weeks',
      array['SAP Commerce', 'Hybris', 'SOLR', 'ASM'],
      array['Leadership', 'Solution Design'],
      '[{"name":"SAP Commerce Cloud Business","issuer":"SAP","year":2023}]'::jsonb,
      '[{"degree":"MBA","institution":"Christ University","year":"2014"}]'::jsonb,
      '[{"company":"Summit Digital","role":"SAP Commerce Lead","start_date":"2020-01-01","end_date":null,"description":"Directed multi-country Commerce rollout."}]'::jsonb,
      array['English', 'Malayalam', 'Hindi'],
      'Priya_Nair_Commerce.pdf'
    )
  on conflict (user_id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        headline = excluded.headline,
        current_job_role = excluded.current_job_role,
        location = excluded.location,
        phone = excluded.phone,
        professional_summary = excluded.professional_summary,
        total_experience = excluded.total_experience,
        years_of_experience = excluded.years_of_experience,
        expected_salary = excluded.expected_salary,
        currency = excluded.currency,
        notice_period = excluded.notice_period,
        availability = excluded.availability,
        sap_skills = excluded.sap_skills,
        skills = excluded.skills,
        certifications = excluded.certifications,
        education = excluded.education,
        work_experience = excluded.work_experience,
        languages = excluded.languages,
        resume_file_name = excluded.resume_file_name;

  select id into v_cand1_id from public.candidate_profiles where user_id = v_cand1_user;
  select id into v_cand2_id from public.candidate_profiles where user_id = v_cand2_user;

  insert into public.job_applications (
    job_id, candidate_id, status, cover_letter, applied_at, reviewed_at, shortlisted_at
  )
  values
    (
      v_job_id,
      v_cand1_id,
      'new',
      'Interested in contributing to your Commerce program.',
      now() - interval '2 days',
      null,
      null
    ),
    (
      v_job_id,
      v_cand2_id,
      'shortlisted',
      'Excited to lead your Commerce workstream.',
      now() - interval '5 days',
      now() - interval '3 days',
      now() - interval '1 day'
    )
  on conflict (job_id, candidate_id) do update
    set status = excluded.status,
        cover_letter = excluded.cover_letter,
        reviewed_at = coalesce(public.job_applications.reviewed_at, excluded.reviewed_at),
        shortlisted_at = coalesce(public.job_applications.shortlisted_at, excluded.shortlisted_at);
end;
$$;
