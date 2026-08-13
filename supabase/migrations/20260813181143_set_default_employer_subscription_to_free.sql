-- The original subscription rollout backfilled existing companies onto Pro to
-- preserve its mock UI. Billing is not implemented, so unbilled Pro records
-- are seed data and should use the real default Free plan.
update public.subscriptions
set
  plan_id = 'free',
  status = 'active',
  trial_ends_at = null,
  updated_at = now()
where plan_id = 'pro'
  and payment_method_configured = false;

-- Keep registration provisioning explicit and idempotent.
create or replace function public.create_default_subscription_for_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.subscriptions (
    company_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    renewal_date,
    next_billing_date
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
