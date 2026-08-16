# Support Operations Backend — Architecture & Developer Documentation

## Sprint 8E Overview

The **Support Operations Backend** establishes the secure, high-performance service and database foundation for managing customer support requests across **SAP Jobs Finder**. It prepares the API and data layer for the future **Super Admin Support Center** (Sprint 8F) while keeping candidate and employer data completely isolated and secure.

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     Anonymous User      │  │     Candidate User      │  │      Employer User      │
│  (Public Contact Form)  │  │ (Candidate Contact Form)│  │ (Employer Contact Form) │
└───────────┬─────────────┘  └────────────┬────────────┘  └────────────┬────────────┘
            │                             │                            │
            ▼                             ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           public.contact_requests                                 │
│          (Multi-tenant table with RLS + Anti-Spoofing / Audit Triggers)           │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
                   ▼                                             ▼
┌─────────────────────────────────────┐       ┌─────────────────────────────────────┐
│    public.contact_request_notes     │       │    public.contact_request_events    │
│      (Internal Support Notes)       │       │       (Immutable Audit Trail)       │
└──────────────────┬──────────────────┘       └──────────────────┬──────────────────┘
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Privileged Support API & RPCs      │
                      │  (Enforces role = 'admin' / Service)  │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │     Future Super Admin Dashboard      │
                      │        (Sprint 8F - Support UI)       │
                      └───────────────────────────────────────┘
```

---

## 1. Database Schema & Tables

### 1.1 `contact_request_notes` (Internal Support Notes)

Allows multiple internal notes with timestamps and author attribution. Never visible to anonymous visitors, candidates, or employers.

```sql
create table public.contact_request_notes (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  note text not null check (char_length(trim(note)) > 0 and char_length(note) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

* **Foreign Key**: `contact_request_id` cascades on request deletion.
* **RLS**: Restricted exclusively to `public.current_app_role() = 'admin'`.

### 1.2 `contact_request_events` (Immutable Audit Trail)

Records state changes, lifecycle status updates, priority escalations, support agent assignments, and internal notes.

```sql
create table public.contact_request_events (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null check (
    event_type in (
      'created',
      'status_changed',
      'priority_changed',
      'assigned',
      'unassigned',
      'note_added',
      'attachment_uploaded'
    )
  ),
  old_value text,
  new_value text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

* **Immutability**: No `UPDATE` or `DELETE` RLS policies exist on this table. Normal users and candidates cannot modify or delete audit events.
* **Automatic Triggers**: Populated automatically via PostgreSQL triggers `contact_requests_audit` and `contact_request_notes_audit`.

---

## 2. PostgreSQL Search & Query Optimization

Support triage queries benefit from specialized indexes:

* **GIN Full-Text Search**:
  ```sql
  create index contact_requests_search_idx
    on public.contact_requests
    using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(message, '')));
  ```
* **Status, Priority, User Type, Category**: Fast B-tree indexes for filter combinations.
* **Sorting**: B-tree index on `(created_at desc)` and `(updated_at desc)`.
* **Foreign Keys**: `(contact_request_id, created_at asc)` for instant note and event timeline lookups.

---

## 3. Database RPC Functions

All support RPCs run with `security definer` and strictly enforce administrator authorization via `public.check_support_admin_access()` (error code `42501` on unauthorized access).

| Function | Parameters | Description |
|---|---|---|
| `get_support_requests` | `p_search`, `p_user_type`, `p_status`, `p_priority`, `p_category`, `p_company_id`, `p_date_from`, `p_date_to`, `p_page`, `p_page_size`, `p_sort_by`, `p_sort_direction` | Paginated search, multi-field filtering, multi-column sorting, candidate/company name resolution, notes and events counts. |
| `get_support_request_by_id` | `p_id` | Full single request detail with joined candidate, company profile, notes list (chronological), and audit events timeline. |
| `update_support_request_status` | `p_id`, `p_status` | Validates status lifecycle transitions (`new -> in_progress -> resolved -> closed`, `closed -> in_progress`) and updates status. |
| `update_support_request_priority` | `p_id`, `p_priority` | Validates (`low`, `normal`, `high`, `urgent`) and updates priority level. |
| `assign_support_request` | `p_id`, `p_assigned_to` | Assigns request to a support user or unassigns when `null`. |
| `add_support_request_note` | `p_id`, `p_note` | Adds a trimmed 1-5000 character internal note attributed to the acting administrator. |

---

## 4. Status Lifecycle Transition Matrix

```
   ┌─────────┐
   │   new   │
   └────┬────┘
        │ (triage)
        ▼
 ┌──────────────┐          ┌────────────┐
 │ in_progress  ├─────────►│  resolved  │
 └──────▲───────┘          └─────┬──────┘
        │                        │
        │ (reopen)               │ (close)
        │                        ▼
        └──────────────────┌────────────┐
                           │   closed   │
                           └────────────┘
```

* **`new`** -> `in_progress`, `resolved`, `closed`
* **`in_progress`** -> `resolved`, `closed`, `new`
* **`resolved`** -> `in_progress`, `closed`
* **`closed`** -> `in_progress` (reopen only; direct close to resolved is rejected)

---

## 5. Service Layer API (`src/services/supportRequestService.ts`)

```typescript
// 1. Paginated Search & Filter
const result = await getSupportRequests({
  search: "bulk upload",
  userType: "employer",
  status: "new",
  priority: "high",
  page: 1,
  pageSize: 20,
  sortBy: "created_at",
  sortDirection: "desc",
});

// 2. Request Detail
const detail = await getSupportRequestById(requestId);

// 3. Status Update
await updateSupportRequestStatus(requestId, "in_progress");

// 4. Priority Update
await updateSupportRequestPriority(requestId, "urgent");

// 5. Assignment
await assignSupportRequest(requestId, supportUserId);

// 6. Internal Notes
await addSupportRequestInternalNote(requestId, "Investigating SAP job import format.");
const notes = await getSupportRequestNotes(requestId);

// 7. Audit Events
const events = await getSupportRequestEvents(requestId);

// 8. Attachment Signed URL
const { signedUrl } = await getSupportAttachmentSignedUrl(attachmentPath, 3600);
```

---

## 6. Multi-Tenant Context Resolution

1. **Candidate Context**:
   - `user_type = 'candidate'`
   - Resolves `user_display_name` via `profiles` or `candidate_profiles`
   - Keeps candidate applications and resume associations intact.
2. **Employer Context**:
   - `user_type = 'employer'`
   - Resolves `company_name`, `company_logo_url`, `company_website` via `company_profiles`
   - Keeps company member ticket history grouped under `company_id`.
3. **Anonymous Context**:
   - `user_type = 'anonymous'`, `user_id = null`, `company_id = null`
   - Preserves submitter's entered `name` and `email` without requiring an account.

---

## 7. Deferred Super Admin Dependencies

The following elements are **intentionally deferred** until the Super Admin implementation sprint:
* Super Admin login / authentication flow
* Super Admin UI dashboard, ticket inbox tables, and visual detail pages
* Admin navigation and sidebar links
* Support agent assignment directory UI picker
