-- Talent Search B seed: enable discovery on demo candidates + add searchable pool.

-- Opt-in existing Sprint 4B demo candidates (explicitly searchable for demos)
update public.candidate_profiles
set
  is_searchable = true,
  country = coalesce(nullif(country, ''), 'India'),
  work_modes = array['remote', 'hybrid'],
  employment_types = array['full_time', 'contract'],
  discovery_status = 'open_to_opportunities',
  availability = case
    when lower(coalesce(availability, '')) like '%immediate%' then 'immediately'
    when lower(coalesce(availability, '')) like '%2 week%' then 'within_2_weeks'
    else coalesce(availability, 'within_1_month')
  end,
  sap_skills = case
    when sap_skills @> array['SAP Commerce']::text[]
      then array['SAP S/4HANA', 'SAP BTP', 'SAP CPI'] || sap_skills
    else sap_skills
  end,
  skills = case
    when skills @> array['Java']::text[]
      then array['ABAP', 'Fiori', 'OData', 'BTP'] || skills
    else skills
  end,
  updated_at = now()
where user_id in (
  'a1111111-1111-4111-8111-111111111111'::uuid,
  'a2222222-2222-4222-8222-222222222222'::uuid
);

do $$
declare
  v_users uuid[] := array[
    'a3333333-3333-4333-8333-333333333333'::uuid,
    'a4444444-4444-4444-8444-444444444444'::uuid,
    'a5555555-5555-4555-8555-555555555555'::uuid,
    'a6666666-6666-4666-8666-666666666666'::uuid,
    'a7777777-7777-4777-8777-777777777777'::uuid,
    'a8888888-8888-4888-8888-888888888888'::uuid,
    'a9999999-9999-4999-8999-999999999999'::uuid,
    'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
    'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
    'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid
  ];
  v_emails text[] := array[
    'talent.mm@example.com',
    'talent.fico@example.com',
    'talent.abap@example.com',
    'talent.sd@example.com',
    'talent.btp@example.com',
    'talent.ewm@example.com',
    'talent.basis@example.com',
    'talent.sf@example.com',
    'talent.cpi@example.com',
    'talent.private@example.com'
  ];
  v_first text[] := array['Neha','Rahul','Ananya','Sophie','Daniel','Emily','Omar','Sneha','Helena','Hidden'];
  v_last text[] := array['Patel','Verma','Reddy','Muller','Chen','Watson','Haddad','Kapoor','Costa','Profile'];
  v_titles text[] := array[
    'SAP MM Consultant',
    'SAP FICO Consultant',
    'SAP ABAP Developer',
    'SAP SD Consultant',
    'SAP BTP Developer',
    'SAP EWM Consultant',
    'SAP Basis Consultant',
    'SAP SuccessFactors Consultant',
    'SAP CPI Developer',
    'Private SAP Consultant'
  ];
  v_modules jsonb := '[
    ["SAP MM","SAP S/4HANA","SAP Ariba"],
    ["SAP FICO","SAP S/4HANA"],
    ["SAP ABAP","SAP S/4HANA","SAP BTP"],
    ["SAP SD","SAP S/4HANA"],
    ["SAP BTP","SAP Integration Suite","SAP S/4HANA"],
    ["SAP EWM","SAP WM","SAP S/4HANA"],
    ["SAP Basis","SAP S/4HANA"],
    ["SAP SuccessFactors","SAP HCM"],
    ["SAP CPI","SAP Integration Suite","SAP BTP"],
    ["SAP MM"]
  ]'::jsonb;
  v_skills jsonb := '[
    ["MM","S/4HANA","Ariba","Fiori"],
    ["FICO","S/4HANA","HANA","CDS"],
    ["ABAP","CDS","OData","Fiori","BTP"],
    ["SD","S/4HANA","Fiori"],
    ["BTP","Integration Suite","UI5","OData"],
    ["EWM","S/4HANA","MM"],
    ["Basis","HANA","S/4HANA"],
    ["SuccessFactors","HCM"],
    ["CPI","Integration Suite","BTP","OData"],
    ["MM"]
  ]'::jsonb;
  v_locations text[] := array[
    'Austin, TX','Chicago, IL','Hyderabad, India','Munich, Germany','Toronto, Canada',
    'Sydney, Australia','Dubai, UAE','Pune, India','Lisbon, Portugal','Seattle, WA'
  ];
  v_countries text[] := array[
    'United States','United States','India','Germany','Canada',
    'Australia','United Arab Emirates','India','Portugal','United States'
  ];
  v_modes jsonb := '[
    ["remote","hybrid"],
    ["hybrid","onsite"],
    ["remote"],
    ["hybrid","remote"],
    ["remote","hybrid"],
    ["hybrid","onsite"],
    ["onsite","hybrid"],
    ["remote","hybrid"],
    ["remote"],
    ["remote"]
  ]'::jsonb;
  v_emp jsonb := '[
    ["full_time","contract"],
    ["full_time"],
    ["full_time","contract","contract_to_hire"],
    ["full_time","contract"],
    ["full_time"],
    ["full_time","contract"],
    ["full_time","contract"],
    ["full_time"],
    ["full_time","contract_to_hire"],
    ["full_time"]
  ]'::jsonb;
  v_avail text[] := array[
    'within_2_weeks','within_1_month','immediately','within_2_weeks','immediately',
    'not_specified','within_1_month','within_2_weeks','within_2_weeks','not_specified'
  ];
  v_status text[] := array[
    'open_to_opportunities','available','open_to_opportunities','available','open_to_opportunities',
    'available','open_to_opportunities','available','available','not_available'
  ];
  v_years int[] := array[8,11,6,9,5,8,12,7,6,10];
  v_searchable boolean[] := array[true,true,true,true,true,true,true,true,true,false];
  i int;
  v_uid uuid;
