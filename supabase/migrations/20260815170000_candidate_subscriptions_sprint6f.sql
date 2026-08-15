-- ============================================================================
-- Sprint 6 Phase F: Candidate Subscriptions, Plan Entitlements & Feature Gating
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CANDIDATE PLANS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.candidate_plans (
  id text primary key,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  price_monthly numeric(10, 2) not null default 0,
  currency text not null default 'INR',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  is_active boolean not null default true,
  badge text,
  highlighted boolean not null default false,
  features text[] not null default '{}'::text[],
  limits jsonb not null default '{}'::jsonb,
  feature_flags text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed candidate plans
insert into public.candidate_plans (
  id, name, tagline, description, price_monthly, currency, billing_cycle,
  is_active, badge, highlighted, features, limits, feature_flags, sort_order
) values
(
  'free',
  'Free',
  'For candidates exploring SAP opportunities.',
  'Get started with essential job search and application tools.',
  0,
  'INR',
  'monthly',
  true,
  null,
  false,
  array[
    '5 applications / month',
    '15 saved jobs',
    '5 active job alerts',
    'SAP job search & basic filters',
    'Candidate profile',
    'Basic resume builder',
    'Standard application tracking'
  ],
  jsonb_build_object(
    'job_alerts', 5,
    'saved_jobs', 15,
    'applications_per_month', 5,
    'resume_versions', 1
  ),
  array[
    'job_search',
    'basic_filters',
    'applications',
    'saved_jobs',
    'job_alerts',
    'resume_builder',
    'application_tracking',
    'candidate_profile',
    'recruiter_messaging'
  ],
  1
),
(
  'professional',
  'Professional',
  'For candidates actively applying and looking for better job-search tools.',
  'Accelerate your SAP search with higher limits and ATS tools.',
  499,
  'INR',
  'monthly',
  true,
  'Most Popular',
  true,
  array[
    'Everything in Free',
    '25 applications / month',
    '50 saved jobs',
    '20 active job alerts',
    'Advanced SAP search & filters',
    'ATS Resume Score & feedback',
    'Enhanced application tracking',
    'Enhanced candidate profile',
    'Priority email support'
  ],
  jsonb_build_object(
    'job_alerts', 20,
    'saved_jobs', 50,
    'applications_per_month', 25,
    'resume_versions', 3
  ),
  array[
    'job_search',
    'basic_filters',
    'advanced_search',
    'applications',
    'saved_jobs',
    'job_alerts',
    'resume_builder',
    'ats_resume_score',
    'application_tracking',
    'candidate_profile',
    'recruiter_messaging',
    'priority_support'
  ],
  2
),
(
  'premium',
  'Premium',
  'For serious candidates who want advanced tools to maximize their chances of getting hired.',
  'Maximum visibility, unlimited capacity, and direct recruiter reach.',
  999,
  'INR',
  'monthly',
  true,
  null,
  false,
  array[
    'Everything in Professional',
    'Unlimited job applications',
    'Unlimited saved jobs',
    'Unlimited job alerts',
    'Multi-resume management',
    'Advanced application insights',
    'Priority profile visibility to employers',
    'Direct recruiter outreach',
    'Dedicated concierge support'
  ],
  jsonb_build_object(
    'job_alerts', null,
    'saved_jobs', null,
    'applications_per_month', null,
    'resume_versions', null
  ),
  array[
    'job_search',
    'basic_filters',
    'advanced_search',
    'applications',
    'saved_jobs',
    'job_alerts',
    'resume_builder',
    'ats_resume_score',
    'multi_resume',
    'application_tracking',
    'application_insights',
    'candidate_profile',
    'profile_visibility',
    'recruiter_messaging',
    'direct_recruiter_reach',
    'candidate_analytics',
    'priority_support'
  ],
  3
)
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  price_monthly = excluded.price_monthly,
  currency = excluded.currency,
  billing_cycle = excluded.billing_cycle,
  is_active = excluded.is_active,
  badge = excluded.badge,
  highlighted = excluded.highlighted,
  features = excluded.features,
  limits = excluded.limits,
  feature_flags = excluded.feature_flags,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 2. CANDIDATE SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.candidate_subscriptions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.candidate_profiles(id) on delete cascade,
  plan_id text not null references public.candidate_plans(id),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly', 'yearly')),
  price_monthly numeric(10, 2) not null default 0,
  currency text not null default 'INR',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  cancel_at_period_end boolean not null default false,
  renewal_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists candidate_subscriptions_plan_id_idx
  on public.candidate_subscriptions (plan_id);

create index if not exists candidate_subscriptions_candidate_id_idx
  on public.candidate_subscriptions (candidate_id);

create index if not exists candidate_subscriptions_status_idx
  on public.candidate_subscriptions (status);

-- Updated_at trigger
drop trigger if exists candidate_subscriptions_set_updated_at on public.candidate_subscriptions;
create trigger candidate_subscriptions_set_updated_at
  before update on public.candidate_subscriptions
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
alter table public.candidate_plans enable row level security;
alter table public.candidate_plans force row level security;

drop policy if exists "Anyone can read active candidate plans" on public.candidate_plans;
create policy "Anyone can read active candidate plans"
  on public.candidate_plans
  for select
  to anon, authenticated
  using (is_active = true);

revoke insert, update, delete on table public.candidate_plans from anon, authenticated;
grant select on table public.candidate_plans to anon, authenticated;

alter table public.candidate_subscriptions enable row level security;
alter table public.candidate_subscriptions force row level security;

drop policy if exists "Candidates can view own subscription" on public.candidate_subscriptions;
create policy "Candidates can view own subscription"
  on public.candidate_subscriptions
  for select
  to authenticated
  using (candidate_id = (select public.current_candidate_id()));

-- Revoke direct mutation on candidate_subscriptions by candidates to prevent tampering
revoke insert, update, delete on table public.candidate_subscriptions from anon, authenticated;
grant select on table public.candidate_subscriptions to authenticated;

-- ----------------------------------------------------------------------------
-- 4. HELPER & ENTITLEMENT FUNCTIONS
-- ----------------------------------------------------------------------------

-- Effective Plan Resolution
create or replace function public.get_candidate_effective_plan(p_candidate_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  v_plan_id text;
  v_status text;
  v_end timestamptz;
  v_cancel boolean;
begin
  if p_candidate_id is null then
    return 'free';
  end if;

  select plan_id, status, current_period_end, cancel_at_period_end
  into v_plan_id, v_status, v_end, v_cancel
  from public.candidate_subscriptions
  where candidate_id = p_candidate_id
  limit 1;

  if v_plan_id is null then
    return 'free';
  end if;

  -- Active or trialing plan
  if v_status in ('active', 'trialing') then
    if v_end is null or v_end >= now() then
      return v_plan_id;
    else
      return 'free'; -- Expired active plan reverts to Free
    end if;
  end if;

  -- Cancelled plan with grace period until period end
  if v_status = 'cancelled' then
    if v_cancel is true and v_end is not null and v_end >= now() then
      return v_plan_id;
    else
      return 'free';
    end if;
  end if;

  -- Past due (active grace period until period end)
  if v_status = 'past_due' then
    if v_end is null or v_end >= now() then
      return v_plan_id;
    else
      return 'free';
    end if;
  end if;

  -- Expired
  return 'free';
end;
$$;

grant execute on function public.get_candidate_effective_plan(uuid) to anon, authenticated, service_role;

-- Job Alert Limit for Effective Plan
create or replace function public.get_candidate_active_job_alert_limit(p_candidate_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  v_effective_plan text;
  v_limit_raw jsonb;
begin
  v_effective_plan := public.get_candidate_effective_plan(p_candidate_id);

  select limits->'job_alerts'
  into v_limit_raw
  from public.candidate_plans
  where id = v_effective_plan
  limit 1;

  if v_limit_raw is null or jsonb_typeof(v_limit_raw) = 'null' then
    return null; -- Unlimited / TBD
  end if;

  return (v_limit_raw#>>'{}')::integer;
end;
$$;

grant execute on function public.get_candidate_active_job_alert_limit(uuid) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. SERVER-SIDE ENFORCEMENT TRIGGER FOR ACTIVE JOB ALERTS
-- ----------------------------------------------------------------------------
create or replace function public.enforce_candidate_active_job_alert_limit()
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
  -- Only enforce when the alert is or becomes active
  if new.is_active is distinct from true then
    return new;
  end if;

  -- If updating an already active alert without candidate change, pass
  if TG_OP = 'UPDATE' and old.is_active = true and old.candidate_id = new.candidate_id then
    return new;
  end if;

  v_limit := public.get_candidate_active_job_alert_limit(new.candidate_id);

  -- If unlimited (null), allow creation
  if v_limit is null then
    return new;
  end if;

  -- Count current active alerts for this candidate
  select count(*)::integer
  into v_count
  from public.job_alerts
  where candidate_id = new.candidate_id
    and is_active = true
    and (TG_OP = 'INSERT' or id <> new.id);

  if v_count >= v_limit then
    raise exception 'ACTIVE_JOB_ALERT_LIMIT_REACHED: You have reached the maximum active job alerts limit (%) for your plan.', v_limit
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_candidate_active_job_alerts_insert on public.job_alerts;
create trigger enforce_candidate_active_job_alerts_insert
  before insert on public.job_alerts
  for each row
  execute function public.enforce_candidate_active_job_alert_limit();

drop trigger if exists enforce_candidate_active_job_alerts_update on public.job_alerts;
create trigger enforce_candidate_active_job_alerts_update
  before update on public.job_alerts
  for each row
  execute function public.enforce_candidate_active_job_alert_limit();

-- ----------------------------------------------------------------------------
-- 6. RPC: GET CANDIDATE SUBSCRIPTION OVERVIEW
-- ----------------------------------------------------------------------------
create or replace function public.get_candidate_subscription_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_candidate_id uuid;
  v_effective_plan_id text;
  v_sub record;
  v_plan_def record;
  v_active_alerts_count integer := 0;
  v_saved_jobs_count integer := 0;
  v_applications_count integer := 0;
  v_resumes_count integer := 0;
  v_month_start timestamptz := date_trunc('month', now());
  v_all_plans jsonb;
begin
  v_candidate_id := public.current_candidate_id();
  if v_candidate_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  v_effective_plan_id := public.get_candidate_effective_plan(v_candidate_id);

  -- Fetch candidate subscription row if exists
  select * into v_sub
  from public.candidate_subscriptions
  where candidate_id = v_candidate_id
  limit 1;

  -- Fetch effective plan row
  select * into v_plan_def
  from public.candidate_plans
  where id = v_effective_plan_id
  limit 1;

  -- Compute live usage metrics
  select count(*)::integer into v_active_alerts_count
  from public.job_alerts
  where candidate_id = v_candidate_id and is_active = true;

  select count(*)::integer into v_saved_jobs_count
  from public.saved_jobs
  where candidate_id = v_candidate_id;

  select count(*)::integer into v_applications_count
  from public.applications
  where candidate_id = v_candidate_id and applied_at >= v_month_start;

  select count(*)::integer into v_resumes_count
  from public.candidate_resumes
  where candidate_id = v_candidate_id;

  -- Fetch all available active plans
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', cp.id,
      'name', cp.name,
      'tagline', cp.tagline,
      'description', cp.description,
      'priceMonthly', cp.price_monthly,
      'currency', cp.currency,
      'billingCycle', cp.billing_cycle,
      'badge', cp.badge,
      'highlighted', cp.highlighted,
      'features', cp.features,
      'limits', cp.limits,
      'featureFlags', cp.feature_flags,
      'sortOrder', cp.sort_order
    ) order by cp.sort_order asc
  ), '[]'::jsonb)
  into v_all_plans
  from public.candidate_plans cp
  where cp.is_active = true;

  return jsonb_build_object(
    'candidateId', v_candidate_id,
    'effectivePlanId', v_effective_plan_id,
    'subscription', case
      when v_sub.id is not null then jsonb_build_object(
        'id', v_sub.id,
        'planId', v_sub.plan_id,
        'status', v_sub.status,
        'billingCycle', v_sub.billing_cycle,
        'priceMonthly', v_sub.price_monthly,
        'currency', v_sub.currency,
        'currentPeriodStart', v_sub.current_period_start,
        'currentPeriodEnd', v_sub.current_period_end,
        'cancelAtPeriodEnd', v_sub.cancel_at_period_end,
        'renewalDate', v_sub.renewal_date
      )
      else null
    end,
    'plan', jsonb_build_object(
      'id', v_plan_def.id,
      'name', v_plan_def.name,
      'tagline', v_plan_def.tagline,
      'description', v_plan_def.description,
      'priceMonthly', v_plan_def.price_monthly,
      'currency', v_plan_def.currency,
      'billingCycle', v_plan_def.billing_cycle,
      'badge', v_plan_def.badge,
      'highlighted', v_plan_def.highlighted,
      'features', v_plan_def.features,
      'limits', v_plan_def.limits,
      'featureFlags', v_plan_def.feature_flags
    ),
    'usage', jsonb_build_object(
      'jobAlerts', coalesce(v_active_alerts_count, 0),
      'savedJobs', coalesce(v_saved_jobs_count, 0),
      'applications', coalesce(v_applications_count, 0),
      'resumeVersions', coalesce(v_resumes_count, 0)
    ),
    'plans', v_all_plans
  );
end;
$$;

revoke all on function public.get_candidate_subscription_overview() from public;
grant execute on function public.get_candidate_subscription_overview() to authenticated;

-- ----------------------------------------------------------------------------
-- 7. DEV HELPER: DEV SET CANDIDATE SUBSCRIPTION (SAFE DEV SIMULATION)
-- ----------------------------------------------------------------------------
create or replace function public.dev_set_candidate_subscription(
  p_plan_id text,
  p_status text default 'active',
  p_cancel_at_period_end boolean default false,
  p_days_remaining integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_candidate_id uuid;
  v_plan public.candidate_plans;
  v_start timestamptz := now();
  v_end timestamptz := now() + (p_days_remaining || ' days')::interval;
  v_renewal timestamptz := case when p_cancel_at_period_end then null else now() + (p_days_remaining || ' days')::interval end;
begin
  v_candidate_id := public.current_candidate_id();
  if v_candidate_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  if p_plan_id not in ('free', 'professional', 'premium') then
    raise exception 'INVALID_PLAN_ID' using errcode = '22023';
  end if;

  if p_status not in ('active', 'trialing', 'past_due', 'cancelled', 'expired') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  select * into v_plan from public.candidate_plans where id = p_plan_id;

  if p_plan_id = 'free' and p_status = 'active' then
    -- Free plan defaults to removing paid subscription record
    delete from public.candidate_subscriptions where candidate_id = v_candidate_id;
  else
    insert into public.candidate_subscriptions (
      candidate_id, plan_id, status, billing_cycle,
      price_monthly, currency, current_period_start, current_period_end,
      cancel_at_period_end, renewal_date
    ) values (
      v_candidate_id, p_plan_id, p_status, 'monthly',
      v_plan.price_monthly, v_plan.currency, v_start, v_end,
      p_cancel_at_period_end, v_renewal
    )
    on conflict (candidate_id) do update set
      plan_id = excluded.plan_id,
      status = excluded.status,
      billing_cycle = excluded.billing_cycle,
      price_monthly = excluded.price_monthly,
      currency = excluded.currency,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      renewal_date = excluded.renewal_date,
      updated_at = now();
  end if;

  return public.get_candidate_subscription_overview();
end;
$$;

revoke all on function public.dev_set_candidate_subscription(text, text, boolean, integer) from public;
grant execute on function public.dev_set_candidate_subscription(text, text, boolean, integer) to authenticated;
