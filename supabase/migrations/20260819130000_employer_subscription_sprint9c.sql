-- ============================================================================
-- Sprint 9C: Employer Subscription UI & Manual Payment Request
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HARDENED SECURITY DEFINER RPC: create_employer_payment_request
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

  -- Duplicate Request Protection: Check for an existing pending request for this company & plan
  select * into v_existing_req
  from public.payment_requests
  where company_id = v_company_id
    and plan_id = v_plan.id
    and billing_cycle = p_billing_cycle
    and status = 'pending'
    and requested_at >= (now() - interval '15 minutes')
  order by requested_at desc
  limit 1;

  if v_existing_req.id is not null then
    return jsonb_build_object(
      'id', v_existing_req.id,
      'accountType', v_existing_req.account_type,
      'companyId', v_existing_req.company_id,
      'companyName', v_existing_req.company_name,
      'planId', v_existing_req.plan_id,
      'billingCycle', v_existing_req.billing_cycle,
      'amount', v_existing_req.amount,
      'currency', v_existing_req.currency,
      'customerName', v_existing_req.customer_name,
      'email', v_existing_req.email,
      'whatsappNumber', v_existing_req.whatsapp_number,
      'status', v_existing_req.status,
      'requestedAt', v_existing_req.requested_at
    );
  end if;

  -- Insert new pending payment request
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
