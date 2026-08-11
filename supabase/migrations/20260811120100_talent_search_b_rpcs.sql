-- Talent Search B RPCs (clean implementation).
-- SECURITY DEFINER with auth/company checks; safe JSON only (no phone/email/CTC).

create or replace function public.require_employer_company_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_role := public.current_app_role();
  if v_role is distinct from 'employer' and v_role is distinct from 'admin' then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  v_company_id := public.current_company_id();
  if v_company_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  return v_company_id;
end;
$$;

create or replace function public.normalize_talent_availability(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_value is null or btrim(p_value) = '' then 'not_specified'
    when lower(btrim(p_value)) in ('immediate', 'immediately') then 'immediately'
    when lower(btrim(p_value)) in ('2 weeks', 'within 2 weeks', 'within_2_weeks') then 'within_2_weeks'
    when lower(btrim(p_value)) in ('1 month', 'within 1 month', 'within_1_month') then 'within_1_month'
    when lower(btrim(p_value)) in ('not specified', 'not_specified') then 'not_specified'
    else 'not_specified'
  end;
$$;

create or replace function public.talent_experience_matches(
  p_years integer,
  p_bands text[],
  p_min integer
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    (
      p_bands is null
      or cardinality(p_bands) = 0
      or exists (
        select 1
        from unnest(p_bands) as band(value)
        where case band.value
          when '0-2' then p_years between 0 and 2
          when '3-5' then p_years between 3 and 5
          when '6-8' then p_years between 6 and 8
          when '9-12' then p_years between 9 and 12
          when '13+' then p_years >= 13
          else false
        end
      )
    )
    and (p_min is null or p_years >= p_min);
$$;

create or replace function public.talent_cert_names(p_certs jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(
    array(
      select coalesce(item->>'name', item->>'certificate_name', '')
      from jsonb_array_elements(coalesce(p_certs, '[]'::jsonb)) as item
      where coalesce(item->>'name', item->>'certificate_name', '') <> ''
    ),
    '{}'::text[]
  );
$$;

create or replace function public.talent_relevance_score(
  p_keyword text,
  p_title text,
  p_modules text[],
  p_skills text[],
  p_certs text[],
  p_summary text,
  p_name text
)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_score integer := 0;
  v_token text;
  v_modules text := lower(array_to_string(coalesce(p_modules, '{}'::text[]), ' '));
  v_skills text := lower(array_to_string(coalesce(p_skills, '{}'::text[]), ' '));
  v_certs text := lower(array_to_string(coalesce(p_certs, '{}'::text[]), ' '));
begin
  if p_keyword is null or btrim(p_keyword) = '' then
    return 0;
  end if;

  foreach v_token in array regexp_split_to_array(lower(btrim(p_keyword)), '\s+')
  loop
    if v_token = '' then
      continue;
    end if;
    if position(v_token in lower(coalesce(p_title, ''))) > 0 then
      v_score := v_score + 8;
    end if;
    if position(v_token in v_modules) > 0 then
      v_score := v_score + 6;
    end if;
    if position(v_token in v_skills) > 0 then
      v_score := v_score + 5;
    end if;
    if position(v_token in v_certs) > 0 then
      v_score := v_score + 3;
    end if;
    if position(v_token in lower(coalesce(p_summary, ''))) > 0 then
      v_score := v_score + 2;
    end if;
    if position(v_token in lower(coalesce(p_name, ''))) > 0 then
      v_score := v_score + 1;
    end if;
  end loop;

  return v_score;
end;
$$;

create or replace function public.to_talent_candidate_json(p_row public.candidate_profiles)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_name text;
  v_location text;
  v_experience jsonb;
  v_education jsonb;
  v_certs jsonb;
begin
  v_name := trim(both from concat_ws(' ', p_row.first_name, p_row.last_name));
  if v_name = '' then
    v_name := 'Candidate';
  end if;

  v_location := coalesce(
    nullif(p_row.location, ''),
    nullif(concat_ws(', ', nullif(p_row.current_city, ''), nullif(p_row.country, '')), ''),
    'Location not specified'
  );

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', coalesce(item->>'id', md5(coalesce(item::text, ''))),
      'company', coalesce(item->>'company', item->>'company_name', 'Company'),
      'role', coalesce(item->>'role', item->>'designation', item->>'title', 'Role'),
      'startDate', coalesce(item->>'startDate', item->>'start_date', ''),
      'endDate', coalesce(item->>'endDate', item->>'end_date'),
      'description', coalesce(item->>'description', ''),
      'skills', case
        when jsonb_typeof(item->'skills') = 'array' then item->'skills'
        else '[]'::jsonb
      end
    )
  ), '[]'::jsonb)
  into v_experience
  from jsonb_array_elements(coalesce(p_row.work_experience, '[]'::jsonb)) as item;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', coalesce(item->>'id', md5(coalesce(item::text, ''))),
      'school', coalesce(item->>'school', item->>'college', item->>'university', 'School'),
      'degree', coalesce(item->>'degree', ''),
      'field', coalesce(item->>'field', item->>'specialization', ''),
      'year', coalesce(
        nullif(item->>'year', '')::int,
        nullif(item->>'end_year', '')::int,
        0
      )
    )
  ), '[]'::jsonb)
  into v_education
  from jsonb_array_elements(coalesce(p_row.education, '[]'::jsonb)) as item;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', coalesce(item->>'id', md5(coalesce(item::text, ''))),
      'name', coalesce(item->>'name', item->>'certificate_name', 'Certification'),
      'type', coalesce(item->>'type', item->>'issuer', 'Certification listed'),
      'year', coalesce(
        nullif(item->>'year', '')::int,
        extract(year from nullif(item->>'issued_date', '')::date)::int,
        0
      )
    )
  ), '[]'::jsonb)
  into v_certs
  from jsonb_array_elements(coalesce(p_row.certifications, '[]'::jsonb)) as item;

  return jsonb_build_object(
    'id', p_row.id,
    'name', v_name,
    'avatarUrl', coalesce(p_row.avatar_url, p_row.profile_photo_url),
    'title', coalesce(nullif(p_row.current_job_role, ''), nullif(p_row.headline, ''), 'SAP Professional'),
    'summary', coalesce(nullif(p_row.professional_summary, ''), nullif(p_row.about_me, ''), ''),
    'yearsOfExperience', coalesce(p_row.years_of_experience, 0),
    'location', v_location,
    'country', coalesce(p_row.country, ''),
    'city', coalesce(p_row.current_city, ''),
    'workModes', to_jsonb(coalesce(p_row.work_modes, '{}'::text[])),
    'availability', public.normalize_talent_availability(p_row.availability),
    'employmentTypes', to_jsonb(coalesce(p_row.employment_types, '{}'::text[])),
    'candidateStatus', p_row.discovery_status,
    'sapModules', to_jsonb(coalesce(p_row.sap_skills, '{}'::text[])),
    'skills', to_jsonb(coalesce(p_row.skills, '{}'::text[])),
    'certifications', v_certs,
    'languages', to_jsonb(coalesce(p_row.languages, '{}'::text[])),
    'experience', v_experience,
    'education', v_education,
    'isSearchable', p_row.is_searchable,
    'lastUpdated', p_row.updated_at
  );
