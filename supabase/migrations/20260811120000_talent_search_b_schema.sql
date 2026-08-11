-- Talent Search B: searchability columns, saved/shortlist tables,
-- minimal subscription plans (Sprint 6B schema was not yet in DB),
-- usage tracking, indexes, and RLS.

-- ---------------------------------------------------------------------------
-- 1. Candidate searchability + discovery preferences
-- ---------------------------------------------------------------------------
alter table public.candidate_profiles
  add column if not exists is_searchable boolean not null default false,
  add column if not exists work_modes text[] not null default '{}'::text[],
  add column if not exists employment_types text[] not null default '{}'::text[],
  add column if not exists discovery_status text not null default 'not_available';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'candidate_profiles_discovery_status_check'
  ) then
    alter table public.candidate_profiles
      add constraint candidate_profiles_discovery_status_check
      check (
        discovery_status in (
          'open_to_opportunities',
          'available',
          'not_available'
        )
      );
  end if;
end $$;

comment on column public.candidate_profiles.is_searchable is
  'Employer Talent Search opt-in. Default false — candidates must explicitly enable discovery.';

create index if not exists candidate_profiles_is_searchable_idx
  on public.candidate_profiles (is_searchable)
  where is_searchable = true;

create index if not exists candidate_profiles_search_exp_idx
  on public.candidate_profiles (years_of_experience)
  where is_searchable = true;

create index if not exists candidate_profiles_search_country_idx
  on public.candidate_profiles (country)
  where is_searchable = true;

create index if not exists candidate_profiles_search_updated_idx
  on public.candidate_profiles (updated_at desc)
  where is_searchable = true;

-- ---------------------------------------------------------------------------
-- 2. Saved candidates (company-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (company_id, candidate_id)
);

create index if not exists saved_candidates_company_id_idx
  on public.saved_candidates (company_id);

create index if not exists saved_candidates_candidate_id_idx
  on public.saved_candidates (candidate_id);

alter table public.saved_candidates enable row level security;

drop policy if exists "Employers can view own company saved candidates"
  on public.saved_candidates;
create policy "Employers can view own company saved candidates"
  on public.saved_candidates for select
  to authenticated
  using (company_id = public.current_company_id());

drop policy if exists "Employers can insert own company saved candidates"
  on public.saved_candidates;
create policy "Employers can insert own company saved candidates"
  on public.saved_candidates for insert
  to authenticated
  with check (company_id = public.current_company_id());

drop policy if exists "Employers can delete own company saved candidates"
  on public.saved_candidates;
create policy "Employers can delete own company saved candidates"
  on public.saved_candidates for delete
  to authenticated
  using (company_id = public.current_company_id());

revoke all on public.saved_candidates from anon;
grant select, insert, delete on public.saved_candidates to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Talent pool shortlist (company-scoped; separate from application status)
-- ---------------------------------------------------------------------------
create table if not exists public.employer_shortlisted_candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (company_id, candidate_id)
);

create index if not exists employer_shortlisted_candidates_company_id_idx
  on public.employer_shortlisted_candidates (company_id);

create index if not exists employer_shortlisted_candidates_candidate_id_idx
  on public.employer_shortlisted_candidates (candidate_id);

alter table public.employer_shortlisted_candidates enable row level security;

drop policy if exists "Employers can view own company talent shortlist"
  on public.employer_shortlisted_candidates;
create policy "Employers can view own company talent shortlist"
  on public.employer_shortlisted_candidates for select
  to authenticated
  using (company_id = public.current_company_id());

drop policy if exists "Employers can insert own company talent shortlist"
  on public.employer_shortlisted_candidates;
create policy "Employers can insert own company talent shortlist"
  on public.employer_shortlisted_candidates for insert
  to authenticated
  with check (company_id = public.current_company_id());

drop policy if exists "Employers can delete own company talent shortlist"
  on public.employer_shortlisted_candidates;
create policy "Employers can delete own company talent shortlist"
  on public.employer_shortlisted_candidates for delete
  to authenticated
  using (company_id = public.current_company_id());

