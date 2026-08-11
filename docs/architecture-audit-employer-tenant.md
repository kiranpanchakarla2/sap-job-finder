# Employer Portal — Architecture Audit Report

**Project:** SAPJobsFinder  
**Date:** 2026-08-11  
**Scope:** Pre–Talent Search B tenant / membership / role alignment  
**Method:** Live Supabase schema + applied migrations + React employer services (no assumptions)

---

## Executive summary

The Employer Portal already uses **`company_profiles.id` as `company_id`** for jobs, applications (via jobs), Talent Search saves/shortlists, subscriptions, and usage. That part of the canonical model is correct.

The critical gap is **single-user company ownership**:

| Expected | Actual today |
|----------|--------------|
| Company → many employer accounts with roles | One `auth.users` owns one `company_profiles` row (`user_id` UNIQUE) |
| Roles: owner / admin / recruiter / hiring_manager | Platform role only: `profiles.role` ∈ {candidate, employer, admin} |
| `employer_accounts` membership | No table; `recruiters` is a thin link to `employer_profiles`, not used for RLS |
| Job `created_by` → employer account | `jobs.created_by` → `auth.users.id` |
| Job `assigned_to` | **Does not exist** |
| Saved candidates company-scoped | Yes (`saved_candidates.company_id`) — missing `saved_by` |

**Live data:** 1 company (`BridgecoreIT`), 1 employer profile, 1 primary recruiter, 2 jobs, 2 applications, 1 subscription. Safe to evolve carefully.

**Do not rebuild:** Sprint 1–6B tables/UI, Talent Search B RPCs/tables. Align by adding membership + role helpers and updating RLS resolution paths.

---

## A. Company table

| Field | Finding |
|-------|---------|
| **Table name** | `company_profiles` (canonical company / tenant). No separate `companies` table in live DB. Legacy `companies` from early init migration is **not** present. |
| **Primary key** | `id` (uuid) |
| **Relevant FKs** | `user_id` → `auth.users(id)` ON DELETE CASCADE; **UNIQUE(`user_id`)** |
| **Ownership field** | `user_id` = founding/sole employer user |
| **Role field** | None |
| **Current RLS** | SELECT own (`user_id = auth.uid()`); SELECT public when `setup_complete`; INSERT/UPDATE only for owning user + employer/admin platform role |
| **Problems** | 1:1 user↔company blocks multi-employer tenancy. Profile data mixes company fields with personal recruiter fields (`recruiter_name`, `designation`, `work_email`, `phone`). |
| **Recommended alignment** | Keep `company_profiles` as company tenant (already referenced as `company_id`). Treat `user_id` as founding owner for signup back-compat. Resolve membership via new `employer_accounts`. Allow Owner/Admin to UPDATE company profile through membership RLS. Do **not** create a duplicate `companies` table. |

---

## B. Employer Account table

| Field | Finding |
|-------|---------|
| **Table name** | **Missing.** Closest: `recruiters` |
| **recruiters PK** | `id` |
| **Relevant FKs** | `employer_id` → `employer_profiles.id`; `user_id` → `auth.users`; UNIQUE(`employer_id`,`user_id`) |
| **Ownership / role** | `is_primary` boolean; `designation` free text — **not** a role enum |
| **Current RLS** | Manage when `employer_id = current_employer_id()`; view own or same employer |
| **Problems** | Points at `employer_profiles` (legacy shell), not `company_profiles`. Unused by jobs/Talent Search RLS. Cannot express OWNER/ADMIN/RECRUITER/HIRING_MANAGER. |
| **Recommended alignment** | Introduce **`employer_accounts`** as canonical membership (not a rename of `recruiters` — not equivalent). Keep `recruiters` for legacy signup sync / usage count until a later cleanup. Do not create `employer_users` / `company_members`. |

Also present:

- **`employer_profiles`**: 1:1 with `auth.users`; still FK’d by `jobs.employer_id` and `recruiters.employer_id`. Treat as legacy employer shell, not the tenant.
- **`profiles`**: platform identity; `role` = candidate \| employer \| admin.

---

## C. Employer / company relationship

| Path | How it works today |
|------|--------------------|
| Signup | `handle_new_user` → `profiles` + `employer_profiles` + `recruiters` + `company_profiles` (all for same `auth.uid()`) |
| Runtime company | `current_company_id()` = `company_profiles.id WHERE user_id = auth.uid()` |
| Runtime employer shell | `current_employer_id()` = `employer_profiles.id WHERE user_id = auth.uid()` |
| React services | `company_profiles.eq('user_id', user.id)` then `employer_profiles.eq('user_id', user.id)` |

**Problem:** A second employer user cannot join Company A without creating their own company.

**Recommended:** `auth.uid()` → `employer_accounts` (active) → `company_id` + `role`.

