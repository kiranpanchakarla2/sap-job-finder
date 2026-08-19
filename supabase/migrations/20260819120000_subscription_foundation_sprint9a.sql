-- ============================================================================
-- Sprint 9A: Shared Subscription & Billing Foundation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND EMPLOYER SUBSCRIPTION PLANS TABLE
-- ----------------------------------------------------------------------------
alter table public.subscription_plans
  add column if not exists price_quarterly numeric(10, 2) not null default 0,
  add column if not exists price_yearly numeric(10, 2) not null default 0,
  add column if not exists currency text not null default 'INR',
  add column if not exists account_type text not null default 'employer',
  add column if not exists description text not null default '',
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

-- Update existing employer plans with billing cycle prices & metadata
update public.subscription_plans
set
  price_monthly = 0,
  price_quarterly = 0,
  price_yearly = 0,
  currency = 'INR',
  account_type = 'employer',
  description = 'Get started with essential hiring tools.',
  is_active = true,
  sort_order = 1,
  updated_at = now()
where id = 'free';

update public.subscription_plans
set
  price_monthly = 1999,
  price_quarterly = 5399,
  price_yearly = 19199,
  currency = 'INR',
  account_type = 'employer',
  description = 'Scale hiring with advanced insights and Talent Search.',
  is_active = true,
  sort_order = 2,
  updated_at = now()
where id = 'pro';

update public.subscription_plans
set
  price_monthly = 5999,
  price_quarterly = 16199,
  price_yearly = 57599,
  currency = 'INR',
  account_type = 'employer',
  description = 'Unlimited hiring capacity for growing teams.',
  is_active = true,
  sort_order = 3,
  updated_at = now()
where id = 'business';

