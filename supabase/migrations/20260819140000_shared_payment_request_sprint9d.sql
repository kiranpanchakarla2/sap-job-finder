-- ============================================================================
-- Sprint 9D: Shared Manual Payment Request Workflow & Hardening
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND PAYMENT_REQUESTS TABLE WITH SNAPSHOT, EXPIRATION & AUDIT FIELDS
-- ----------------------------------------------------------------------------
alter table public.payment_requests
  add column if not exists plan_name text,
  add column if not exists expires_at timestamptz not null default (now() + interval '7 days'),
  add column if not exists payment_link text,
  add column if not exists cancelled_at timestamptz;

-- Backfill plan_name and expires_at on existing records
update public.payment_requests
set
  expires_at = coalesce(expires_at, requested_at + interval '7 days'),
  plan_name = coalesce(
    plan_name,
    case
      when account_type = 'candidate' then (
        select cp.name from public.candidate_plans cp where cp.id = payment_requests.plan_id limit 1
      )
      when account_type = 'employer' then (
        select sp.name from public.subscription_plans sp where sp.id = payment_requests.plan_id limit 1
      )
      else plan_id
    end,
    plan_id
  )
where expires_at is null or plan_name is null;

-- Ensure plan_name has a non-null fallback
update public.payment_requests
set plan_name = plan_id
where plan_name is null;

-- ----------------------------------------------------------------------------
-- 2. INDEXES FOR ACTIVE REQUEST LOOKUPS, EXPIRATION & ACCOUNT ISOLATION
-- ----------------------------------------------------------------------------
create index if not exists idx_payment_requests_expires_at
  on public.payment_requests (expires_at);

create index if not exists idx_payment_requests_candidate_active_lookup
  on public.payment_requests (candidate_id, plan_id, billing_cycle, status);

create index if not exists idx_payment_requests_company_active_lookup
  on public.payment_requests (company_id, plan_id, billing_cycle, status);

create index if not exists idx_payment_requests_status_expires
  on public.payment_requests (status, expires_at);

-- ----------------------------------------------------------------------------
-- 3. HARDENED SECURITY DEFINER RPC: create_candidate_payment_request
-- ----------------------------------------------------------------------------
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
  v_expires_at timestamptz;
  v_existing_req record;
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

  -- Calculate snapshotted authoritative price based on billing cycle
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
    select nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '') into v_customer_name
    from public.candidate_profiles
    where id = v_candidate_id;

    if v_customer_name is null then
      select nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '') into v_customer_name
      from public.profiles
      where id = v_user_id;
    end if;

    if v_customer_name is null then
      v_customer_name := 'Candidate';
    end if;
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

  -- Duplicate Request Protection:
  -- Check for existing non-expired pending or payment_link_sent request for the same plan & cycle
  select * into v_existing_req
  from public.payment_requests
  where candidate_id = v_candidate_id
    and plan_id = v_plan.id
    and billing_cycle = p_billing_cycle
    and status in ('pending', 'payment_link_sent')
    and (expires_at is null or expires_at > now())
  order by requested_at desc
  limit 1;

  if v_existing_req.id is not null then
    return jsonb_build_object(
      'id', v_existing_req.id,
      'accountType', v_existing_req.account_type,
      'candidateId', v_existing_req.candidate_id,
      'planId', v_existing_req.plan_id,
      'planName', coalesce(v_existing_req.plan_name, v_plan.name),
      'billingCycle', v_existing_req.billing_cycle,
      'amount', v_existing_req.amount,
      'currency', v_existing_req.currency,
      'customerName', v_existing_req.customer_name,
      'email', v_existing_req.email,
      'whatsappNumber', v_existing_req.whatsapp_number,
      'status', v_existing_req.status,
      'requestedAt', v_existing_req.requested_at,
      'expiresAt', v_existing_req.expires_at,
      'isExisting', true
    );
  end if;

  v_expires_at := now() + interval '7 days';

  -- Insert new pending payment request with authoritative snapshots
  insert into public.payment_requests (
    account_type,
    user_id,
    candidate_id,
    company_id,
    plan_id,
    plan_name,
    billing_cycle,
    amount,
    currency,
    customer_name,
    email,
    whatsapp_number,
    company_name,
    status,
    notes,
    requested_at,
    expires_at
  ) values (
    'candidate',
    v_user_id,
    v_candidate_id,
    null,
    v_plan.id,
    v_plan.name,
    p_billing_cycle,
    v_amount,
    v_plan.currency,
    coalesce(v_customer_name, 'Candidate'),
    coalesce(v_email, ''),
    trim(p_whatsapp_number),
    null,
    'pending',
    p_notes,
    now(),
    v_expires_at
  )
  returning * into v_new_row;

  return jsonb_build_object(
    'id', v_new_row.id,
    'accountType', v_new_row.account_type,
    'candidateId', v_new_row.candidate_id,
    'planId', v_new_row.plan_id,
    'planName', v_new_row.plan_name,
    'billingCycle', v_new_row.billing_cycle,
    'amount', v_new_row.amount,
    'currency', v_new_row.currency,
    'customerName', v_new_row.customer_name,
    'email', v_new_row.email,
    'whatsappNumber', v_new_row.whatsapp_number,
    'status', v_new_row.status,
    'requestedAt', v_new_row.requested_at,
    'expiresAt', v_new_row.expires_at,
    'isExisting', false
  );
end;
$$;