---

## D. Role model

| Layer | Values | Used for |
|-------|--------|----------|
| `profiles.role` / `app_role` | `candidate`, `employer`, `admin` | Platform gates (employer portal vs candidate) |
| `recruiters.designation` | free text (e.g. "CTO") | Display only |
| Company membership roles | **None** | — |

React (`src/lib/auth/roles.ts`) mirrors platform roles only. `RECRUITER` in normalizeRole maps to platform `employer`.

**Recommended:** Keep platform `profiles.role`. Add company roles on `employer_accounts.role`: `owner` \| `admin` \| `recruiter` \| `hiring_manager` (lowercase, matching existing enum style).

---

## E–G. Job ownership / created_by / assigned_to

| Field | Finding |
|-------|---------|
| **Table** | `jobs` |
| **PK** | `id` |
| **company_id** | NOT NULL → `company_profiles.id` ✓ |
| **employer_id** | NOT NULL → `employer_profiles.id` (legacy) |
| **created_by** | NOT NULL → `auth.users` (insert requires `created_by = auth.uid()`) |
| **assigned_to** | **Absent** |
| **RLS** | SELECT/UPDATE/DELETE by `current_company_id()`; INSERT requires company + created_by + employer_id match |
| **Problems** | No hiring-manager assignment. Creator is auth user, not membership row. UPDATE WITH CHECK still requires `created_by = auth.uid()` — conflicting with “Owner/Admin manage all” if multi-user is added without RLS change. |
| **UI** | No job assignment UI; `recruiter_name` is a text field on the job. |
| **Recommended** | Keep `company_id`. Add nullable `assigned_to` → `employer_accounts.id` with same-company check. Keep `created_by` as `auth.users` for now (preserve history); resolve creator membership via `employer_accounts.user_id`. Relax job UPDATE RLS so Owner/Admin can edit all company jobs; Recruiter own; Hiring Manager assigned (read/manage apps). |

---

## H. Application ownership

| Field | Finding |
|-------|---------|
| **Table** | `job_applications` (view `applications` exists as alias) |
| **PK** | `id` |
| **FKs** | `job_id` → jobs; `candidate_id` → candidate_profiles |
| **company_id** | None (correct — resolve via job) |
| **RLS** | Employer SELECT/UPDATE via `owns_job(job_id)`; candidate via `current_candidate_id()` |
| **owns_job** | True if `company_profiles.user_id = auth.uid()` OR `employer_profiles.user_id = auth.uid()` for job |
| **Problems** | Company-wide for the single owner only; no recruiter/HM job scoping. |
| **Recommended** | Keep chain application → job → company. Extend `owns_job` / add `can_access_job` with role rules. |

---

## I. Shortlist ownership

Two concepts (already documented in Talent Search):

1. **Application pipeline:** `job_applications.status = 'shortlisted'`
2. **Talent pool:** `employer_shortlisted_candidates` (`company_id`, `candidate_id`, UNIQUE)

| Field | Finding |
|-------|---------|
| **Canonical talent shortlist** | `employer_shortlisted_candidates` |
| **Ownership** | `company_id` |
| **created_by** | Missing |
| **job_id** | Missing (company-level pool, not job-specific) |
| **RLS** | `company_id = current_company_id()` |
| **Recommended** | Do **not** duplicate. Keep company-scoped pool. Optionally add `created_by` → `employer_accounts` later; not required for Talent Search B if RLS stays company-scoped. |

---

## J. Saved candidates

| Field | Finding |
|-------|---------|
| **Table** | `saved_candidates` (exists; Talent Search B) |
| **PK** | `id` |
| **FKs** | `company_id` → company_profiles; `candidate_id` → candidate_profiles |
| **UNIQUE** | `(company_id, candidate_id)` ✓ |
| **saved_by** | **Missing** |
| **RLS** | Company-scoped via `current_company_id()` ✓ |
| **Recommended** | Add `saved_by` → `employer_accounts.id` (nullable backfill). Keep company-scoped visibility. |

---

## K. Subscription ownership

| Field | Finding |
|-------|---------|
| **Tables** | `subscriptions`, `subscription_plans`, `talent_search_usage` |
| **subscriptions.company_id** | UNIQUE → company_profiles ✓ |
| **RLS** | SELECT own company only |
| **Usage** | Company-scoped profile views |
| **React** | `subscriptionService` loads via RLS; team member count still queries `recruiters` |
| **Problems** | None for ownership model. Team count should eventually use `employer_accounts`. |
| **Recommended** | Keep company-owned. No user-based subscription migration needed. |

---

## L. RLS architecture

### Helper resolution today

```
auth.uid()
  → current_company_id()     = company_profiles.user_id match
  → current_employer_id()    = employer_profiles.user_id match
  → current_app_role()       = profiles.role
  → owns_job / owns_application
  → require_employer_company_id()  (Talent Search)
```

