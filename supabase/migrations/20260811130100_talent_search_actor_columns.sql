-- Wire Talent Search save/shortlist RPCs to employer_accounts actor columns.

create or replace function public.save_talent_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
  v_account_id uuid;
begin
  v_company_id := public.require_employer_company_id();
  v_account_id := public.get_current_employer_account_id();

  if not exists (
    select 1 from public.candidate_profiles
    where id = p_candidate_id and is_searchable = true
  ) then
    raise exception 'CANDIDATE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  insert into public.saved_candidates (company_id, candidate_id, saved_by)
  values (v_company_id, p_candidate_id, v_account_id)
  on conflict (company_id, candidate_id) do nothing;

  return jsonb_build_object('ok', true, 'candidateId', p_candidate_id);
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
  v_account_id uuid;
begin
  v_company_id := public.require_employer_company_id();
  v_account_id := public.get_current_employer_account_id();

  if not exists (
    select 1 from public.candidate_profiles
    where id = p_candidate_id and is_searchable = true
  ) then
    raise exception 'CANDIDATE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  insert into public.employer_shortlisted_candidates (company_id, candidate_id, created_by)
  values (v_company_id, p_candidate_id, v_account_id)
  on conflict (company_id, candidate_id) do nothing;

  return jsonb_build_object('ok', true, 'candidateId', p_candidate_id);
end;
$$;