end;
$$;

create or replace function public.candidate_matches_talent_filters(
  c public.candidate_profiles,
  p_keyword text,
  p_modules text[],
  p_skills text[],
  p_experience_bands text[],
  p_experience_min integer,
  p_countries text[],
  p_location_query text,
  p_work_modes text[],
  p_employment_types text[],
  p_availability text[],
  p_candidate_status text[],
  p_certifications text[],
  p_languages text[]
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    c.is_searchable = true
    and public.talent_experience_matches(c.years_of_experience, p_experience_bands, p_experience_min)
    and (
      p_modules is null or cardinality(p_modules) = 0
      or exists (
        select 1 from unnest(c.sap_skills) m
        where lower(m) = any (select lower(x) from unnest(p_modules) x)
      )
    )
    and (
      p_skills is null or cardinality(p_skills) = 0
      or exists (
        select 1 from unnest(c.skills) s
        where lower(s) = any (select lower(x) from unnest(p_skills) x)
      )
    )
    and (
      p_countries is null or cardinality(p_countries) = 0
      or coalesce(c.country, '') = any (p_countries)
    )
    and (
      p_location_query is null or btrim(p_location_query) = ''
      or lower(coalesce(c.location, '')) like '%' || lower(btrim(p_location_query)) || '%'
      or lower(coalesce(c.current_city, '')) like '%' || lower(btrim(p_location_query)) || '%'
      or lower(coalesce(c.country, '')) like '%' || lower(btrim(p_location_query)) || '%'
    )
    and (
      p_work_modes is null or cardinality(p_work_modes) = 0
      or c.work_modes && p_work_modes
    )
    and (
      p_employment_types is null or cardinality(p_employment_types) = 0
      or c.employment_types && p_employment_types
    )
    and (
      p_availability is null or cardinality(p_availability) = 0
      or public.normalize_talent_availability(c.availability) = any (p_availability)
    )
    and (
      p_candidate_status is null or cardinality(p_candidate_status) = 0
      or c.discovery_status = any (p_candidate_status)
    )
    and (
      p_languages is null or cardinality(p_languages) = 0
      or exists (
        select 1 from unnest(c.languages) l
        where lower(l) = any (select lower(x) from unnest(p_languages) x)
      )
    )
    and (
      p_certifications is null or cardinality(p_certifications) = 0
      or exists (
        select 1 from unnest(public.talent_cert_names(c.certifications)) cn
        where lower(cn) = any (select lower(x) from unnest(p_certifications) x)
      )
    )
    and (
      p_keyword is null or btrim(p_keyword) = ''
      or public.talent_relevance_score(
        p_keyword,
        coalesce(c.current_job_role, c.headline, ''),
        c.sap_skills,
        c.skills,
        public.talent_cert_names(c.certifications),
        coalesce(c.professional_summary, c.about_me, ''),
        trim(both from concat_ws(' ', c.first_name, c.last_name))
      ) > 0
    );
$$;

create or replace function public.get_company_talent_limit(p_company_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select sp.max_talent_search
  from public.subscriptions s
  join public.subscription_plans sp on sp.id = s.plan_id
  where s.company_id = p_company_id
  limit 1;
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

revoke all on function public.require_employer_company_id() from public, anon;
revoke all on function public.search_talent_candidates(
  text, text[], text[], text[], integer, text[], text, text[], text[], text[], text[], text[], text[], text, integer, integer
) from public, anon;
revoke all on function public.get_talent_candidate(uuid) from public, anon;
revoke all on function public.save_talent_candidate(uuid) from public, anon;
revoke all on function public.remove_saved_talent_candidate(uuid) from public, anon;
revoke all on function public.list_saved_talent_candidates() from public, anon;
revoke all on function public.shortlist_talent_candidate(uuid) from public, anon;
revoke all on function public.remove_shortlisted_talent_candidate(uuid) from public, anon;
revoke all on function public.list_shortlisted_talent_candidate_ids() from public, anon;
revoke all on function public.get_talent_search_usage() from public, anon;

grant execute on function public.search_talent_candidates(
  text, text[], text[], text[], integer, text[], text, text[], text[], text[], text[], text[], text[], text, integer, integer
) to authenticated;
grant execute on function public.get_talent_candidate(uuid) to authenticated;
grant execute on function public.save_talent_candidate(uuid) to authenticated;
grant execute on function public.remove_saved_talent_candidate(uuid) to authenticated;
grant execute on function public.list_saved_talent_candidates() to authenticated;
grant execute on function public.shortlist_talent_candidate(uuid) to authenticated;
grant execute on function public.remove_shortlisted_talent_candidate(uuid) to authenticated;
grant execute on function public.list_shortlisted_talent_candidate_ids() to authenticated;
grant execute on function public.get_talent_search_usage() to authenticated;
