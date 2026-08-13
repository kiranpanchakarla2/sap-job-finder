-- Plan-based feature gating: talent search access + active job limits.

-- ---------------------------------------------------------------------------
-- 1) Plan feature helper
-- ---------------------------------------------------------------------------
create or replace function public.company_has_plan_feature(
  p_company_id uuid,
  p_feature text
)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(p_feature = any(sp.features), false)
  from public.subscriptions s
  join public.subscription_plans sp on sp.id = s.plan_id
  where s.company_id = p_company_id
  limit 1;
$$;

revoke all on function public.company_has_plan_feature(uuid, text) from public;
grant execute on function public.company_has_plan_feature(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Active job limit enforcement
-- ---------------------------------------------------------------------------
create or replace function public.enforce_company_active_job_limit()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.status is distinct from 'active' then
    return new;
  end if;

  if TG_OP = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  select sp.max_active_jobs
  into v_limit
  from public.subscriptions s
  join public.subscription_plans sp on sp.id = s.plan_id
  where s.company_id = new.company_id
  limit 1;

  if v_limit is null then
    return new;
  end if;

  select count(*)::integer
  into v_count
  from public.jobs j
  where j.company_id = new.company_id
    and j.status = 'active';

  if v_count >= v_limit then
    raise exception 'ACTIVE_JOB_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_active_job_limit_insert on public.jobs;
create trigger enforce_active_job_limit_insert
  before insert on public.jobs
  for each row
  execute function public.enforce_company_active_job_limit();

drop trigger if exists enforce_active_job_limit_update on public.jobs;
create trigger enforce_active_job_limit_update
  before update on public.jobs
  for each row
  execute function public.enforce_company_active_job_limit();

-- ---------------------------------------------------------------------------
-- 3) Talent Search RPCs — deny Free plan at data layer
-- ---------------------------------------------------------------------------
create or replace function public.search_talent_candidates(
  p_keyword text default null,
  p_modules text[] default null,
  p_skills text[] default null,
  p_experience_bands text[] default null,
  p_experience_min integer default null,
  p_countries text[] default null,
  p_location_query text default null,
  p_work_modes text[] default null,
  p_employment_types text[] default null,
  p_availability text[] default null,
  p_candidate_status text[] default null,
  p_certifications text[] default null,
  p_languages text[] default null,
  p_sort text default 'relevance',
  p_page integer default 1,
  p_page_size integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 10), 1), 50);
  v_sort text := coalesce(nullif(p_sort, ''), 'relevance');
  v_total integer := 0;
  v_items jsonb := '[]'::jsonb;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  if v_sort not in (
    'relevance', 'most_recent', 'experience_high', 'experience_low', 'available_soon'
  ) then
    v_sort := 'relevance';
  end if;

  select count(*)::integer into v_total
  from public.candidate_profiles c
  where public.candidate_matches_talent_filters(
    c, p_keyword, p_modules, p_skills, p_experience_bands, p_experience_min,
    p_countries, p_location_query, p_work_modes, p_employment_types,
    p_availability, p_candidate_status, p_certifications, p_languages
  );

  select coalesce(jsonb_agg(public.to_talent_candidate_json(x.row_data) order by x.ord), '[]'::jsonb)
  into v_items
  from (
    select
      c as row_data,
      row_number() over (
        order by
          case when v_sort = 'relevance' then public.talent_relevance_score(
            p_keyword,
            coalesce(c.current_job_role, c.headline, ''),
            c.sap_skills,
            c.skills,
            public.talent_cert_names(c.certifications),
            coalesce(c.professional_summary, c.about_me, ''),
            trim(both from concat_ws(' ', c.first_name, c.last_name))
          ) end desc nulls last,
          case when v_sort = 'experience_high' then c.years_of_experience end desc nulls last,
          case when v_sort = 'experience_low' then c.years_of_experience end asc nulls last,
          case when v_sort = 'available_soon' then case public.normalize_talent_availability(c.availability)
            when 'immediately' then 0
            when 'within_2_weeks' then 1
            when 'within_1_month' then 2
            else 3
          end end asc nulls last,
          c.updated_at desc,
          c.id asc
      ) as ord
    from public.candidate_profiles c
    where public.candidate_matches_talent_filters(
      c, p_keyword, p_modules, p_skills, p_experience_bands, p_experience_min,
      p_countries, p_location_query, p_work_modes, p_employment_types,
      p_availability, p_candidate_status, p_certifications, p_languages
    )
  ) x
  where x.ord > ((v_page - 1) * v_page_size)
    and x.ord <= (v_page * v_page_size);

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', v_page,
    'pageSize', v_page_size,
    'totalPages', case
      when coalesce(v_total, 0) = 0 then 0
      else ceil(v_total::numeric / v_page_size::numeric)::integer
    end
  );
