-- ===========================================================================
-- Sprint 8A: Contact Us Foundation
-- Creates contact_requests table, constraints, indexes, triggers,
-- anti-spoofing / rate-limiting sanitation, RLS policies, and private
-- contact-attachments storage bucket.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) Table Definition: contact_requests
-- ---------------------------------------------------------------------------
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_type text not null default 'anonymous',
  company_id uuid references public.company_profiles (id) on delete set null,
  name text not null,
  email text not null,
  category text not null,
  subject text not null,
  message text not null,
  attachment_url text,
  attachment_name text,
  attachment_size bigint,
  status text not null default 'new',
  priority text not null default 'normal',
  assigned_to uuid references auth.users (id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  constraint contact_requests_user_type_check check (
    user_type in ('anonymous', 'candidate', 'employer')
  ),
  constraint contact_requests_status_check check (
    status in ('new', 'in_progress', 'resolved', 'closed')
  ),
  constraint contact_requests_priority_check check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  constraint contact_requests_category_check check (
    category in (
      'general',
      'candidate_support',
      'employer_support',
      'account',
      'job_application',
      'job_posting',
      'bulk_upload',
      'talent_search',
      'community',
      'technical_issue',
      'subscription',
      'payment',
      'report_problem',
      'partnership',
      'other'
    )
  ),
  constraint contact_requests_name_check check (
    char_length(trim(name)) > 0 and char_length(name) <= 150
  ),
  constraint contact_requests_email_check check (
    char_length(trim(email)) > 0 and
    char_length(email) <= 255 and
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  constraint contact_requests_subject_check check (
    char_length(trim(subject)) > 0 and char_length(subject) <= 250
  ),
  constraint contact_requests_message_check check (
    char_length(trim(message)) > 0 and char_length(message) <= 5000
  ),
  constraint contact_requests_attachment_size_check check (
    attachment_size is null or attachment_size >= 0
  )
);

-- ---------------------------------------------------------------------------
-- 2) Indexes
-- ---------------------------------------------------------------------------
create index if not exists contact_requests_user_id_idx
  on public.contact_requests (user_id);

create index if not exists contact_requests_company_id_idx
  on public.contact_requests (company_id);

create index if not exists contact_requests_user_type_idx
  on public.contact_requests (user_type);

create index if not exists contact_requests_status_idx
  on public.contact_requests (status);

create index if not exists contact_requests_priority_idx
  on public.contact_requests (priority);

create index if not exists contact_requests_category_idx
  on public.contact_requests (category);

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

create index if not exists contact_requests_assigned_to_idx
  on public.contact_requests (assigned_to)
  where assigned_to is not null;

create index if not exists contact_requests_rate_limit_idx
  on public.contact_requests (email, created_at desc);

-- ---------------------------------------------------------------------------
-- 3) Timestamps Trigger
-- ---------------------------------------------------------------------------
drop trigger if exists contact_requests_set_updated_at on public.contact_requests;
create trigger contact_requests_set_updated_at
  before update on public.contact_requests
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4) Anti-Spoofing & Sanitation Trigger
-- ---------------------------------------------------------------------------
create or replace function public.contact_requests_sanitize_user_insert()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_role public.app_role;
  v_company_id uuid;
  v_recent_count integer;
  v_jwt_role text;
