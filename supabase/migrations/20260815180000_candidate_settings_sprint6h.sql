-- ============================================================================
-- Sprint 6 Phase H: Candidate Settings Supabase Integration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CANDIDATE SETTINGS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.candidate_settings (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.candidate_profiles (id) on delete cascade,
  notification_preferences jsonb not null default '{
    "emailNotifications": true,
    "pushNotifications": true,
    "jobAlerts": true,
    "applicationUpdates": true,
    "recruiterMessages": true,
    "interviewReminders": true,
    "platformUpdates": false,
    "jobAlertFrequency": "daily"
  }'::jsonb,
  job_preferences jsonb not null default '{
    "preferredJobRoles": ["SAP UI5 Developer", "SAP Fiori Consultant"],
    "preferredSapModules": ["SAP UI5", "SAP Fiori", "SAP BTP"],
    "preferredLocations": ["Bangalore", "Hyderabad", "Remote"],
    "workModes": ["Hybrid", "Remote"],
    "employmentTypes": ["Full-time"],
    "careerLevel": "Senior",
    "preferredSalaryRange": "₹18,00,000 - ₹26,00,000 / year"
  }'::jsonb,
  privacy_preferences jsonb not null default '{
    "profileVisibility": "public",
    "showInTalentSearch": true,
    "showResumeToRecruiters": true
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookup by candidate_id
create index if not exists candidate_settings_candidate_id_idx
  on public.candidate_settings (candidate_id);

-- Automated updated_at trigger
drop trigger if exists candidate_settings_set_updated_at on public.candidate_settings;
create trigger candidate_settings_set_updated_at
  before update on public.candidate_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table public.candidate_settings enable row level security;

-- Candidates can view only their own settings
drop policy if exists "Candidates can select own settings" on public.candidate_settings;
create policy "Candidates can select own settings"
  on public.candidate_settings for select
  to authenticated
  using (candidate_id = public.current_candidate_id());

-- Candidates can insert only their own settings
drop policy if exists "Candidates can insert own settings" on public.candidate_settings;
create policy "Candidates can insert own settings"
  on public.candidate_settings for insert
  to authenticated
  with check (candidate_id = public.current_candidate_id());

-- Candidates can update only their own settings
drop policy if exists "Candidates can update own settings" on public.candidate_settings;
create policy "Candidates can update own settings"
  on public.candidate_settings for update
  to authenticated
  using (candidate_id = public.current_candidate_id())
  with check (candidate_id = public.current_candidate_id());

-- Candidates can delete only their own settings
drop policy if exists "Candidates can delete own settings" on public.candidate_settings;
create policy "Candidates can delete own settings"
  on public.candidate_settings for delete
  to authenticated
  using (candidate_id = public.current_candidate_id());

-- Revoke anon access and grant authenticated permissions
revoke all on public.candidate_settings from anon;
grant select, insert, update, delete on public.candidate_settings to authenticated;
