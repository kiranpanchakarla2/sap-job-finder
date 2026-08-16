# Contact Us Foundation — Architecture & Developer Documentation

## 1. Overview & Architecture

The **Contact Us Foundation** (Sprint 8A) provides a unified, secure, and extensible backend for all support and contact inquiries across **SAP Jobs Finder**. It is built on PostgreSQL with Row Level Security (RLS) in Supabase and supports three primary user personas today, plus future Super Admin support operations:

1. **Public / Anonymous Users** (Sprint 8B): External visitors inquiring about partnerships, reporting issues, or general queries.
2. **Candidate Users** (Sprint 8C): Authenticated job seekers needing assistance with profiles, resumes, job applications, or candidate subscriptions.
3. **Employer Users** (Sprint 8D): Authenticated recruiters and hiring managers needing help with job postings, bulk uploads, talent search, team seats, or employer subscriptions.
4. **Future Super Admin Support Center** (Sprint 8F): Internal admin dashboard for ticket triage, assignment, status tracking, internal notes, and replies.

---

## 2. Database Schema (`contact_requests`)

```sql
create table public.contact_requests (
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
  updated_at timestamptz not null default now()
);
```

### Constraints:
* `user_type`: `check (user_type in ('anonymous', 'candidate', 'employer'))`
* `status`: `check (status in ('new', 'in_progress', 'resolved', 'closed'))`
* `priority`: `check (priority in ('low', 'normal', 'high', 'urgent'))`
* `category`: Controlled set of 15 standard categories.
* `email`: Non-empty regex-validated email format (`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`).
* `name`, `subject`, `message`: Non-empty strings after trimming.
* `attachment_size`: Nullable non-negative integer (`attachment_size >= 0`).

---

## 3. Categories, User Types, Statuses, and Priorities

### User Types:
* `anonymous`: Unauthenticated visitors (`user_id = null`, `company_id = null`).
* `candidate`: Authenticated job seekers (`user_id = auth.uid()`, `company_id = null`).
* `employer`: Authenticated employer members (`user_id = auth.uid()`, `company_id = current_company_id()`).

### Categories & Portal Segmentation:

All 15 categories are stored centrally in `CONTACT_REQUEST_CATEGORIES` within `@/lib/constants`:

| Category Key | Label | Public (8B) | Candidate (8C) | Employer (8D) |
|---|---|:---:|:---:|:---:|
| `general` | General Inquiry | ✅ | — | — |
| `candidate_support` | Candidate Support | — | ✅ | — |
| `employer_support` | Employer Support | — | — | ✅ |
| `account` | Account & Login | ✅ | ✅ | — |
| `job_application` | Job Applications | — | ✅ | — |
| `job_posting` | Job Postings | — | — | ✅ |
| `bulk_upload` | Bulk Job Import | — | — | ✅ |
| `talent_search` | Talent Search | — | — | ✅ |
| `community` | Community & Events | — | — | — |
| `technical_issue` | Technical Issue / Bug | ✅ | ✅ | ✅ |
| `subscription` | Subscription & Plans | — | ✅ | ✅ |
| `payment` | Billing & Payments | — | — | ✅ |
| `report_problem` | Report a Problem / Abuse | ✅ | ✅ | ✅ |
| `partnership` | Partnerships & Media | ✅ | — | — |
| `other` | Other | ✅ | ✅ | ✅ |

### Status Lifecycle:
* `new` (Default): Newly submitted request awaiting triage.
* `in_progress`: Assigned or actively being addressed by support team.
* `resolved`: Resolution provided to submitter.
* `closed`: Inquiry finalized and closed.

### Priorities:
* `low`, `normal` (Default), `high`, `urgent`.

---

## 4. Row Level Security (RLS) & Anti-Spoofing Model

Row Level Security is enabled on `public.contact_requests`:

### 1. Anonymous Users:
* **INSERT**: Allowed with `with check (user_id is null and company_id is null and user_type = 'anonymous')`.
* **SELECT / UPDATE / DELETE**: Denied. Anonymous users cannot query the table, preventing automated scraping or email enumeration.

### 2. Candidate Users:
* **INSERT**: Allowed with `with check (user_id = auth.uid())`.
* **SELECT**: Restricted to own requests: `using (user_id = auth.uid() and user_type = 'candidate')`.
* **UPDATE / DELETE**: Denied.