revoke all on function public.create_candidate_payment_request(text, text, text, text, text, text) from public;
grant execute on function public.create_candidate_payment_request(text, text, text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. HARDENED SECURITY DEFINER RPC: create_employer_payment_request
-- ----------------------------------------------------------------------------
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
  v_expires_at timestamptz;
  v_existing_req record;
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

  -- Verify Company Admin (owner or admin role in employer_accounts or founder)
  if not public.is_company_owner_or_admin() then
    raise exception 'FORBIDDEN_NOT_COMPANY_ADMIN' using errcode = '42501';
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

  -- Calculate snapshotted authoritative price based on billing cycle
  if p_billing_cycle = 'monthly' then
    v_amount := v_plan.price_monthly;
  elsif p_billing_cycle = 'quarterly' then
    v_amount := v_plan.price_quarterly;
  elsif p_billing_cycle = 'yearly' then
    v_amount := v_plan.price_yearly;
  end if;

  -- Get company name
  select coalesce(company_name, 'Company') into v_company_name
  from public.company_profiles
  where id = v_company_id;

  if v_company_name is null then
    select coalesce(name, 'Company') into v_company_name
    from public.company_profiles
    where id = v_company_id;
  end if;

  -- Determine contact name and email
  if p_contact_name is not null and length(trim(p_contact_name)) > 0 then
    v_contact_name := trim(p_contact_name);
  else
    select nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') into v_contact_name
    from public.profiles p
    where p.id = v_user_id;

    if v_contact_name is null then
      v_contact_name := 'Employer Contact';
    end if;
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

  -- Duplicate Request Protection:
  -- Check for existing non-expired pending or payment_link_sent request for the same plan & cycle
  select * into v_existing_req
  from public.payment_requests
  where company_id = v_company_id
    and plan_id = v_plan.id
    and billing_cycle = p_billing_cycle
    and status in ('pending', 'payment_link_sent')
    and (expires_at is null or expires_at > now())
  order by requested_at desc
  limit 1;

  if v_existing_req.id is not null then
    return jsonb_build_object(
      'id', v_existing_req.id,
      'accountType', v_existing_req.account_type,
      'companyId', v_existing_req.company_id,
      'companyName', v_existing_req.company_name,
      'planId', v_existing_req.plan_id,
      'planName', coalesce(v_existing_req.plan_name, v_plan.name),
      'billingCycle', v_existing_req.billing_cycle,
      'amount', v_existing_req.amount,
      'currency', v_existing_req.currency,
      'customerName', v_existing_req.customer_name,
      'email', v_existing_req.email,
      'whatsappNumber', v_existing_req.whatsapp_number,
      'status', v_existing_req.status,
      'requestedAt', v_existing_req.requested_at,
      'expiresAt', v_existing_req.expires_at,
      'isExisting', true
    );
  end if;

  v_expires_at := now() + interval '7 days';

  -- Insert new pending payment request with authoritative snapshots
  insert into public.payment_requests (
    account_type,
    user_id,
    candidate_id,
    company_id,
    plan_id,
    plan_name,
    billing_cycle,
    amount,
    currency,
    customer_name,
    email,
    whatsapp_number,
    company_name,
    status,
    notes,
    requested_at,
    expires_at
  ) values (
    'employer',
    v_user_id,
    null,
    v_company_id,
    v_plan.id,
    v_plan.name,
    p_billing_cycle,
    v_amount,
    v_plan.currency,
    coalesce(v_contact_name, 'Employer Contact'),
    coalesce(v_email, ''),
    trim(p_whatsapp_number),
    v_company_name,
    'pending',
    p_notes,
    now(),
    v_expires_at
  )
  returning * into v_new_row;

  return jsonb_build_object(
    'id', v_new_row.id,
    'accountType', v_new_row.account_type,
    'companyId', v_new_row.company_id,
    'companyName', v_new_row.company_name,
    'planId', v_new_row.plan_id,
    'planName', v_new_row.plan_name,
    'billingCycle', v_new_row.billing_cycle,
    'amount', v_new_row.amount,
    'currency', v_new_row.currency,
    'customerName', v_new_row.customer_name,
    'email', v_new_row.email,
    'whatsappNumber', v_new_row.whatsapp_number,
    'status', v_new_row.status,
    'requestedAt', v_new_row.requested_at,
    'expiresAt', v_new_row.expires_at,
    'isExisting', false
  );
end;
$$;

revoke all on function public.create_employer_payment_request(text, text, text, text, text, text) from public;
grant execute on function public.create_employer_payment_request(text, text, text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. UNIFIED SECURITY DEFINER RPC: create_payment_request
-- ----------------------------------------------------------------------------
create or replace function public.create_payment_request(
  p_account_type text,
  p_plan_id text,
  p_billing_cycle text,
  p_whatsapp_number text,
  p_customer_name text default null,
  p_email text default null,
  p_company_name text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if p_account_type = 'candidate' then
    return public.create_candidate_payment_request(
      p_plan_id => p_plan_id,
      p_billing_cycle => p_billing_cycle,
      p_whatsapp_number => p_whatsapp_number,
      p_customer_name => p_customer_name,
      p_email => p_email,
      p_notes => p_notes
    );
  elsif p_account_type = 'employer' then
    return public.create_employer_payment_request(
      p_plan_id => p_plan_id,
      p_billing_cycle => p_billing_cycle,
      p_whatsapp_number => p_whatsapp_number,
      p_contact_name => p_customer_name,
      p_email => p_email,
      p_notes => p_notes
    );
  else
    raise exception 'INVALID_ACCOUNT_TYPE' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.create_payment_request(text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_payment_request(text, text, text, text, text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. REINFORCE RLS AND PERMISSIONS
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

-- Revoke mutation rights from regular clients
revoke update, delete on table public.payment_requests from anon, authenticated;
grant select, insert on table public.payment_requests to authenticated;
