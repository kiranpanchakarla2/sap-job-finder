-- ============================================================================
-- Sprint 10D: Subscription Plan Management Migration
-- Extends candidate_plans and subscription_plans tables, configures Super Admin
-- RLS policies, and introduces RPCs for usage tracking.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND CANDIDATE PLANS TABLE
-- ----------------------------------------------------------------------------
alter table public.candidate_plans
  add column if not exists duration_value integer not null default 1,
  add column if not exists duration_unit text not null default 'months';

-- ----------------------------------------------------------------------------
-- 2. EXTEND EMPLOYER SUBSCRIPTION PLANS TABLE
-- ----------------------------------------------------------------------------
alter table public.subscription_plans
  add column if not exists duration_value integer not null default 1,
  add column if not exists duration_unit text not null default 'months',
  add column if not exists tagline text not null default '',
  add column if not exists badge text,
  add column if not exists highlighted boolean not null default false,
  add column if not exists feature_flags text[] not null default '{}'::text[];

-- Update trigger for updated_at on subscription_plans
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'tr_subscription_plans_updated_at'
  ) then
    create trigger tr_subscription_plans_updated_at
      before update on public.subscription_plans
      for each row
      execute function public.set_updated_at();
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3. RLS POLICIES FOR CANDIDATE PLANS (public.candidate_plans)
-- ----------------------------------------------------------------------------
alter table public.candidate_plans enable row level security;

-- Drop old select policy if exists
drop policy if exists "Anyone can read active candidate plans" on public.candidate_plans;
drop policy if exists "Super admins can view all candidate plans" on public.candidate_plans;
drop policy if exists "Super admins can insert candidate plans" on public.candidate_plans;
drop policy if exists "Super admins can update candidate plans" on public.candidate_plans;
drop policy if exists "Super admins can delete candidate plans" on public.candidate_plans;

-- Select: Public/regular users can read active plans, Super Admins can read all plans
create policy "Super admins and users can read candidate plans"
  on public.candidate_plans
  for select
  to authenticated, anon
  using (is_active = true or public.is_admin_or_super_admin());

-- Insert: Super Admins only
create policy "Super admins can insert candidate plans"
  on public.candidate_plans
  for insert
  to authenticated
  with check (public.is_admin_or_super_admin());

-- Update: Super Admins only
create policy "Super admins can update candidate plans"
  on public.candidate_plans
  for update
  to authenticated
  using (public.is_admin_or_super_admin())
  with check (public.is_admin_or_super_admin());

-- Delete: Super Admins only (for testing / cleanup of unreferenced plans)
create policy "Super admins can delete candidate plans"
  on public.candidate_plans
  for delete
  to authenticated
  using (public.is_admin_or_super_admin());

grant select, insert, update, delete on table public.candidate_plans to authenticated;
grant select on table public.candidate_plans to anon;

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES FOR EMPLOYER PLANS (public.subscription_plans)
-- ----------------------------------------------------------------------------
alter table public.subscription_plans enable row level security;

-- Drop old policies
drop policy if exists "Authenticated can read subscription plans" on public.subscription_plans;
drop policy if exists "Anyone can view active employer plans" on public.subscription_plans;
drop policy if exists "Super admins and users can read employer plans" on public.subscription_plans;
drop policy if exists "Super admins can insert subscription plans" on public.subscription_plans;
drop policy if exists "Super admins can update subscription plans" on public.subscription_plans;
drop policy if exists "Super admins can delete subscription plans" on public.subscription_plans;

-- Select: Public/regular users can read active plans, Super Admins can read all plans
create policy "Super admins and users can read employer plans"
  on public.subscription_plans
  for select
  to authenticated, anon
  using (is_active = true or public.is_admin_or_super_admin());

-- Insert: Super Admins only
create policy "Super admins can insert subscription plans"
  on public.subscription_plans
  for insert
  to authenticated
  with check (public.is_admin_or_super_admin());

-- Update: Super Admins only
create policy "Super admins can update subscription plans"
  on public.subscription_plans
  for update
  to authenticated
  using (public.is_admin_or_super_admin())
  with check (public.is_admin_or_super_admin());

-- Delete: Super Admins only
create policy "Super admins can delete subscription plans"
  on public.subscription_plans
  for delete
  to authenticated
  using (public.is_admin_or_super_admin());

grant select, insert, update, delete on table public.subscription_plans to authenticated;
grant select on table public.subscription_plans to anon;

-- ----------------------------------------------------------------------------
-- 5. RPCs FOR PLAN USAGE COUNTS
-- ----------------------------------------------------------------------------

-- Candidate plans usage count
create or replace function public.admin_get_candidate_plan_usage_counts()
returns table (
  plan_id text,
  active_count bigint,
  total_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    plan_id,
    count(*) filter (where status in ('active', 'trialing')) as active_count,
    count(*) as total_count
  from public.candidate_subscriptions
  group by plan_id;
$$;

grant execute on function public.admin_get_candidate_plan_usage_counts() to authenticated, anon;

-- Employer plans usage count
create or replace function public.admin_get_employer_plan_usage_counts()
returns table (
  plan_id text,
  active_count bigint,
  total_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    plan_id,
    count(*) filter (where status in ('active', 'trialing')) as active_count,
    count(*) as total_count
  from public.subscriptions
  group by plan_id;
$$;

grant execute on function public.admin_get_employer_plan_usage_counts() to authenticated, anon;
