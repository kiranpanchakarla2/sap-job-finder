# Contact Us System Architecture & Security Reference

## 1. System Overview

The **SAP Jobs Finder** Contact Us module provides unified customer support and inquiry capabilities across three distinct user roles:
- **Anonymous Visitors**: Public inquiries (`/contact`) with automated anti-spoofing, rate limiting, and private attachment uploads.
- **Candidate Users**: Authenticated candidate support (`/candidate/contact`) with prefilled candidate identity, job application context, and personal inquiry tracking history.
- **Employer Users**: Authenticated employer support (`/employer/contact`) with company identification, recruitment categories (Job Posting, Bulk Upload, Talent Search), and company-wide inquiry tracking history.
- **Support Operations**: Privileged server-side search, filtering, triage, assignment, status lifecycles, and private internal notes.

```text
  Anonymous User                Candidate User                Employer User
   (/contact)              (/candidate/contact)            (/employer/contact)
        │                            │                              │
        ▼                            ▼                              ▼
  Public Contact Form         Candidate Contact Form          Employer Contact Form
        │                            │                              │
        └────────────────────────────┼──────────────────────────────┘
                                     │
                             Zod & MIME Validation
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       Storage (contact-attachments)        Database (contact_requests)
       - Private bucket (public=false)      - RLS Policies
       - User ID / anon folder isolation    - Anti-spoofing sanitation trigger
       - Path traversal protection          - Rate limit (10 reqs / 10 mins)
                     │                               │
                     └───────────────┬───────────────┘
                                     │
                         Support Operations Backend
                         - Immutable audit logs (contact_request_events)
                         - Private internal notes (contact_request_notes)
                         - Admin RPC triage functions (security definer)
                                     │
                         Notification Infrastructure
                         - Idempotent event triggers
                         - Transactional email dispatch (Resend / Console)
                         - HTML entity escaping (XSS prevention)
                         - Notification delivery logs (contact_notification_logs)
```

---

## 2. Database Schema & Tables

### `public.contact_requests`
Primary table storing all submitted contact requests.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | uuid | NO | Primary Key (gen_random_uuid()) |
| `user_id` | uuid | YES | FK to `auth.users(id)` (NULL for anonymous) |
| `user_type` | text | NO | `'anonymous'`, `'candidate'`, or `'employer'` |
| `company_id` | uuid | YES | FK to `public.company_profiles(id)` |
| `name` | text | NO | Submitter's full name (max 150 chars) |
| `email` | text | NO | Submitter's email (validated regex, max 255 chars) |
| `category` | text | NO | Predefined category enum value |
| `subject` | text | NO | Inquiry subject (max 250 chars) |
| `message` | text | NO | Inquiry message body (max 5000 chars) |
| `attachment_url` | text | YES | Storage path in `contact-attachments` |
| `attachment_name`| text | YES | Original sanitized filename |
| `attachment_size`| bigint | YES | File size in bytes (max 10MB) |
| `status` | text | NO | `'new'`, `'in_progress'`, `'resolved'`, or `'closed'` |
| `priority` | text | NO | `'low'`, `'normal'`, `'high'`, or `'urgent'` |
| `assigned_to` | uuid | YES | FK to `auth.users(id)` (support admin) |
| `admin_notes` | text | YES | Deprecated legacy field (use notes table) |
| `created_at` | timestamptz | NO | Insertion timestamp |
| `updated_at` | timestamptz | NO | Auto-updated via trigger |

### `public.contact_request_notes`
Private support notes accessible exclusively to support administrators.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary Key |
| `contact_request_id`| uuid | FK to `contact_requests(id)` ON DELETE CASCADE |
| `author_user_id` | uuid | FK to `auth.users(id)` |
| `note` | text | Note body (max 5000 chars) |
| `created_at` | timestamptz | Note creation timestamp |
| `updated_at` | timestamptz | Auto-updated timestamp |

### `public.contact_request_events`
Immutable audit log tracking all operational changes on contact requests.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary Key |
| `contact_request_id`| uuid | FK to `contact_requests(id)` ON DELETE CASCADE |
| `actor_user_id` | uuid | Actor who performed the action |
| `event_type` | text | `'created'`, `'status_changed'`, `'priority_changed'`, `'assigned'`, `'unassigned'`, `'note_added'`, `'attachment_uploaded'` |
| `old_value` | text | Previous value |
| `new_value` | text | New value |
| `metadata` | jsonb | Additional context |
| `created_at` | timestamptz | Event timestamp |