### Strengths

- Company isolation for jobs SELECT (fixed in `fix_jobs_select_rls`)
- Applications/interviews/messages chain through `owns_job` / `owns_application`
- Talent Search never trusts browser `company_id`
- SECURITY DEFINER helpers set `search_path = public`

### Gaps vs canonical model

1. No multi-member company resolution  
2. No membership role checks  
3. Job UPDATE locked to creator (`created_by = auth.uid()`) — blocks Owner/Admin manage-all once multi-user exists  
4. `company_profiles` UPDATE only for founding `user_id`  
5. Suspended membership not modeled  
6. No `assigned_to` for Hiring Manager  
7. React has no centralized company-role permission module (only platform roles)

### SECURITY DEFINER note

Helpers use DEFINER + `row_security = off` for membership lookups — acceptable if they only read via `auth.uid()` and never accept caller-supplied company_id as authority. Talent Search `require_employer_company_id()` already follows that pattern.

---

## Adjacent inventory (audited, no rebuild)

| Area | Status |
|------|--------|
| Interviews | Via `application_id` → owns_application; `created_by` auth.users |
| Messaging | Conversations per application; employer/candidate participant RLS |
| Analytics | React feature (Sprint 6A); company-scoped when wired to jobs/apps |
| Employer invitation | **Not implemented** |
| Employer account status | **Not implemented** |
| Settings | Account/notifications only — no team management UI |
| Talent Search B | Schema + RPCs applied; auth path ready to switch to membership helpers |

---

## Mapping: canonical → existing

| Canonical concept | Existing object | Action |
|-------------------|-----------------|--------|
| COMPANY | `company_profiles` | Reuse as tenant |
| Employer Account | *(none)* | **Create `employer_accounts`** |
| Company Profile | `company_profiles` columns | Reuse; Owner/Admin manage |
| Platform role | `profiles.role` | Keep |
| Company role | *(none)* | Add on `employer_accounts` |
| Jobs | `jobs` | Add `assigned_to`; keep `company_id`/`created_by` |
| Applications | `job_applications` | Keep; tighten via job access helpers |
| Shortlist (talent) | `employer_shortlisted_candidates` | Keep |
| Saved candidates | `saved_candidates` | Add `saved_by` |
| Subscription | `subscriptions.company_id` | Keep |
| Legacy shell | `employer_profiles` + `recruiters` | Keep; stop treating as tenant |

---

## Alignment plan (minimal, non-destructive)

1. Add enums + `employer_accounts`; backfill OWNER from each `company_profiles.user_id`  
2. Replace `current_company_id()` to resolve via active `employer_accounts` (fallback to `company_profiles` during transition)  
3. Add `get_current_employer_account_id()`, `get_current_employer_role()`, job access helpers  
4. Add nullable `jobs.assigned_to` + same-company validation trigger  
5. Add `saved_candidates.saved_by`  
6. Update RLS: company profile read for members; update for owner/admin; jobs update by role; applications via new job access  
7. Wire Talent Search `require_employer_company_id` through membership (already uses `current_company_id`)  
8. Add React `employerPermissions` helper (single module)  
9. SQL isolation tests for company + role scenarios  
10. **Defer:** invitation UI, renaming/dropping `recruiters`/`employer_profiles`, migrating `jobs.created_by` FK to `employer_accounts`, Hiring Manager Talent Search restrictions (document: all employers currently get Talent Search if they have company membership — V1 continues company-level access for owner/admin/recruiter; HM same until product says otherwise)

---

## Alignment applied (2026-08-11)

Migrations applied remotely:

1. `employer_tenant_alignment` — `employer_accounts`, `jobs.assigned_to`, `saved_candidates.saved_by`, shortlist `created_by`
2. `employer_tenant_alignment_helpers_rls` — membership helpers + role-aware RLS
3. `talent_search_actor_columns` — save/shortlist RPCs set actor columns

Local mirrors:

- `supabase/migrations/20260811130000_employer_tenant_alignment.sql`
- `supabase/migrations/20260811130100_talent_search_actor_columns.sql`
- `supabase/tests/employer_tenant_alignment_checks.sql`

React:

- `src/lib/auth/employerPermissions.ts` — single UX permission module
- `src/types/database.ts` — types updated
- Subscription team count uses `employer_accounts` (active)

### Deferred (documented, not done)

- Employer invitation UI / flow
- Migrating `jobs.created_by` FK from `auth.users` → `employer_accounts`
- Dropping / merging legacy `recruiters` + `employer_profiles`
- Restricting Hiring Manager Talent Search to assigned-job context only (V1 keeps company-scoped access for all active roles)
- Multi-company membership for one user
