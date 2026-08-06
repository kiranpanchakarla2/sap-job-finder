import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  canAccessPublicDashboard,
  canAccessRecruiter,
  getHomePathForRole,
  getLoginPathForPlatform,
  getPlatformForRole,
  resolveRoleFromAppMetadata,
  type Platform,
  type UserRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  platform: Platform;
};

function resolveFullName(
  metadata: Record<string, unknown> | undefined,
  email: string,
): string {
  const fullName = metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const name = metadata?.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return email.split("@")[0] || "User";
}

function toAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): AuthUser | null {
  if (!user.email) {
    return null;
  }

  const role = resolveRoleFromAppMetadata(
    user.app_metadata as Record<string, unknown> | undefined,
  );

  return {
    id: user.id,
    email: user.email,
    fullName: resolveFullName(
      user.user_metadata as Record<string, unknown> | undefined,
      user.email,
    ),
    role,
    platform: getPlatformForRole(role),
  };
}

/**
 * Returns the authenticated user or redirects to sign-in.
 */
export async function requireUser(
  redirectTo = "/dashboard",
  platform: Platform = "public",
): Promise<AuthUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const params = new URLSearchParams({ next: redirectTo });
    redirect(`${getLoginPathForPlatform(platform)}?${params.toString()}`);
  }

  const authUser = toAuthUser(user);
  if (!authUser) {
    const params = new URLSearchParams({ next: redirectTo });
    redirect(`${getLoginPathForPlatform(platform)}?${params.toString()}`);
  }

  return authUser;
}

/** Require an authenticated candidate (or admin) for candidate surfaces. */
export async function requireCandidateUser(
  redirectTo = "/dashboard",
): Promise<AuthUser> {
  const user = await requireUser(redirectTo, "public");

  if (!canAccessPublicDashboard(user.role)) {
    redirect(getHomePathForRole(user.role));
  }

  return user;
}

/** @deprecated alias for GoBuildResume naming */
export async function requirePublicUser(
  redirectTo = "/dashboard",
): Promise<AuthUser> {
  return requireCandidateUser(redirectTo);
}

/** Require a recruiter (or admin). */
export async function requireRecruiterUser(
  redirectTo = "/recruiter",
): Promise<AuthUser> {
  const user = await requireUser(redirectTo, "public");

  if (!canAccessRecruiter(user.role)) {
    redirect(getHomePathForRole(user.role));
  }

  return user;
}

/** Require an ADMIN for `/admin`. */
export async function requireAdminUser(redirectTo = "/admin"): Promise<AuthUser> {
  const user = await requireUser(redirectTo, "public");

  if (!canAccessAdmin(user.role)) {
    redirect(getHomePathForRole(user.role));
  }

  return user;
}

/** Stub — SAPfinder has no institution platform */
export async function requireInstitutionUser(
  redirectTo = "/dashboard",
): Promise<AuthUser> {
  redirect(redirectTo);
}
