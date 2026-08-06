/**
 * Role-Based Access Control for SAPfinder.
 *
 * Roles are read from Supabase `app_metadata.role` (server-controlled).
 * Never authorize from `user_metadata` — it is user-editable.
 */

export const USER_ROLES = ["CANDIDATE", "RECRUITER", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type Platform = "public";

export const DEFAULT_PUBLIC_ROLE: UserRole = "CANDIDATE";

const ROLE_SET = new Set<string>(USER_ROLES);

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ROLE_SET.has(value);
}

export function isCandidateRole(role: UserRole): boolean {
  return role === "CANDIDATE";
}

export function isRecruiterRole(role: UserRole): boolean {
  return role === "RECRUITER";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN";
}

/** @deprecated alias — SAPfinder has a single public platform */
export function isPublicRole(role: UserRole): boolean {
  return isUserRole(role);
}

/** @deprecated — no institution platform in SAPfinder */
export function isInstitutionRole(_role: UserRole): boolean {
  return false;
}

export function getPlatformForRole(_role: UserRole): Platform {
  return "public";
}

/** Default landing path after authentication for a given role. */
export function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "RECRUITER":
      return "/recruiter";
    case "CANDIDATE":
    default:
      return "/dashboard";
  }
}

/** Sign-in entry path. */
export function getLoginPathForPlatform(_platform: Platform = "public"): string {
  return "/signin";
}

/**
 * Resolves role from JWT / user `app_metadata`.
 * Falls back to CANDIDATE for accounts without an explicit role.
 */
export function resolveRoleFromAppMetadata(
  appMetadata: Record<string, unknown> | null | undefined,
): UserRole {
  const role = appMetadata?.role;
  if (isUserRole(role)) {
    return role;
  }
  return DEFAULT_PUBLIC_ROLE;
}

export function resolveRoleFromClaims(
  claims: Record<string, unknown> | null | undefined,
): UserRole {
  if (!claims) {
    return DEFAULT_PUBLIC_ROLE;
  }

  const appMetadata = claims.app_metadata;
  if (appMetadata && typeof appMetadata === "object") {
    return resolveRoleFromAppMetadata(appMetadata as Record<string, unknown>);
  }

  if (isUserRole(claims.role)) {
    return claims.role;
  }

  return DEFAULT_PUBLIC_ROLE;
}

/** Whether a role may access a pathname under RBAC route rules. */
export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return role === "ADMIN";
  }

  if (pathname === "/recruiter" || pathname.startsWith("/recruiter/")) {
    return role === "RECRUITER" || role === "ADMIN";
  }

  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/applications" ||
    pathname.startsWith("/applications/")
  ) {
    return role === "CANDIDATE" || role === "ADMIN";
  }

  return true;
}

export function canAccessPublicDashboard(role: UserRole): boolean {
  return role === "CANDIDATE" || role === "ADMIN";
}

export function canAccessRecruiter(role: UserRole): boolean {
  return role === "RECRUITER" || role === "ADMIN";
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

/** Compatibility stub for copied auth forms */
export function canAccessInstitutionDashboard(_role: UserRole): boolean {
  return false;
}

export const PUBLIC_ROLES = USER_ROLES;
export const INSTITUTION_ROLES = [] as const;
