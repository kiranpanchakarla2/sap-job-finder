/**
 * Auth models for SAPJobsFinder (Supabase Auth + profiles).
 */

export const AUTH_ROLES = ["candidate", "employer", "admin", "super_admin"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export type AuthProfile = {
  id: string;
  user_id: string;
  role: AuthRole;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  avatarInitials?: string;
  companyName?: string;
  phone?: string;
};

export type AuthResult =
  | {
      success: true;
      user: AuthUser;
      token: string | null;
      needsEmailConfirmation?: boolean;
    }
  | { success: false; error: string };

export function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && (AUTH_ROLES as readonly string[]).includes(value);
}

export function getDashboardPathForRole(role: AuthRole): string {
  switch (role) {
    case "employer":
      return "/employer/dashboard";
    case "super_admin":
    case "admin":
      return "/admin";
    case "candidate":
    default:
      return "/candidate/dashboard";
  }
}

export function getLoginPathForRole(role: AuthRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin/login";
    case "employer":
      return "/employer/login";
    case "candidate":
    default:
      return "/login/candidate";
  }
}

export function displayNameFromProfile(profile: AuthProfile, email?: string | null): string {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || email || "User";
}

export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
