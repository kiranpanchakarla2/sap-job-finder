# Contact Us Notifications & Communication — Architecture & Developer Documentation

## Sprint 8F Overview

The **Contact Us Notifications & Communication System** delivers reliable, server-side transactional email communication for customer inquiries across **SAP Jobs Finder**. It handles:

1. **User Confirmation**: Instant receipt confirmation to the submitter (anonymous, candidate, or employer).
2. **Support Alerts**: Internal notifications to the support team with rich context (company profile for employers, attachment indicators, and submitter metadata).
3. **Status Updates**: Notifying requesters when their inquiry status transitions (e.g. `new -> in_progress`, `in_progress -> resolved`, `resolved -> closed`, `closed -> in_progress`).
4. **Idempotency & Resilience**: Prevents duplicate email dispatches and guarantees that database contact requests are never compromised by transient email provider outages.

```
┌─────────────────────────────────┐
│     User Submits Contact Us     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     public.contact_requests     │ (Database record created safely)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          Server-Side Contact Notification Service           │
│        (src/services/server/contactNotificationService.ts)  │
└────────────────┬────────────────────────────┬───────────────┘
                 │                            │
                 ▼                            ▼
┌────────────────────────────────┐ ┌───────────────────────────┐
│   User Confirmation Email      │ │ Internal Support Alert    │
│  (userConfirmationTemplate)    │ │(supportNewRequestTemplate)│
└────────────────┬───────────────┘ └──────────┬────────────────┘
                 │                            │
                 ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Email Provider Factory                    │
│   (Resend REST API in Prod / Console Sandbox in Dev & Tests)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              public.contact_notification_logs               │
│    (Tracks notification type, recipient, status, and IDs)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Database Schema (`contact_notification_logs`)

```sql
create table public.contact_notification_logs (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests (id) on delete cascade,
  event_id uuid references public.contact_request_events (id) on delete set null,
  notification_type text not null check (
    notification_type in ('user_confirmation', 'support_new_request', 'user_status_update')
  ),
  recipient text not null,
  subject text not null,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'failed', 'skipped')
  ),
  provider text not null default 'console',
  provider_message_id text,
  error_message text,
  retry_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
```

### Row Level Security (RLS)
* Restricted exclusively to `public.current_app_role() = 'admin'`. Normal candidate and employer users have zero access.

---

## 2. Server-Side Email Provider Abstraction

Email dispatches are executed strictly server-side using the `EmailProvider` interface:

```typescript
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}
```

* **`ConsoleEmailProvider`** (Default in Development/Test): Logs structured email summaries safely without sending live external network calls.
* **`ResendEmailProvider`** (Production): Connects to the Resend transactional REST API using `RESEND_API_KEY`.

### Environment Configuration:
```env
# Optional provider selection (defaults to resend when API key is present, otherwise console)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_123456789
EMAIL_FROM_ADDRESS="SAP Jobs Finder <notifications@sapjobsfinder.com>"
SUPPORT_EMAIL="support@sapjobsfinder.com"
```

---

## 3. Email Templates

All templates generate responsive HTML and plain-text fallbacks with SAP Jobs Finder branding (`#0f172a` navy, `#0284c7` blue, official site footer):

1. **`userConfirmationTemplate({ name, subject, category, createdAt })`**: Confirms receipt to the user.
2. **`supportNewRequestTemplate({ userType, name, email, category, subject, message, companyName, attachmentName, createdAt })`**: Notifies support with full metadata.
3. **`userStatusUpdateTemplate({ name, subject, oldStatus, newStatus, createdAt })`**: Informs user of ticket progress.

---

## 4. Status Transition Matrix & User Notification Policy

| Transition | User Notified? | User-Facing Message |
|---|:---:|---|
| `new -> in_progress` | ✅ Yes | *"Your request is now in progress and being reviewed by our team."* |
| `in_progress -> resolved` | ✅ Yes | *"Your request has been marked as resolved."* |
| `resolved -> closed` | ✅ Yes | *"Your support request has been closed."* |
| `closed -> in_progress` | ✅ Yes | *"Your request has been reopened and is being reviewed again."* |
| Priority changes | ❌ No | Internal support triage only. |
| Assignment changes | ❌ No | Internal support triage only. |
| Internal notes | ❌ No | Internal support triage only. |

---

## 5. Failure Resilience & Decoupling

* **Non-Blocking Execution**: Email dispatch errors do not roll back or fail the database insert. If email delivery encounters network issues or provider downtime, the user's inquiry remains safely recorded in PostgreSQL.
* **Failure Logging**: Any transmission failure records status `failed` with error diagnostics in `contact_notification_logs` for subsequent administrator review or background retry.
