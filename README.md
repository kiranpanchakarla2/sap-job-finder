# SAPfinder

SAP job board for candidates, recruiters, and admins — built with the same architecture as [GoBuildResume](../GoResume): Next.js 15 App Router, Tailwind CSS v4 theme engine, and Supabase Auth/DB.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v4 + shared theme experience engine
- Supabase Auth (cookie sessions via `@supabase/ssr`)
- Supabase Postgres + Storage (`resumes` bucket)
- react-hook-form + zod + sonner + framer-motion + lucide-react

## Getting started

```bash
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

Apply migrations from `supabase/migrations/` with the Supabase CLI or SQL editor:

1. `20260806120000_init.sql` — schema, RLS, storage policies, signup trigger
2. `20260806121000_seed.sql` — sample companies and jobs

Without Supabase env vars, marketing pages and job listings still run on mock data; protected routes redirect to `/signin`.

### Roles

Roles live in `auth.users.raw_app_meta_data.role` (`CANDIDATE` | `RECRUITER` | `ADMIN`). Defaults to `CANDIDATE` on signup.

| Role | Home |
|------|------|
| CANDIDATE | `/dashboard` |
| RECRUITER | `/recruiter` |
| ADMIN | `/admin` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Lint |

## Project layout

```
src/
  app/           # Thin App Router pages
  components/    # UI, layout, jobs, auth, dashboard
  lib/           # auth, supabase, validations, constants
  services/      # Domain data access
  theme/         # Theme engine (GoBuildResume-compatible)
  types/         # Shared TypeScript types
supabase/
  migrations/    # Schema + seed
```

## Phase roadmap

- **Phase 1 (this repo):** Auth, candidate profile/resume, job search/apply, dashboards shells
- **Phase 2:** Saved jobs, notifications, resume score, recommendations, email
- **Phase 3:** AI resume review, AI/live mock interview, salary insights, community
