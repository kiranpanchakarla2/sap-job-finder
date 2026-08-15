-- =============================================================================
-- Migration: 20260816130000_bulk_import_history_and_permissions.sql
-- Sprint 7E: Bulk Import History, Error Reports & Admin Controls
-- =============================================================================

-- 1. Add can_bulk_upload permission to employer_accounts
alter table public.employer_accounts
  add column if not exists can_bulk_upload boolean not null default true;

-- 2. Create bulk_imports table
create table if not exists public.bulk_imports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_size bigint default null,
  file_type text default 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  total_rows integer not null default 0,
  selected_rows integer not null default 0,
  created_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'completed_with_warnings', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz default null,
  updated_at timestamptz not null default now()
);

-- 3. Create bulk_import_rows table
create table if not exists public.bulk_import_rows (
  id uuid primary key default gen_random_uuid(),
  bulk_import_id uuid not null references public.bulk_imports (id) on delete cascade,
  row_number integer not null,
  job_title text not null,
  status text not null
    check (status in ('created', 'skipped', 'failed')),
  reason text default null,
  job_id uuid references public.jobs (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4. Create Indexes
create index if not exists bulk_imports_company_created_idx
  on public.bulk_imports (company_id, created_at desc);

create index if not exists bulk_imports_company_status_idx
  on public.bulk_imports (company_id, status);

create index if not exists bulk_imports_uploaded_by_idx
  on public.bulk_imports (uploaded_by);

create index if not exists bulk_import_rows_import_row_idx
  on public.bulk_import_rows (bulk_import_id, row_number);

create index if not exists bulk_import_rows_import_status_idx
  on public.bulk_import_rows (bulk_import_id, status);

create index if not exists bulk_import_rows_job_id_idx
  on public.bulk_import_rows (job_id);

-- 5. Trigger for updated_at on bulk_imports
drop trigger if exists bulk_imports_set_updated_at on public.bulk_imports;
create trigger bulk_imports_set_updated_at
  before update on public.bulk_imports
  for each row
  execute function public.set_updated_at();

-- 6. Enable Row Level Security
alter table public.bulk_imports enable row level security;
alter table public.bulk_import_rows enable row level security;

-- 7. RLS Policies on bulk_imports
drop policy if exists "bulk_imports_select_company_members" on public.bulk_imports;
create policy "bulk_imports_select_company_members"
  on public.bulk_imports for select
  using (
    company_id in (
      select ea.company_id
      from public.employer_accounts ea
      where ea.user_id = auth.uid()
        and ea.status = 'active'
    )
    or exists (
      select 1 from public.company_profiles cp
      where cp.id = bulk_imports.company_id
        and cp.user_id = auth.uid()
    )
  );

-- Direct client modifications blocked (managed via server RPC)
drop policy if exists "bulk_imports_insert_blocked" on public.bulk_imports;
drop policy if exists "bulk_imports_update_blocked" on public.bulk_imports;
drop policy if exists "bulk_imports_delete_blocked" on public.bulk_imports;

-- 8. RLS Policies on bulk_import_rows
drop policy if exists "bulk_import_rows_select_company_members" on public.bulk_import_rows;
create policy "bulk_import_rows_select_company_members"
  on public.bulk_import_rows for select
  using (
    bulk_import_id in (
      select bi.id
      from public.bulk_imports bi
      where bi.company_id in (
        select ea.company_id
        from public.employer_accounts ea
        where ea.user_id = auth.uid()
          and ea.status = 'active'
      )
      or exists (
        select 1 from public.company_profiles cp
        where cp.id = bi.company_id
          and cp.user_id = auth.uid()
      )
    )
  );

-- 9. Update bulk_import_jobs RPC to persist import sessions and enforce recruiter permission
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

  -- 4. Check Employer Role Authorization and Bulk Upload Permission
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

  -- 5. Validate input array
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

  -- 6. Create initial bulk_imports session record
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

  -- 7. Process each approved row
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

    -- Server-side validation
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

    if v_min_exp is null or v_min_exp < 0 then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Minimum Experience must be a non-negative number.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Minimum Experience must be a non-negative number.', null);
      continue;
    end if;

    if v_max_exp is not null and v_max_exp < v_min_exp then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Maximum Experience must be greater than or equal to Minimum Experience.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Maximum Experience must be greater than or equal to Minimum Experience.', null);
      continue;
    end if;

    if (v_min_salary is not null and v_min_salary < 0) or (v_max_salary is not null and v_max_salary < 0) then
      v_failed := v_failed || jsonb_build_object(
        'rowNumber', v_row_number,
        'jobTitle', v_title,
        'reason', 'Salary values cannot be negative.'
      );
      insert into public.bulk_import_rows (bulk_import_id, row_number, job_title, status, reason, job_id)
      values (v_import_id, v_row_number, v_title, 'failed', 'Salary values cannot be negative.', null);
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

    -- Duplicate detection (intra-batch)
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

    -- Duplicate detection (company database)
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

    -- Derived fields
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

    -- Insert into jobs table
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


-- 10. RPC for Company Admin to update Bulk Upload permission of a team member
create or replace function public.update_team_member_bulk_upload_permission(
  p_account_id uuid,
  p_can_bulk_upload boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_caller_role public.employer_company_role;
  v_target_role public.employer_company_role;
  v_target_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_company_id := public.current_company_id();
  if v_company_id is null then
    raise exception 'COMPANY_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  -- Check caller is owner or admin
  select role into v_caller_role
  from public.employer_accounts
  where user_id = auth.uid()
    and company_id = v_company_id
    and status = 'active'
  order by created_at asc
  limit 1;

  if v_caller_role is null and exists (
    select 1 from public.company_profiles
    where id = v_company_id and user_id = auth.uid()
  ) then
    v_caller_role := 'owner'::public.employer_company_role;
  end if;

  if v_caller_role is null or v_caller_role not in ('owner', 'admin') then
    raise exception 'FORBIDDEN_ADMIN_ONLY' using errcode = '42501';
  end if;

  -- Get target account info
  select role, company_id into v_target_role, v_target_company_id
  from public.employer_accounts
  where id = p_account_id;

  if v_target_company_id is distinct from v_company_id then
    raise exception 'MEMBER_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Cannot revoke permission for the owner
  if v_target_role = 'owner' and not p_can_bulk_upload then
    raise exception 'CANNOT_REVOKE_OWNER_PERMISSION' using errcode = '42501';
  end if;

  update public.employer_accounts
  set can_bulk_upload = p_can_bulk_upload,
      updated_at = now()
  where id = p_account_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.update_team_member_bulk_upload_permission(uuid, boolean) from public, anon;
grant execute on function public.update_team_member_bulk_upload_permission(uuid, boolean) to authenticated;


-- 11. Update list_company_team_members RPC to include canBulkUpload
create or replace function public.list_company_team_members()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_items jsonb;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  if not public.is_company_owner_or_admin() then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_company_id := public.current_company_id();
  if v_company_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ea.id,
      'userId', ea.user_id,
      'companyId', ea.company_id,
      'role', ea.role,
      'status', ea.status,
      'canBulkUpload', coalesce(ea.can_bulk_upload, true),
      'createdAt', ea.created_at,
      'updatedAt', ea.updated_at,
      'firstName', p.first_name,
      'lastName', p.last_name,
      'email', coalesce(p.email, ''),
      'avatarUrl', p.avatar_url
    )
    order by
      case ea.role
        when 'owner' then 0
        when 'admin' then 1
        when 'recruiter' then 2
        else 3
      end,
      ea.created_at asc
  ), '[]'::jsonb)
  into v_items
  from public.employer_accounts ea
  left join public.profiles p on p.user_id = ea.user_id
  where ea.company_id = v_company_id;

  return jsonb_build_object('items', coalesce(v_items, '[]'::jsonb));
end;
$$;

revoke all on function public.list_company_team_members() from public, anon;
grant execute on function public.list_company_team_members() to authenticated;