### `public.contact_notification_logs`
Delivery audit log for all transactional emails.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary Key |
| `contact_request_id`| uuid | FK to `contact_requests(id)` ON DELETE CASCADE |
| `event_id` | uuid | Optional FK to `contact_request_events(id)` |
| `notification_type` | text | `'user_confirmation'`, `'support_new_request'`, `'user_status_update'` |
| `recipient` | text | Email address |
| `subject` | text | Email subject |
| `status` | text | `'pending'`, `'sent'`, `'failed'`, `'skipped'` |
| `provider` | text | Provider name (`'resend'` or `'console'`) |
| `provider_message_id`| text | Provider message identifier |
| `error_message` | text | Error details if failed |
| `retry_count` | integer | Number of delivery retries |
| `metadata` | jsonb | Contextual metadata |
| `created_at` | timestamptz | Log creation timestamp |
| `sent_at` | timestamptz | Delivery timestamp |

---

## 3. Security & Row Level Security (RLS) Model

| Table / Resource | Anonymous | Candidate | Employer | Support Admin |
|---|---|---|---|---|
| `contact_requests` INSERT | YES (sanitized to anon) | YES (`user_id = auth.uid()`) | YES (`user_id = auth.uid()`) | YES |
| `contact_requests` SELECT | NO (0 rows) | YES (own candidate requests) | YES (own company requests) | YES (all requests) |
| `contact_requests` UPDATE | NO | NO | NO | YES |
| `contact_requests` DELETE | NO | NO | NO | YES |
| `contact_request_notes` | NO | NO | NO | YES (all operations) |
| `contact_request_events` | NO | NO | NO | YES (read-only) |
| `contact_notification_logs` | NO | NO | NO | YES |
| `contact-attachments` Upload | YES (`anonymous/` prefix) | YES (`${uid}/` prefix) | YES (`${uid}/` prefix) | YES |
| `contact-attachments` Read | NO | YES (own folder) | YES (own folder) | YES (via signed URLs) |

### Anti-Spoofing Database Triggers
- `contact_requests_sanitize_user_insert()`: Executes `BEFORE INSERT` with `SECURITY DEFINER`.
  - Rate limits submissions: Max 10 requests per email in 10 minutes.
  - Resets `status = 'new'`, `priority = 'normal'`, `assigned_to = null`, `admin_notes = null`.
  - Verifies and overrides `user_id`, `company_id`, and `user_type` using trusted `auth.uid()` and `public.current_company_id()`.

---

## 4. Attachment Security & Private Storage

- **Private Storage Bucket**: `contact-attachments` is strictly non-public (`public = false`). Direct public URLs return `403 Forbidden`.
- **Path Traversal Defense**: All filenames are sanitized with `replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.+/g, ".").replace(/^\.+/, "")`.
- **Folder Prefix Enforcement**:
  - Authenticated candidates & employers store under `${auth.uid()}/<uuid>-<filename>`.
  - Anonymous users store under `anonymous/<uuid>/<filename>`.
- **Authorized Support Inspection**: Generated via temporary signed URLs with 1-hour expiration (`createSignedUrl(path, 3600)`).

---

## 5. Notification & Email Infrastructure

- **Email Provider**: Resend API integration with local console fallback.
- **XSS Entity Escaping**: All user-controlled parameters (`name`, `subject`, `message`, `companyName`, `attachmentName`) are sanitized with `escapeHtml()` before rendering into HTML templates.
- **Idempotency**: `check_contact_notification_sent()` prevents duplicate emails upon network retries or duplicate submissions.
- **Failure Resilience**: Notification failures log an error in `contact_notification_logs` without rolling back or deleting the user's saved contact request.

---

## 6. Production Configuration Checklist

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public / Client | Supabase Anon/Publishable Key |
| `SUPPORT_EMAIL` | Server-only | Destination email for internal support alerts |
| `EMAIL_PROVIDER` | Server-only | `'resend'` (production) or `'console'` (local) |
| `RESEND_API_KEY` | Server-only | Resend API credential (`re_...`) |
| `EMAIL_FROM_ADDRESS` | Server-only | Sender address (e.g. `SAP Jobs Finder <notifications@sapjobsfinder.com>`) |
| `DATABASE_URL` | Server-only / Local Scripts | Postgres direct connection for migrations |

---

## 7. Future Super Admin Roadmap (Deferred Scope)

The following items are intentionally deferred for future administrative platform sprints:
1. Super Admin Authentication & Platform Role Management
2. Dedicated Super Admin Support Dashboard & UI
3. Real-time Support Chat & Webhook Subscriptions
4. Bi-directional Email Inbound Reply Parser
5. Advanced SLA Escalation Engine & Analytics