revoke all on public.employer_shortlisted_candidates from anon;
grant select, insert, delete on public.employer_shortlisted_candidates to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Minimal subscription schema (required for Talent Search plan limits)
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  price_monthly numeric(10,2) not null default 0,
  max_active_jobs integer,
  max_applications integer,
  max_talent_search integer,
  max_team_members integer,
  features text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

insert into public.subscription_plans (
  id, name, price_monthly, max_active_jobs, max_applications,
  max_talent_search, max_team_members, features
) values
  (
    'free',
    'Free',
    0,
    3,
    50,
    10,
    1,
    array['basic_analytics','candidate_messaging','interview_management']
  ),
  (
    'pro',
    'Pro',
    29,
    15,
    500,
    100,
    5,
    array[
      'basic_analytics','advanced_analytics','talent_search',
      'candidate_messaging','interview_management'
    ]
  ),
  (
    'business',
    'Business',
    99,
    null,
    null,
    null,
    null,
    array[
      'basic_analytics','advanced_analytics','talent_search',
      'candidate_messaging','interview_management','team_members',
      'priority_support'
    ]
  )
on conflict (id) do update
  set name = excluded.name,
      price_monthly = excluded.price_monthly,
      max_active_jobs = excluded.max_active_jobs,
      max_applications = excluded.max_applications,
      max_talent_search = excluded.max_talent_search,
      max_team_members = excluded.max_team_members,
      features = excluded.features;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.company_profiles(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'active'
    check (status in ('active','trialing','past_due','cancelled')),
  billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly','yearly')),
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  trial_ends_at timestamptz,
  renewal_date date,
  next_billing_date date,
  payment_method_configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_plan_id_idx
  on public.subscriptions (plan_id);

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Authenticated can read subscription plans"
  on public.subscription_plans;
create policy "Authenticated can read subscription plans"
  on public.subscription_plans for select
  to authenticated
  using (true);

drop policy if exists "Employers can view own company subscription"
  on public.subscriptions;
create policy "Employers can view own company subscription"
  on public.subscriptions for select
  to authenticated
  using (company_id = public.current_company_id());

revoke all on public.subscription_plans from anon;
revoke all on public.subscriptions from anon;
grant select on public.subscription_plans to authenticated;
grant select on public.subscriptions to authenticated;

-- Backfill subscriptions for existing companies (pro matches prior mock UX)
insert into public.subscriptions (
  company_id, plan_id, status, billing_cycle,
  current_period_start, current_period_end,
  renewal_date, next_billing_date
)
select
  c.id,
  'pro',
  'active',
  'monthly',
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month',
  (date_trunc('month', now()) + interval '1 month')::date,
  (date_trunc('month', now()) + interval '1 month')::date
from public.company_profiles c
on conflict (company_id) do nothing;

-- Auto-create free subscription for new companies
create or replace function public.create_default_subscription_for_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (
    company_id, plan_id, status, billing_cycle,
    current_period_start, current_period_end,
    renewal_date, next_billing_date
  ) values (
    new.id,
    'free',
    'active',
    'monthly',
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month',
    (date_trunc('month', now()) + interval '1 month')::date,
    (date_trunc('month', now()) + interval '1 month')::date
  )
  on conflict (company_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_company_default_subscription on public.company_profiles;
create trigger trg_company_default_subscription
  after insert on public.company_profiles
  for each row
  execute function public.create_default_subscription_for_company();

-- ---------------------------------------------------------------------------
-- 5. Talent Search usage (profile views per billing period)
-- ---------------------------------------------------------------------------
create table if not exists public.talent_search_usage (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists talent_search_usage_company_created_idx
  on public.talent_search_usage (company_id, created_at desc);

create index if not exists talent_search_usage_company_candidate_idx
  on public.talent_search_usage (company_id, candidate_id, created_at desc);

alter table public.talent_search_usage enable row level security;

drop policy if exists "Employers can view own company talent usage"
  on public.talent_search_usage;
create policy "Employers can view own company talent usage"
  on public.talent_search_usage for select
  to authenticated
  using (company_id = public.current_company_id());

-- Inserts only via SECURITY DEFINER RPC (no direct insert policy for clients)
revoke all on public.talent_search_usage from anon;
grant select on public.talent_search_usage to authenticated;