begin
  for i in 1..array_length(v_users, 1) loop
    v_uid := v_users[i];

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      v_emails[i],
      crypt('SeedPass123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role','candidate','first_name',v_first[i],'last_name',v_last[i]),
      now(),
      now(),
      '', '', '', ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    values (
      v_uid,
      v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_emails[i]),
      'email',
      v_uid::text,
      now(),
      now(),
      now()
    )
    on conflict do nothing;

    insert into public.profiles (user_id, role, first_name, last_name, email)
    values (v_uid, 'candidate', v_first[i], v_last[i], v_emails[i])
    on conflict (user_id) do update
      set role = excluded.role,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          email = excluded.email;

    insert into public.candidate_profiles (
      user_id, first_name, last_name, headline, current_job_role, location, country,
      professional_summary, years_of_experience, total_experience, availability,
      sap_skills, skills, languages, certifications, education, work_experience,
      is_searchable, work_modes, employment_types, discovery_status, updated_at
    )
    values (
      v_uid,
      v_first[i],
      v_last[i],
      v_titles[i],
      v_titles[i],
      v_locations[i],
      v_countries[i],
      v_titles[i] || ' with hands-on SAP delivery experience across enterprise programs.',
      v_years[i],
      v_years[i],
      v_avail[i],
      ARRAY(SELECT jsonb_array_elements_text(v_modules->(i-1))),
      ARRAY(SELECT jsonb_array_elements_text(v_skills->(i-1))),
      array['English'],
      jsonb_build_array(
        jsonb_build_object(
          'name', 'SAP Certified Application Professional',
          'type', 'Application',
          'year', 2023
        )
      ),
      jsonb_build_array(
        jsonb_build_object(
          'school', 'State University',
          'degree', 'B.S.',
          'field', 'Information Systems',
          'year', 2015
        )
      ),
      jsonb_build_array(
        jsonb_build_object(
          'company', 'Enterprise SAP Partner',
          'role', v_titles[i],
          'startDate', '2020-01',
          'endDate', null,
          'description', 'Delivered SAP implementations and support for mid-market clients.',
          'skills', v_skills->(i-1)
        )
      ),
      v_searchable[i],
      ARRAY(SELECT jsonb_array_elements_text(v_modes->(i-1))),
      ARRAY(SELECT jsonb_array_elements_text(v_emp->(i-1))),
      v_status[i],
      now() - ((i || ' days')::interval)
    )
    on conflict (user_id) do update
      set headline = excluded.headline,
          current_job_role = excluded.current_job_role,
          location = excluded.location,
          country = excluded.country,
          professional_summary = excluded.professional_summary,
          years_of_experience = excluded.years_of_experience,
          total_experience = excluded.total_experience,
          availability = excluded.availability,
          sap_skills = excluded.sap_skills,
          skills = excluded.skills,
          certifications = excluded.certifications,
          education = excluded.education,
          work_experience = excluded.work_experience,
          is_searchable = excluded.is_searchable,
          work_modes = excluded.work_modes,
          employment_types = excluded.employment_types,
          discovery_status = excluded.discovery_status,
          updated_at = excluded.updated_at;
  end loop;
end $$;