end;
$$;

create or replace function public.get_talent_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
  v_row public.candidate_profiles;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select * into v_row
  from public.candidate_profiles
  where id = p_candidate_id
    and is_searchable = true;

  if not found then
    raise exception 'CANDIDATE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  perform public.record_talent_profile_view(v_company_id, v_row.id);

  return public.to_talent_candidate_json(v_row);
end;
$$;

create or replace function public.record_talent_profile_view(
  p_company_id uuid,
  p_candidate_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_limit integer;
  v_used integer;
  v_start timestamptz;
  v_end timestamptz;
  v_already boolean;
begin
  if not public.company_has_plan_feature(p_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select current_period_start, current_period_end
  into v_start, v_end
  from public.subscriptions
  where company_id = p_company_id
  for update;

  if v_start is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.talent_search_usage u
    where u.company_id = p_company_id
      and u.candidate_id = p_candidate_id
      and u.created_at >= v_start
      and u.created_at < v_end
  ) into v_already;

  if v_already then
    return;
  end if;

  v_limit := public.get_company_talent_limit(p_company_id);
  if v_limit is not null then
    select count(*)::integer
    into v_used
    from public.talent_search_usage u
    where u.company_id = p_company_id
      and u.created_at >= v_start
      and u.created_at < v_end;

    if coalesce(v_used, 0) >= v_limit then
      raise exception 'TALENT_SEARCH_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;

  insert into public.talent_search_usage (company_id, candidate_id)
  values (p_company_id, p_candidate_id);
end;
$$;

create or replace function public.save_talent_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.candidate_profiles
    where id = p_candidate_id and is_searchable = true
  ) then
    raise exception 'CANDIDATE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  insert into public.saved_candidates (company_id, candidate_id)
  values (v_company_id, p_candidate_id)
  on conflict (company_id, candidate_id) do nothing;

  return jsonb_build_object('ok', true, 'candidateId', p_candidate_id);
end;
$$;

create or replace function public.remove_saved_talent_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  delete from public.saved_candidates
  where company_id = v_company_id
    and candidate_id = p_candidate_id;

  return jsonb_build_object('ok', true, 'candidateId', p_candidate_id);
end;
$$;

create or replace function public.list_saved_talent_candidates()
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
  v_items jsonb;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(public.to_talent_candidate_json(c) order by s.created_at desc), '[]'::jsonb)
  into v_items
  from public.saved_candidates s
  join public.candidate_profiles c on c.id = s.candidate_id
  where s.company_id = v_company_id
    and c.is_searchable = true;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'ids', coalesce((
      select jsonb_agg(s.candidate_id order by s.created_at desc)
      from public.saved_candidates s
      where s.company_id = v_company_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.shortlist_talent_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.candidate_profiles
    where id = p_candidate_id and is_searchable = true
  ) then
    raise exception 'CANDIDATE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  insert into public.employer_shortlisted_candidates (company_id, candidate_id)
  values (v_company_id, p_candidate_id)
  on conflict (company_id, candidate_id) do nothing;

  return jsonb_build_object('ok', true, 'candidateId', p_candidate_id);
end;
$$;

create or replace function public.remove_shortlisted_talent_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  delete from public.employer_shortlisted_candidates
  where company_id = v_company_id
    and candidate_id = p_candidate_id;

  return jsonb_build_object('ok', true, 'candidateId', p_candidate_id);
end;
$$;

create or replace function public.list_shortlisted_talent_candidate_ids()
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  return coalesce((
    select jsonb_agg(candidate_id order by created_at desc)
    from public.employer_shortlisted_candidates
    where company_id = v_company_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_talent_search_usage()
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
  v_limit integer;
  v_used integer;
  v_start timestamptz;
  v_end timestamptz;
begin
  v_company_id := public.require_employer_company_id();

  if not public.company_has_plan_feature(v_company_id, 'talent_search') then
    raise exception 'TALENT_SEARCH_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select current_period_start, current_period_end
  into v_start, v_end
  from public.subscriptions
  where company_id = v_company_id;

  v_limit := public.get_company_talent_limit(v_company_id);

  select count(*)::integer into v_used
  from public.talent_search_usage u
  where u.company_id = v_company_id
    and (v_start is null or u.created_at >= v_start)
    and (v_end is null or u.created_at < v_end);

  return jsonb_build_object(
    'used', coalesce(v_used, 0),
    'limit', v_limit,
    'periodStart', v_start,
    'periodEnd', v_end
  );
end;
$$;
