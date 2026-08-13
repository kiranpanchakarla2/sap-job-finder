-- Align subscription_plans with India-first INR pricing and updated job limits.
update public.subscription_plans
set
  price_monthly = 0,
  max_active_jobs = 5
where id = 'free';

update public.subscription_plans
set
  price_monthly = 1999,
  max_active_jobs = 25
where id = 'pro';

update public.subscription_plans
set
  price_monthly = 5999,
  max_active_jobs = null
where id = 'business';
