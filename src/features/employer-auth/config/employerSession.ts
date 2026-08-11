/**
 * Employer Portal session policy (application-level).
 * Supabase Auth remains the source of truth for access/refresh tokens.
 */

const DEFAULT_INACTIVITY_MS = 30 * 60 * 1000;
const DEFAULT_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
const DEFAULT_WARNING_LEAD_MS = 5 * 60 * 1000;
const DEFAULT_ACTIVITY_THROTTLE_MS = 15 * 1000;
const DEFAULT_TICK_MS = 30 * 1000;

function parsePositiveMs(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

/** Production default: 30 minutes. Override via NEXT_PUBLIC_EMPLOYER_INACTIVITY_TIMEOUT_MS. */
export const EMPLOYER_INACTIVITY_TIMEOUT_MS = parsePositiveMs(
  process.env.NEXT_PUBLIC_EMPLOYER_INACTIVITY_TIMEOUT_MS,
  DEFAULT_INACTIVITY_MS,
);

/** Production default: 8 hours. Override via NEXT_PUBLIC_EMPLOYER_ABSOLUTE_SESSION_MS. */
export const EMPLOYER_ABSOLUTE_SESSION_MS = parsePositiveMs(
  process.env.NEXT_PUBLIC_EMPLOYER_ABSOLUTE_SESSION_MS,
  DEFAULT_ABSOLUTE_MS,
);

/** Show warning this long before inactivity expiry (default 5 minutes → warn at 25m). */
export const EMPLOYER_INACTIVITY_WARNING_LEAD_MS = parsePositiveMs(
  process.env.NEXT_PUBLIC_EMPLOYER_INACTIVITY_WARNING_LEAD_MS,
  DEFAULT_WARNING_LEAD_MS,
);

export const EMPLOYER_ACTIVITY_THROTTLE_MS = parsePositiveMs(
  process.env.NEXT_PUBLIC_EMPLOYER_ACTIVITY_THROTTLE_MS,
  DEFAULT_ACTIVITY_THROTTLE_MS,
);

export const EMPLOYER_SESSION_TICK_MS = parsePositiveMs(
  process.env.NEXT_PUBLIC_EMPLOYER_SESSION_TICK_MS,
  DEFAULT_TICK_MS,
);

export const EMPLOYER_SESSION_MESSAGES = {
  inactivityWarning: "Your session will expire soon due to inactivity.",
  inactivityExpired:
    "Your session expired due to inactivity. Please sign in again.",
  absoluteExpired:
    "Your employer session has expired. Please sign in again.",
  invalid: "Your session is no longer valid. Please sign in again.",
  suspended:
    "Your employer account has been suspended. Please contact your company administrator.",
} as const;

export type EmployerSessionEndReason =
  | "inactivity"
  | "absolute"
  | "invalid"
  | "suspended"
  | "explicit";

export function employerLoginPathWithReason(
  reason: Exclude<EmployerSessionEndReason, "explicit">,
  next?: string | null,
): string {
  const params = new URLSearchParams();
  params.set("reason", reason);
  if (
    next &&
    next.startsWith("/employer") &&
    !next.startsWith("//") &&
    !next.includes("/login")
  ) {
    params.set("next", next);
  }
  return `/employer/login?${params.toString()}`;
}

/** Explicit logout destination (not the login page). */
export const EMPLOYER_LOGOUT_LANDING_PATH = "/employer";

/** Session expiry destination. */
export const EMPLOYER_SESSION_EXPIRED_LOGIN_PATH = "/employer/login";
