/**
 * Role-Based Access Control for SAPJobsFinder.
 *
 * Authorization source of truth: `public.profiles.role` (candidate | employer | admin).
 * Signup may set `user_metadata.role` for the DB trigger only — never use JWT /
 * user_metadata claims for access control (middleware, session, callback).
 */

export const USER_ROLES = ["candidate", "employer", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type Platform = "public";

export const DEFAULT_PUBLIC_ROLE: UserRole = "candidate";

const ROLE_SET = new Set<string>(USER_ROLES);

/** Normalize legacy uppercase roles and synonyms. */
export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  const lower = raw.toLowerCase();

  if (ROLE_SET.has(lower)) {
    return lower as UserRole;
  }

  switch (raw.toUpperCase()) {
    case "CANDIDATE":
      return "candidate";
    case "RECRUITER":
    case "EMPLOYER":
      return "employer";
    case "ADMIN":
      return "admin";
    default:
      return null;
  }
}

export function isUserRole(value: unknown): value is UserRole {
  return normalizeRole(value) !== null;
}

export function isCandidateRole(role: UserRole): boolean {
  return role === "candidate";
}

export function isRecruiterRole(role: UserRole): boolean {
  return role === "employer";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin";
}

/** @deprecated alias */
export function isPublicRole(role: UserRole): boolean {
  return isUserRole(role);
}

/** @deprecated */
export function isInstitutionRole(_role: UserRole): boolean {
  return false;
}

export function getPlatformForRole(_role: UserRole): Platform {
  return "public";
}

export function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "employer":
      return "/employer/dashboard";
    case "candidate":
    default:
      return "/candidate/dashboard";
  }
}

export function getLoginPathForPlatform(_platform: Platform = "public"): string {
  return "/login";
}

export function getLoginPathForRole(role: UserRole): string {
  switch (role) {
    case "employer":
    case "admin":
      return "/employer/login";
    case "candidate":
    default:
      return "/login/candidate";
  }
}

export function resolveRoleFromAppMetadata(
  appMetadata: Record<string, unknown> | null | undefined,
): UserRole {
  const role = normalizeRole(appMetadata?.role);
  return role ?? DEFAULT_PUBLIC_ROLE;
}

export function resolveRoleFromUserMetadata(
  userMetadata: Record<string, unknown> | null | undefined,
): UserRole | null {
  return normalizeRole(userMetadata?.role);
}

export function resolveRoleFromClaims(
  claims: Record<string, unknown> | null | undefined,
): UserRole {
  if (!claims) {
    return DEFAULT_PUBLIC_ROLE;
  }

  const appMetadata = claims.app_metadata;
  if (appMetadata && typeof appMetadata === "object") {
    const fromApp = normalizeRole((appMetadata as Record<string, unknown>).role);
    if (fromApp) return fromApp;
  }

  const userMetadata = claims.user_metadata;
  if (userMetadata && typeof userMetadata === "object") {
    const fromUser = normalizeRole((userMetadata as Record<string, unknown>).role);
    if (fromUser) return fromUser;
  }

  const direct = normalizeRole(claims.role);
  if (direct) return direct;

  return DEFAULT_PUBLIC_ROLE;
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return role === "admin";
  }

  if (
    pathname === "/employer" ||
    pathname.startsWith("/employer/") ||
    pathname === "/recruiter" ||
    pathname.startsWith("/recruiter/")
  ) {
    return role === "employer" || role === "admin";
  }

  if (
    pathname === "/candidate" ||
    pathname.startsWith("/candidate/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/applications" ||
    pathname.startsWith("/applications/")
  ) {
    return role === "candidate" || role === "admin";
  }

  return true;
}

export function canAccessPublicDashboard(role: UserRole): boolean {
  return role === "candidate" || role === "admin";
}

export function canAccessRecruiter(role: UserRole): boolean {
  return role === "employer" || role === "admin";
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin";
}

/** Compatibility stub */
export function canAccessInstitutionDashboard(_role: UserRole): boolean {
  return false;
}

export const PUBLIC_ROLES = USER_ROLES;
export const INSTITUTION_ROLES = [] as const;