begin
  -- Rate limiting: Max 10 submissions in last 10 minutes per email to prevent flood abuse
  select count(*) into v_recent_count
  from public.contact_requests
  where email = lower(trim(new.email))
    and created_at > (now() - interval '10 minutes');

  if v_recent_count >= 10 then
    raise exception 'Submission rate limit exceeded. Please wait a few minutes before submitting another request.';
  end if;

  -- Protect internal fields from client manipulation during normal submission
  new.status := 'new';
  new.priority := 'normal';
  new.assigned_to := null;
  new.admin_notes := null;
  new.email := lower(trim(new.email));
  new.name := trim(new.name);
  new.subject := trim(new.subject);
  new.message := trim(new.message);

  -- Check if this is an administrative/superuser session
  v_jwt_role := current_setting('request.jwt.claim.role', true);

  if current_user in ('postgres', 'service_role') and (v_jwt_role is null or v_jwt_role in ('service_role', 'supabase_admin')) then
    -- Direct Postgres connection / Admin session: preserve specified user_id / user_type / company_id
    if new.user_id is not null then
      if new.user_type is null or new.user_type not in ('candidate', 'employer') then
        new.user_type := 'candidate';
      end if;
    else
      new.user_type := coalesce(new.user_type, 'anonymous');
    end if;
  else
    -- Client / PostgREST session: derive user_id, user_type, and company_id safely from auth context
    if auth.uid() is null then
      -- Anonymous submission
      new.user_id := null;
      new.company_id := null;
      new.user_type := 'anonymous';
    else
      -- Authenticated submission: derive user_id
      new.user_id := auth.uid();

      -- Determine role
      select role into v_role
      from public.profiles
      where user_id = auth.uid()
      limit 1;

      if v_role = 'employer' then
        new.user_type := 'employer';
        v_company_id := public.current_company_id();
        new.company_id := v_company_id;
      else
        new.user_type := 'candidate';
        new.company_id := null;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists contact_requests_sanitize_insert on public.contact_requests;
create trigger contact_requests_sanitize_insert
  before insert on public.contact_requests
  for each row
  execute function public.contact_requests_sanitize_user_insert();

-- ---------------------------------------------------------------------------
-- 5) Row Level Security (RLS)
-- ---------------------------------------------------------------------------
alter table public.contact_requests enable row level security;

-- INSERT Policies
drop policy if exists "Anon can create contact requests" on public.contact_requests;
create policy "Anon can create contact requests"
  on public.contact_requests
  for insert
  to anon
  with check (
    user_id is null and
    company_id is null and
    user_type = 'anonymous'
  );

drop policy if exists "Authenticated can create contact requests" on public.contact_requests;
create policy "Authenticated can create contact requests"
  on public.contact_requests
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
  );

-- SELECT Policies
drop policy if exists "Candidates can read own contact requests" on public.contact_requests;
create policy "Candidates can read own contact requests"
  on public.contact_requests
  for select
  to authenticated
  using (
    user_id = auth.uid() and
    user_type = 'candidate'
  );

drop policy if exists "Employers can read own company contact requests" on public.contact_requests;
create policy "Employers can read own company contact requests"
  on public.contact_requests
  for select
  to authenticated
  using (
    user_type = 'employer' and
    (
      (company_id is not null and company_id = public.current_company_id()) or
      user_id = auth.uid()
    )
  );

drop policy if exists "Admins can read all contact requests" on public.contact_requests;
create policy "Admins can read all contact requests"
  on public.contact_requests
  for select
  to authenticated
  using (
    public.current_app_role() = 'admin'
  );

-- UPDATE Policies (Reserved for Admins only)
drop policy if exists "Admins can update contact requests" on public.contact_requests;
create policy "Admins can update contact requests"
  on public.contact_requests
  for update
  to authenticated
  using (
    public.current_app_role() = 'admin'
  )
  with check (
    public.current_app_role() = 'admin'
  );

-- DELETE Policies (Reserved for Admins only)
drop policy if exists "Admins can delete contact requests" on public.contact_requests;
create policy "Admins can delete contact requests"
  on public.contact_requests
  for delete
  to authenticated
  using (
    public.current_app_role() = 'admin'
  );

-- Grant privileges
revoke all on public.contact_requests from public;
grant insert on public.contact_requests to anon;
grant select, insert on public.contact_requests to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Storage Bucket: contact-attachments (Private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-attachments',
  'contact-attachments',
  false,
  10485760, -- 10MB limit
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS on storage.objects for contact-attachments
drop policy if exists "Authenticated users can upload contact attachments" on storage.objects;
create policy "Authenticated users can upload contact attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'contact-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Anon users can upload contact attachments" on storage.objects;
create policy "Anon users can upload contact attachments"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'contact-attachments'
    and (storage.foldername(name))[1] in ('anon', 'anonymous')
  );

drop policy if exists "Authenticated users can read own contact attachments" on storage.objects;
create policy "Authenticated users can read own contact attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'contact-attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.current_app_role() = 'admin'
    )
  );

drop policy if exists "Authenticated users can delete own contact attachments" on storage.objects;
create policy "Authenticated users can delete own contact attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'contact-attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.current_app_role() = 'admin'
    )
  );
