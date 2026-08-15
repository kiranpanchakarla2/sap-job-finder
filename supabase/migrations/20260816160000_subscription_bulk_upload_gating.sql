-- =============================================================================
-- Migration: 20260816160000_subscription_bulk_upload_gating.sql
-- Gate Bulk Job Upload to Pro & Business Subscription Tiers
-- =============================================================================

-- 1. Update subscription_plans features to include 'bulk_upload' on pro & business
update public.subscription_plans
set features = array[
  'basic_analytics',
  'candidate_messaging',
  'interview_management'
]
where id = 'free';

update public.subscription_plans
set features = array[
  'basic_analytics',
  'advanced_analytics',
  'talent_search',
  'candidate_messaging',
  'interview_management',
  'bulk_upload'
]
where id = 'pro';

update public.subscription_plans
set features = array[
  'basic_analytics',
  'advanced_analytics',
  'talent_search',
  'candidate_messaging',
  'interview_management',
  'team_members',
  'priority_support',
  'bulk_upload'
]
where id = 'business';

-- Drop legacy 1-arg overload if exists to prevent PostgreSQL function overload ambiguity
drop function if exists public.bulk_import_jobs(jsonb);

-- 2. Enhanced bulk_import_jobs RPC with subscription plan feature check
create or replace function public.bulk_import_jobs(
  p_jobs jsonb,
  p_metadata jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_employer_id uuid;
  v_role public.employer_company_role;
  v_app_role public.app_role;
  v_can_bulk_upload boolean := true;
  v_total integer := 0;
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_failed jsonb := '[]'::jsonb;

  v_import_id uuid;
  v_file_name text;
  v_file_size bigint;
  v_file_type text;
  v_total_rows integer;
  v_final_status text;

  v_item jsonb;
  v_row_number integer;
  v_title text;
  v_desc text;
  v_module text;
  v_job_type text;
  v_emp_type text;
  v_work_mode text;
  v_location text;
  v_country text;
  v_skills_raw jsonb;
  v_skills_str text;
  v_min_exp integer;
  v_max_exp integer;
  v_min_salary numeric;
  v_max_salary numeric;
  v_currency text;
  v_openings integer;
  v_deadline_date date;
  v_contact_email text;
  v_exp_level text;
  v_salary_type text;
  v_salary_visible boolean;
  v_norm_title text;
  v_norm_module text;
  v_norm_loc text;
  v_batch_key text;

  v_existing_id uuid;
  v_existing_title text;
  v_new_job_id uuid;
  v_seen_keys text[] := array[]::text[];
begin
  -- 1. Authentication Check
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  -- 2. Platform App Role Check (employer or admin)
  v_app_role := public.current_app_role();
  if v_app_role is distinct from 'employer' and v_app_role is distinct from 'admin' then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  -- 3. Resolve Company & Employer Profile
  v_company_id := public.current_company_id();
  v_employer_id := public.current_employer_id();

  if v_company_id is null or v_employer_id is null then
    raise exception 'COMPANY_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  -- 4. Check Subscription Plan Feature (Pro or Business required for Bulk Upload)
  if not public.company_has_plan_feature(v_company_id, 'bulk_upload') then
    raise exception 'FORBIDDEN_PLAN_UPGRADE_REQUIRED' using errcode = '42501';
  end if;

  -- 5. Check Employer Role Authorization and Bulk Upload Permission
  select role, coalesce(can_bulk_upload, true)
  into v_role, v_can_bulk_upload
  from public.employer_accounts
  where user_id = auth.uid()
    and company_id = v_company_id
    and status = 'active'
  order by created_at asc
  limit 1;

  if v_role is null then
    -- Fallback for founding company profile owner
    if exists (
      select 1 from public.company_profiles
      where id = v_company_id and user_id = auth.uid()
    ) then
      v_role := 'owner'::public.employer_company_role;
      v_can_bulk_upload := true;
    end if;
  end if;

  if v_role is null or v_role not in (
    'owner'::public.employer_company_role,
    'admin'::public.employer_company_role,
    'recruiter'::public.employer_company_role
  ) then
    raise exception 'FORBIDDEN_BULK_UPLOAD' using errcode = '42501';
  end if;

  -- If recruiter, must have can_bulk_upload permission
  if v_role = 'recruiter'::public.employer_company_role and not v_can_bulk_upload then
    raise exception 'FORBIDDEN_BULK_UPLOAD_PERMISSION_DENIED' using errcode = '42501';
  end if;

  -- 6. Validate input array
  if p_jobs is null or jsonb_typeof(p_jobs) is distinct from 'array' then
    return jsonb_build_object(
      'importId', null,
      'totalSelected', 0,
      'created', '[]'::jsonb,
      'skipped', '[]'::jsonb,
      'failed', '[]'::jsonb,
      'status', 'completed'
    );
  end if;

  v_total := jsonb_array_length(p_jobs);

  -- Extract metadata if provided
  v_file_name := coalesce(nullif(trim(p_metadata->>'fileName'), ''), 'Bulk_Jobs_Upload.xlsx');
  begin
    v_file_size := (p_metadata->>'fileSize')::bigint;
  exception when others then
    v_file_size := null;
  end;
  v_file_type := coalesce(nullif(trim(p_metadata->>'fileType'), ''), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  begin
    v_total_rows := coalesce((p_metadata->>'totalRows')::integer, v_total);
  exception when others then
    v_total_rows := v_total;
  end;

  -- 7. Create initial bulk_imports session record
  insert into public.bulk_imports (
    company_id,
    uploaded_by,
    file_name,
    file_size,
    file_type,
    total_rows,
    selected_rows,
    created_count,
    skipped_count,
    failed_count,
    status,
    created_at,
    completed_at
  ) values (
    v_company_id,
    auth.uid(),
    v_file_name,
    v_file_size,
    v_file_type,
    v_total_rows,
    v_total,
    0,
    0,
    0,
    'processing',
    now(),
    null
  ) returning id into v_import_id;

  -- 8. Process each approved row
  for v_item in select * from jsonb_array_elements(p_jobs)
  loop
    v_row_number := coalesce((v_item->>'rowNumber')::integer, 0);
    v_title := trim(coalesce(v_item->>'title', ''));
    v_desc := trim(coalesce(v_item->>'description', ''));
    v_module := trim(coalesce(v_item->>'sapModule', ''));
    v_job_type := trim(coalesce(v_item->>'jobType', ''));
    v_emp_type := trim(coalesce(v_item->>'employmentType', ''));
    v_work_mode := trim(coalesce(v_item->>'workMode', ''));
    v_location := trim(coalesce(v_item->>'location', ''));
    v_country := trim(coalesce(v_item->>'country', ''));
    v_currency := trim(coalesce(v_item->>'currency', ''));
    v_contact_email := nullif(trim(coalesce(v_item->>'contactEmail', '')), '');

    -- Date parsing
    begin
      if v_item->>'deadline' is not null and trim(v_item->>'deadline') <> '' then
        v_deadline_date := (trim(v_item->>'deadline'))::date;
      else
        v_deadline_date := null;
      end if;
    exception when others then
      v_deadline_date := null;
    end;

    -- Numeric fields with safe casting
    begin
      v_min_exp := (v_item->>'minExperience')::integer;
    exception when others then
      v_min_exp := null;
    end;

    begin
      v_max_exp := (v_item->>'maxExperience')::integer;
    exception when others then
      v_max_exp := null;
    end;

    begin
      v_min_salary := (v_item->>'minSalary')::numeric;
    exception when others then
      v_min_salary := null;
    end;

    begin
      v_max_salary := (v_item->>'maxSalary')::numeric;
    exception when others then
      v_max_salary := null;
    end;

    begin
      v_openings := coalesce((v_item->>'openings')::integer, 1);
    exception when others then
      v_openings := 1;
    end;

    -- Format skills
    v_skills_raw := v_item->'skills';
    if v_skills_raw is not null and jsonb_typeof(v_skills_raw) = 'array' then
      select coalesce(string_agg(trim(elem::text, '"'), ', '), '')
      into v_skills_str
      from jsonb_array_elements(v_skills_raw) elem
      where trim(elem::text, '"') <> '';
    else
      v_skills_str := trim(coalesce(v_item->>'skills', ''));
    end if;

    -- Append country to location if not already contained
    if v_country <> '' and position(lower(v_country) in lower(v_location)) = 0 then
      v_location := v_location || ', ' || v_country;
    end if;

    -- Normalized keys for duplicate detection
    v_norm_title := lower(regexp_replace(v_title, '\s+', ' ', 'g'));
    v_norm_module := lower(regexp_replace(v_module, '\s+', ' ', 'g'));
    v_norm_loc := lower(regexp_replace(v_location, '\s+', ' ', 'g'));
    v_batch_key := v_norm_title || '|' || v_norm_module || '|' || v_norm_loc;

    -- =========================================================================
    -- SERVER-SIDE VALIDATION & SCHEMA CONSTRAINTS
    -- =========================================================================
    if v_title = '' then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', 'Untitled Job',
        'reason', 'Job Title is required.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, 'Untitled Job', 'failed', 'Job Title is required.', null);
      continue;
    end if;

    if length(v_title) > 200 then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Job Title cannot exceed 200 characters.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Job Title cannot exceed 200 characters.', null);
      continue;
    end if;

    if v_desc = '' then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Job Description is required.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Job Description is required.', null);
      continue;
    end if;

    if length(v_desc) > 10000 then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Job Description cannot exceed 10,000 characters.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Job Description cannot exceed 10,000 characters.', null);
      continue;
    end if;

    if v_module = '' then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'SAP Module is required.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'SAP Module is required.', null);
      continue;
    end if;

    if v_job_type = '' or v_job_type not in ('Permanent', 'Contract', 'Contract-to-Hire', 'Freelance') then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Valid Job Type is required (Permanent, Contract, Contract-to-Hire, Freelance).'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Valid Job Type is required (Permanent, Contract, Contract-to-Hire, Freelance).', null);
      continue;
    end if;

    if v_emp_type = '' or v_emp_type not in ('Full-time', 'Part-time') then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Valid Employment Type is required (Full-time, Part-time).'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Valid Employment Type is required (Full-time, Part-time).', null);
      continue;
    end if;

    if v_work_mode = '' or v_work_mode not in ('On-site', 'Hybrid', 'Remote') then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Valid Work Mode is required (On-site, Hybrid, Remote).'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Valid Work Mode is required (On-site, Hybrid, Remote).', null);
      continue;
    end if;

    if v_min_exp is null or v_min_exp < 0 or v_min_exp > 50 then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Minimum Experience must be a non-negative number up to 50.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Minimum Experience must be a non-negative number up to 50.', null);
      continue;
    end if;

    if v_max_exp is not null and (v_max_exp < v_min_exp or v_max_exp > 50) then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Maximum Experience must be greater than or equal to Minimum Experience and up to 50.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Maximum Experience must be greater than or equal to Minimum Experience and up to 50.', null);
      continue;
    end if;

    if (v_min_salary is not null and (v_min_salary < 0 or v_min_salary > 1000000000)) or
       (v_max_salary is not null and (v_max_salary < 0 or v_max_salary > 1000000000)) then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Salary values must be positive numbers.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Salary values must be positive numbers.', null);
      continue;
    end if;

    if v_min_salary is not null and v_max_salary is not null and v_max_salary < v_min_salary then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Maximum Salary must be greater than or equal to Minimum Salary.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Maximum Salary must be greater than or equal to Minimum Salary.', null);
      continue;
    end if;

    if (v_min_salary is not null or v_max_salary is not null) and v_currency = '' then
      v_currency := 'USD';
    end if;

    if v_openings < 1 or v_openings > 10000 then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Number of openings must be a whole number between 1 and 10,000.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Number of openings must be a whole number between 1 and 10,000.', null);
      continue;
    end if;

    if v_deadline_date is not null and v_deadline_date < current_date then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Application deadline cannot be in the past.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Application deadline cannot be in the past.', null);
      continue;
    end if;

    if v_contact_email is not null and length(v_contact_email) > 255 then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Contact Email exceeds maximum allowed length (255 characters).'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Contact Email exceeds maximum allowed length (255 characters).', null);
      continue;
    end if;

    -- =========================================================================
    -- DUPLICATE DETECTION (Intra-batch & Company Database)
    -- =========================================================================
    -- Intra-batch check
    if v_batch_key = any(v_seen_keys) then
      v_skipped := v_skipped || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Duplicate of another job in this upload batch.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'skipped', 'Duplicate of another job in this upload batch.', null);
      continue;
    end if;

    -- Existing database duplicate check
    v_existing_id := null;
    v_existing_title := null;

    select id, title
    into v_existing_id, v_existing_title
    from public.jobs
    where company_id = v_company_id
      and status in ('draft', 'active', 'paused')
      and lower(regexp_replace(trim(title), '\s+', ' ', 'g')) = v_norm_title
      and lower(regexp_replace(trim(sap_module), '\s+', ' ', 'g')) = v_norm_module
      and (
        lower(regexp_replace(trim(location), '\s+', ' ', 'g')) = v_norm_loc
        or lower(regexp_replace(trim(location), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(v_item->>'location', '')), '\s+', ' ', 'g'))
      )
    limit 1;

    if v_existing_id is not null then
      v_skipped := v_skipped || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', format('Possible duplicate of an existing %s job.', v_existing_title),
        'jobId', v_existing_id
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'skipped', format('Possible duplicate of an existing %s job.', v_existing_title), v_existing_id);
      continue;
    end if;

    -- Add to seen batch keys
    v_seen_keys := array_append(v_seen_keys, v_batch_key);

    -- =========================================================================
    -- DERIVED FIELDS
    -- =========================================================================
    v_exp_level := case
      when v_min_exp <= 2 then 'Entry Level'
      when v_min_exp <= 5 then 'Mid Level'
      when v_min_exp <= 9 then 'Senior'
      when v_min_exp <= 14 then 'Lead'
      else 'Architect'
    end;

    v_salary_type := case
      when v_min_salary is not null and v_max_salary is not null and v_min_salary = v_max_salary then 'Fixed'
      when v_min_salary is not null or v_max_salary is not null then 'Range'
      else 'Not specified'
    end;

    v_salary_visible := (v_min_salary is not null or v_max_salary is not null);

    -- =========================================================================
    -- DATABASE INSERTION
    -- =========================================================================
    begin
      insert into public.jobs (
        company_id,
        employer_id,
        created_by,
        title,
        employment_type,
        job_type,
        experience_level,
        location,
        work_arrangement,
        sap_module,
        sap_specialization,
        sap_version,
        project_type,
        industry,
        description,
        responsibilities,
        required_skills,
        preferred_skills,
        minimum_experience,
        maximum_experience,
        salary_type,
        salary_min,
        salary_max,
        currency,
        salary_visible,
        benefits,
        number_of_openings,
        application_deadline,
        recruiter_name,
        application_email,
        application_url,
        status,
        created_at,
        updated_at
      ) values (
        v_company_id,
        v_employer_id,
        auth.uid(),
        v_title,
        v_emp_type,
        v_job_type,
        v_exp_level,
        v_location,
        v_work_mode,
        v_module,
        null,
        null,
        null,
        null,
        v_desc,
        '',
        v_skills_str,
        null,
        v_min_exp,
        v_max_exp,
        v_salary_type,
        v_min_salary,
        v_max_salary,
        v_currency,
        v_salary_visible,
        '[]'::jsonb,
        v_openings,
        v_deadline_date,
        null,
        v_contact_email,
        null,
        'draft',
        now(),
        now()
      ) returning id into v_new_job_id;

      v_created := v_created || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'jobId', v_new_job_id
      );

      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'created', null, v_new_job_id);

    exception when others then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Unable to create job record: ' || sqlerrm
      );

      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Unable to create job record: ' || sqlerrm, null);
    end;

  end loop;

  -- Compute final status
  if jsonb_array_length(v_created) = v_total and v_total > 0 then
    v_final_status := 'completed';
  elsif jsonb_array_length(v_created) = 0 and jsonb_array_length(v_failed) > 0 then
    v_final_status := 'failed';
  else
    v_final_status := 'completed_with_warnings';
  end if;

  -- Update bulk_imports session record
  update public.bulk_imports
  set created_count = jsonb_array_length(v_created),
      skipped_count = jsonb_array_length(v_skipped),
      failed_count = jsonb_array_length(v_failed),
      status = v_final_status,
      completed_at = now()
  where id = v_import_id;

  -- Return aggregated structured result
  return jsonb_build_object(
    'importId', v_import_id,
    'totalSelected', v_total,
    'created', coalesce(v_created, '[]'::jsonb),
    'skipped', coalesce(v_skipped, '[]'::jsonb),
    'failed', coalesce(v_failed, '[]'::jsonb),
    'status', v_final_status
  );
end;
$$;

revoke all on function public.bulk_import_jobs(jsonb, jsonb) from public, anon;
grant execute on function public.bulk_import_jobs(jsonb, jsonb) to authenticated;
