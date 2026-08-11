# Employer Portal — Session Management

## Policy (application-level)

| Control | Default | Env override |
|---------|---------|--------------|
| Inactivity timeout | 30 minutes | `NEXT_PUBLIC_EMPLOYER_INACTIVITY_TIMEOUT_MS` |
| Inactivity warning | 5 minutes before expiry (25m) | `NEXT_PUBLIC_EMPLOYER_INACTIVITY_WARNING_LEAD_MS` |
| Absolute session | 8 hours | `NEXT_PUBLIC_EMPLOYER_ABSOLUTE_SESSION_MS` |
| Activity throttle | 15 seconds | `NEXT_PUBLIC_EMPLOYER_ACTIVITY_THROTTLE_MS` |

Supabase Auth remains the source of truth for access/refresh tokens.
These timers are Employer Portal UX/security controls only.

## Redirects

| Event | Destination |
|-------|-------------|
| Explicit logout | `/employer` |
| Session expired (inactivity / absolute / invalid / suspended) | `/employer/login?reason=…` |

## Implementation

- Config: `src/features/employer-auth/config/employerSession.ts`
- Provider: `EmployerSessionProvider` (mounted in `EmployerLayout` + onboarding)
- Guard: `EmployerProtectedRoute` (auth → employer_accounts → role/status)
- Cleanup: `clearEmployerClientState` — app-owned keys only (never blanket cookie wipe)