-- Add check constraint for account_type on subscription_plans
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscription_plans_account_type_check'
      and conrelid = 'public.subscription_plans'::regclass
  ) then
    alter table public.subscription_plans
      add constraint subscription_plans_account_type_check
      check (account_type in ('employer', 'candidate'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. EXTEND CANDIDATE PLANS TABLE
-- ----------------------------------------------------------------------------
alter table public.candidate_plans
  add column if not exists price_quarterly numeric(10, 2) not null default 0,
  add column if not exists price_yearly numeric(10, 2) not null default 0,
  add column if not exists account_type text not null default 'candidate';

-- Update candidate plans with quarterly and yearly pricing
update public.candidate_plans
set
  price_monthly = 0,
  price_quarterly = 0,
  price_yearly = 0,
  account_type = 'candidate',
  updated_at = now()
where id = 'free';

update public.candidate_plans
set
  price_monthly = 499,
  price_quarterly = 1349,
  price_yearly = 4799,
  account_type = 'candidate',
  updated_at = now()
where id = 'professional';

update public.candidate_plans
set
  price_monthly = 999,
  price_quarterly = 2699,
  price_yearly = 9599,
  account_type = 'candidate',
  updated_at = now()
where id = 'premium';

-- Add check constraint for account_type on candidate_plans
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'candidate_plans_account_type_check'
      and conrelid = 'public.candidate_plans'::regclass
  ) then
    alter table public.candidate_plans
      add constraint candidate_plans_account_type_check
      check (account_type in ('employer', 'candidate'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3. EXTEND EMPLOYER SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists price numeric(10, 2) not null default 0,
  add column if not exists currency text not null default 'INR',
  add column if not exists account_type text not null default 'employer';

-- Backfill price on subscriptions from plan price_monthly
update public.subscriptions s
set
  price = coalesce((
    select sp.price_monthly from public.subscription_plans sp where sp.id = s.plan_id
  ), 0),
  currency = 'INR',
  account_type = 'employer'
where s.price = 0;

-- Update billing_cycle check constraint on public.subscriptions
alter table public.subscriptions
  drop constraint if exists subscriptions_billing_cycle_check;

alter table public.subscriptions
  add constraint subscriptions_billing_cycle_check
  check (billing_cycle in ('monthly', 'quarterly', 'yearly'));

-- Update status check constraint on public.subscriptions
alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending', 'active', 'trialing', 'past_due', 'cancelled', 'expired'));

-- ----------------------------------------------------------------------------
-- 4. EXTEND CANDIDATE SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
alter table public.candidate_subscriptions
  add column if not exists price numeric(10, 2) not null default 0,
  add column if not exists account_type text not null default 'candidate';

-- Backfill price from price_monthly
update public.candidate_subscriptions cs
set
  price = coalesce(cs.price_monthly, 0),
  account_type = 'candidate'
where cs.price = 0;

-- Update billing_cycle check constraint on public.candidate_subscriptions
alter table public.candidate_subscriptions
  drop constraint if exists candidate_subscriptions_billing_cycle_check;

alter table public.candidate_subscriptions
  add constraint candidate_subscriptions_billing_cycle_check
  check (billing_cycle in ('monthly', 'quarterly', 'yearly'));

-- Update status check constraint on public.candidate_subscriptions
alter table public.candidate_subscriptions
  drop constraint if exists candidate_subscriptions_status_check;

alter table public.candidate_subscriptions
  add constraint candidate_subscriptions_status_check
  check (status in ('pending', 'active', 'trialing', 'past_due', 'cancelled', 'expired'));

-- ----------------------------------------------------------------------------
-- 5. PAYMENT REQUESTS TABLE (SHARED FOUNDATION)
-- ----------------------------------------------------------------------------
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('candidate', 'employer')),
  user_id uuid references auth.users(id) on delete set null,
  candidate_id uuid references public.candidate_profiles(id) on delete set null,
  company_id uuid references public.company_profiles(id) on delete set null,
  plan_id text not null,
  billing_cycle text not null check (billing_cycle in ('monthly', 'quarterly', 'yearly')),
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  customer_name text not null,
  email text not null,
  whatsapp_number text not null,
  company_name text,
  status text not null default 'pending'
    check (status in ('pending', 'payment_link_sent', 'payment_received', 'cancelled')),
  notes text,
  requested_at timestamptz not null default now(),
  payment_link_sent_at timestamptz,
  payment_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for payment requests
create index if not exists idx_payment_requests_user_id
  on public.payment_requests (user_id);

create index if not exists idx_payment_requests_candidate_id
  on public.payment_requests (candidate_id);

create index if not exists idx_payment_requests_company_id
  on public.payment_requests (company_id);

create index if not exists idx_payment_requests_account_type
  on public.payment_requests (account_type);

create index if not exists idx_payment_requests_status
  on public.payment_requests (status);

create index if not exists idx_payment_requests_created_at
  on public.payment_requests (created_at desc);

-- Additional indexes for subscriptions
create index if not exists idx_subscriptions_company_id
  on public.subscriptions (company_id);

create index if not exists idx_subscriptions_status
  on public.subscriptions (status);

create index if not exists idx_subscriptions_end_date
  on public.subscriptions (current_period_end);

create index if not exists idx_candidate_subscriptions_candidate_id
  on public.candidate_subscriptions (candidate_id);

create index if not exists idx_candidate_subscriptions_status
  on public.candidate_subscriptions (status);

create index if not exists idx_candidate_subscriptions_end_date
  on public.candidate_subscriptions (current_period_end);

-- Updated_at trigger for payment requests
drop trigger if exists payment_requests_set_updated_at on public.payment_requests;
create trigger payment_requests_set_updated_at
  before update on public.payment_requests
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) FOR PAYMENT REQUESTS & PLANS
-- ----------------------------------------------------------------------------
alter table public.payment_requests enable row level security;
alter table public.payment_requests force row level security;

-- Candidates can view their own payment requests
drop policy if exists "Candidates can view own payment requests" on public.payment_requests;
create policy "Candidates can view own payment requests"
  on public.payment_requests
  for select
  to authenticated
  using (
    account_type = 'candidate'
    and (
      candidate_id = (select public.current_candidate_id())
      or user_id = auth.uid()
    )
  );

-- Employers can view their company payment requests
drop policy if exists "Employers can view company payment requests" on public.payment_requests;
create policy "Employers can view company payment requests"
  on public.payment_requests
  for select
  to authenticated
  using (
    account_type = 'employer'
    and (
      company_id = public.current_company_id()
      or user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert a pending payment request matching their identity
drop policy if exists "Users can insert own pending payment requests" on public.payment_requests;
create policy "Users can insert own pending payment requests"
  on public.payment_requests
  for insert
  to authenticated
  with check (
    status = 'pending'
    and user_id = auth.uid()
    and (
      (account_type = 'candidate' and candidate_id = (select public.current_candidate_id()))
      or
      (account_type = 'employer' and company_id = public.current_company_id())
    )
  );

-- Revoke mutation rights (update/delete) from regular clients so users cannot mark payments as received
revoke update, delete on table public.payment_requests from anon, authenticated;
grant select, insert on table public.payment_requests to authenticated;

-- Ensure plans are readable by all authenticated / anon
grant select on table public.subscription_plans to anon, authenticated;
grant select on table public.candidate_plans to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. SECURITY DEFINER RPCs FOR PAYMENT REQUEST CREATION
-- ----------------------------------------------------------------------------

-- RPC: Create Candidate Payment Request
create or replace function public.create_candidate_payment_request(
  p_plan_id text,
  p_billing_cycle text,
  p_whatsapp_number text,
  p_customer_name text default null,
  p_email text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_candidate_id uuid;
  v_user_id uuid;
  v_plan record;
  v_amount numeric(10, 2);
  v_customer_name text;
  v_email text;
  v_request_id uuid;
  v_new_row record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  v_candidate_id := public.current_candidate_id();
  if v_candidate_id is null then
    raise exception 'CANDIDATE_PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_billing_cycle not in ('monthly', 'quarterly', 'yearly') then
    raise exception 'INVALID_BILLING_CYCLE' using errcode = '22023';
  end if;

  -- Validate candidate plan
  select * into v_plan
  from public.candidate_plans
  where id = p_plan_id and is_active = true
  limit 1;

  if v_plan.id is null then
    raise exception 'INVALID_CANDIDATE_PLAN' using errcode = '22023';
  end if;

  -- Calculate snapshotted price based on billing cycle
  if p_billing_cycle = 'monthly' then
    v_amount := v_plan.price_monthly;
  elsif p_billing_cycle = 'quarterly' then
    v_amount := v_plan.price_quarterly;
  elsif p_billing_cycle = 'yearly' then
    v_amount := v_plan.price_yearly;
  end if;

  -- Determine customer name and email
  if p_customer_name is not null and length(trim(p_customer_name)) > 0 then
    v_customer_name := trim(p_customer_name);
  else
    select coalesce(full_name, 'Candidate') into v_customer_name
    from public.candidate_profiles
    where id = v_candidate_id;
  end if;

  if p_email is not null and length(trim(p_email)) > 0 then
    v_email := trim(p_email);
  else
    select email into v_email
    from auth.users
    where id = v_user_id;
  end if;

  if p_whatsapp_number is null or length(trim(p_whatsapp_number)) < 6 then
    raise exception 'INVALID_WHATSAPP_NUMBER' using errcode = '22023';
  end if;

  insert into public.payment_requests (
    account_type,
    user_id,
    candidate_id,
    company_id,
    plan_id,
    billing_cycle,
    amount,
    currency,
    customer_name,
    email,
    whatsapp_number,
    company_name,
    status,
    notes,
    requested_at
  ) values (
    'candidate',
    v_user_id,
    v_candidate_id,
    null,
    v_plan.id,
    p_billing_cycle,
    v_amount,
    v_plan.currency,
    coalesce(v_customer_name, 'Candidate'),
    coalesce(v_email, ''),
    trim(p_whatsapp_number),
    null,
    'pending',
    p_notes,
    now()
  )
  returning * into v_new_row;

  return jsonb_build_object(
    'id', v_new_row.id,
    'accountType', v_new_row.account_type,
    'planId', v_new_row.plan_id,
    'billingCycle', v_new_row.billing_cycle,
    'amount', v_new_row.amount,
    'currency', v_new_row.currency,
    'customerName', v_new_row.customer_name,
    'email', v_new_row.email,
    'whatsappNumber', v_new_row.whatsapp_number,
    'status', v_new_row.status,
    'requestedAt', v_new_row.requested_at
  );
end;
$$;

revoke all on function public.create_candidate_payment_request(text, text, text, text, text, text) from public;
grant execute on function public.create_candidate_payment_request(text, text, text, text, text, text) to authenticated;

-- RPC: Create Employer Payment Request
create or replace function public.create_employer_payment_request(
  p_plan_id text,
  p_billing_cycle text,
  p_whatsapp_number text,
  p_contact_name text default null,
  p_email text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_company_id uuid;
  v_user_id uuid;
  v_plan record;
  v_amount numeric(10, 2);
  v_company_name text;
  v_contact_name text;
  v_email text;
  v_new_row record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  v_company_id := public.current_company_id();
  if v_company_id is null then
    raise exception 'COMPANY_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_billing_cycle not in ('monthly', 'quarterly', 'yearly') then
    raise exception 'INVALID_BILLING_CYCLE' using errcode = '22023';
  end if;

  -- Validate employer plan
  select * into v_plan
  from public.subscription_plans
  where id = p_plan_id and is_active = true and account_type = 'employer'
  limit 1;

  if v_plan.id is null then
    raise exception 'INVALID_EMPLOYER_PLAN' using errcode = '22023';
  end if;

  -- Calculate snapshotted price based on billing cycle
  if p_billing_cycle = 'monthly' then
    v_amount := v_plan.price_monthly;
  elsif p_billing_cycle = 'quarterly' then
    v_amount := v_plan.price_quarterly;
  elsif p_billing_cycle = 'yearly' then
    v_amount := v_plan.price_yearly;
  end if;

  -- Get company name
  select coalesce(name, 'Company') into v_company_name
  from public.company_profiles
  where id = v_company_id;

  -- Determine contact name and email
  if p_contact_name is not null and length(trim(p_contact_name)) > 0 then
    v_contact_name := trim(p_contact_name);
  else
    select coalesce(p.full_name, 'Employer Contact') into v_contact_name
    from public.profiles p
    where p.id = v_user_id;
  end if;

  if p_email is not null and length(trim(p_email)) > 0 then
    v_email := trim(p_email);
  else
    select email into v_email
    from auth.users
    where id = v_user_id;
  end if;

  if p_whatsapp_number is null or length(trim(p_whatsapp_number)) < 6 then
    raise exception 'INVALID_WHATSAPP_NUMBER' using errcode = '22023';
  end if;

  insert into public.payment_requests (
    account_type,
    user_id,
    candidate_id,
    company_id,
    plan_id,
    billing_cycle,
    amount,
    currency,
    customer_name,
    email,
    whatsapp_number,
    company_name,
    status,
    notes,
    requested_at
  ) values (
    'employer',
    v_user_id,
    null,
    v_company_id,
    v_plan.id,
    p_billing_cycle,
    v_amount,
    v_plan.currency,
    coalesce(v_contact_name, 'Employer Contact'),
    coalesce(v_email, ''),
    trim(p_whatsapp_number),
    v_company_name,
    'pending',
    p_notes,
    now()
  )
  returning * into v_new_row;

  return jsonb_build_object(
    'id', v_new_row.id,
    'accountType', v_new_row.account_type,
    'companyId', v_new_row.company_id,
    'companyName', v_new_row.company_name,
    'planId', v_new_row.plan_id,
    'billingCycle', v_new_row.billing_cycle,
    'amount', v_new_row.amount,
    'currency', v_new_row.currency,
    'customerName', v_new_row.customer_name,
    'email', v_new_row.email,
    'whatsappNumber', v_new_row.whatsapp_number,
    'status', v_new_row.status,
    'requestedAt', v_new_row.requested_at
  );
end;
$$;

revoke all on function public.create_employer_payment_request(text, text, text, text, text, text) from public;
grant execute on function public.create_employer_payment_request(text, text, text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 8. UPDATE RPC: get_candidate_subscription_overview (ENRICH WITH BILLING CYCLES)
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
      'priceQuarterly', cp.price_quarterly,
      'priceYearly', cp.price_yearly,
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
        'price', v_sub.price,
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
      'priceQuarterly', v_plan_def.price_quarterly,
      'priceYearly', v_plan_def.price_yearly,
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
