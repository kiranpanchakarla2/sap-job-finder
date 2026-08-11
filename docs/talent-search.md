# Talent Search B — Supabase Integration

## Overview

Employer Talent Search discovers **opted-in** candidates through secure Supabase RPCs.
React never queries `candidate_profiles` directly for Talent Search.

Architecture:

```
Page → Hook → talentSearchService → Supabase RPC (SECURITY DEFINER)
```

## Candidate searchability

| Column | Meaning |
|--------|---------|
| `candidate_profiles.is_searchable` | `false` (default) = hidden from Talent Search; `true` = opted into employer discovery |
| `work_modes` | Remote / Hybrid / On-site preferences |
| `employment_types` | Full-time / Part-time / Contract / Contract-to-hire |
| `discovery_status` | Employer-safe status: `open_to_opportunities`, `available`, `not_available` |

Existing candidates remain `is_searchable = false` until they opt in.
Candidate settings UI for the toggle can be wired later; the backend field is ready.

## Safe profile model

RPC helper `to_talent_candidate_json` returns employer-safe fields only:

- identity: display name, title, summary, years of experience
- location: city/location + country (not private address)
- preferences: availability, work modes, employment types, discovery status
- skills / SAP modules / certifications / languages
- experience + education history (professional fields)

Never returned:

- phone, email, CTC / salary, auth fields, resume URLs, employer notes, application history, messages

Private candidates (`is_searchable = false`) return `CANDIDATE_NOT_AVAILABLE` — existence is not leaked.

## RPC functions

| Function | Purpose |
|----------|---------|
| `search_talent_candidates(...)` | Filtered, sorted, paginated search (page size 1–50, default 10) |
| `get_talent_candidate(id)` | Safe profile + usage increment |
| `save_talent_candidate` / `remove_saved_talent_candidate` | Company-scoped saves |
| `list_saved_talent_candidates` | Saved IDs + searchable profiles |
| `shortlist_talent_candidate` / `remove_shortlisted_talent_candidate` | Talent-pool shortlist |
| `list_shortlisted_talent_candidate_ids` | Shortlist IDs for UI |
| `get_talent_search_usage` | Period usage + plan limit |

Company is always resolved via `auth.uid()` → `current_company_id()`. Browser `company_id` is never trusted.

### Filter semantics

- Different categories: **AND**
- Multiple values in one category: **OR**
- Keyword: case-insensitive partial match across title, summary, skills, modules, certifications, experience text

### Sort mapping (controlled enum)

- `relevance` — deterministic: title → modules → skills → certifications → summary, then `updated_at`
- `most_recent` — `updated_at`
- `experience_high` / `experience_low` — years of experience
- `available_soon` — availability priority then `updated_at`

## Saved candidates

Table: `saved_candidates` (`company_id`, `candidate_id`, unique).

- RLS: employers SELECT/INSERT/DELETE only their company rows
- If a candidate becomes private, the save row remains but the profile is omitted from `items` (IDs still listed for unavailable count)

## Shortlist

Two concepts coexist:

1. **Sprint 4 application shortlist** — `job_applications.status = 'shortlisted'` (pipeline)
2. **Talent Search shortlist** — `employer_shortlisted_candidates` (company talent pool)

Talent Search uses (2). Do not merge them.

## Subscription & usage

Minimal Sprint 6B tables added for limits:

- `subscription_plans` (`max_talent_search`, etc.)
- `subscriptions` (company plan + billing period)
- `talent_search_usage` (profile view events)

**Usage definition (V1):** countable **successful searchable candidate profile views** via `get_talent_candidate`.

- Filter/search requests do **not** consume usage
- Failed / private / unauthorized profile access does **not** consume usage
- Same candidate viewed again in the same billing period counts once
- Period uses `subscriptions.current_period_start` / `current_period_end`
- `max_talent_search = null` → unlimited
- Limit errors raise `TALENT_SEARCH_LIMIT_REACHED`

Enforcement is server-side inside `record_talent_profile_view` (atomic check + insert).

No Stripe / payment / billing webhooks in this sprint.

## RLS model

| Resource | Rule |
|----------|------|
| `saved_candidates` | company-scoped via `current_company_id()` |
| `employer_shortlisted_candidates` | company-scoped |
| `talent_search_usage` | SELECT company-scoped; inserts only via DEFINER RPC |
| `subscriptions` | SELECT own company |
| `subscription_plans` | SELECT for authenticated |
| Talent Search candidate data | only through RPCs that filter `is_searchable = true` |

Sprint 4 applicant profile SELECT policies remain for applicants; Talent Search must not rely on direct table SELECT of the talent pool.

## React integration

- Service: `src/features/employer-talent-search/services/talentSearchService.ts`
- Hooks: `useTalentSearch`, `useTalentCandidate`, `useSavedCandidates`, `useTalentCollections`
- Mock runtime path removed; `data/mockTalentCandidates.ts` is unused by production code

## Messaging

Contact Candidate continues to use the existing messaging UX placeholder / Sprint 5 flow.
Talent Search does not expose email/phone or `mailto:` links.