### 3. Employer Users:
* **INSERT**: Allowed with `with check (user_id = auth.uid())`.
* **SELECT**: Restricted to company requests: `using (user_type = 'employer' and (company_id = public.current_company_id() or user_id = auth.uid()))`.
* **UPDATE / DELETE**: Denied.

### 4. Admin Users (Future Sprint 8F):
* **SELECT / UPDATE / DELETE**: Enabled for `public.current_app_role() = 'admin'`.

### Database Anti-Spoofing Trigger (`contact_requests_sanitize_user_insert`):
Before an insert is committed, the trigger:
1. Resets `status := 'new'` and `priority := 'normal'` (ignoring client-provided overrides).
2. Sets `assigned_to := null` and `admin_notes := null`.
3. Derives `user_id`, `company_id`, and `user_type` from the trusted server-side authentication context (`auth.uid()`, `profiles.role`, and `public.current_company_id()`).

---

## 5. Rate Limiting & Abuse Prevention Foundation

1. **Database Rate Limit Trigger**: The `contact_requests_sanitize_user_insert` trigger checks recent submissions from the same email in the past 10 minutes. If the count exceeds 10, it raises a PostgreSQL exception:
   `'Submission rate limit exceeded. Please wait a few minutes before submitting another request.'`
2. **Indexing**: Indexed on `(email, created_at desc)` for sub-millisecond throttle lookups.
3. **CAPTCHA Extension Point**: The service layer (`createContactRequest`) is designed to accept an optional verification token (e.g. Cloudflare Turnstile / reCAPTCHA) in Sprint 8B without altering database constraints.

---

## 6. Private Attachment Storage (`contact-attachments`)

* **Bucket Name**: `contact-attachments`
* **Visibility**: **Private** (`public = false`). Direct public URLs are disallowed.
* **Size Limit**: 10 MB (`10485760` bytes).
* **Allowed MIME Types**: PDF, PNG, JPG/JPEG, DOC/DOCX, XLS/XLSX, TXT.
* **Storage Folder Structure**:
  * Authenticated: `{auth.uid()}/{uuid}-{filename}`
  * Anonymous: `anonymous/{uuid}/{filename}`
* **Storage RLS**:
  * Authenticated users can only read, upload, and delete objects within their own `{auth.uid()}` prefix.
  * Anonymous users can upload into `anonymous/`, but cannot read back or list objects.
  * Admins have full read access for support triage.

---

## 7. Service Layer API (`src/services/contactService.ts`)

* `createContactRequest(input: ContactRequestInsertInput): Promise<ContactRequestResult>`
* `getMyContactRequests(): Promise<{ success: boolean; data?: ContactRequest[]; error?: string }>`
* `getContactRequestById(id: string): Promise<{ success: boolean; data?: ContactRequest | null; error?: string }>`
* `uploadContactAttachment(file: File, options?: { isAnonymous?: boolean }): Promise<ContactAttachmentUploadResult>`

---

## 8. Sprints 8B–8F Consumption Guide

* **Sprint 8B (Public Contact Us UI)**:
  * Consumes `PUBLIC_CONTACT_CATEGORIES` from `@/lib/constants`.
  * Calls `createContactRequest` with `user_type: "anonymous"`.
  * Allows anonymous file uploads via `uploadContactAttachment({ isAnonymous: true })`.
* **Sprint 8C (Candidate Contact Us UI)**:
  * Consumes `CANDIDATE_CONTACT_CATEGORIES`.
  * Pre-fills candidate name and email from candidate profile.
  * Lists previous submissions using `getMyContactRequests()`.
* **Sprint 8D (Employer Contact Us UI)**:
  * Consumes `EMPLOYER_CONTACT_CATEGORIES`.
  * Pre-fills recruiter name, work email, and company details.
  * Automatically associates submission with the active employer `company_id`.
* **Sprint 8E (Support Operations Backend)**:
  * Established `contact_request_notes` and `contact_request_events` (immutable audit trail).
  * Automated audit triggers capturing request creation, status changes, priority changes, assignments, and notes.
  * Privileged support RPCs with GIN full-text search, multi-field filtering, sorting, pagination, and multi-tenant context resolution.
  * See [Support Operations Backend Documentation](file:///Users/Kiran.Panchakarla/sap-job-finder/docs/support-operations-backend.md) for full details.
* **Sprint 8F (Super Admin Support Center UI)**:
  * Consumes `SupportRequestService` and the Sprint 8E backend foundation.
  * Ticket triage inbox, filters, status transitions, agent assignment, private note threads, and audit event visual timelines.
