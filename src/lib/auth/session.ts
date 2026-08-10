import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  canAccessPublicDashboard,
  canAccessRecruiter,
  getHomePathForRole,
  getLoginPathForPlatform,
  getPlatformForRole,
  normalizeRole,
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
  profile?: { first_name?: string | null; last_name?: string | null } | null,
): string {
  const fromProfile = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (fromProfile) return fromProfile;

  const fullName = metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const first = metadata?.first_name;
  const last = metadata?.last_name;
  if (typeof first === "string" && first.trim()) {
    return [first, typeof last === "string" ? last : ""].filter(Boolean).join(" ").trim();
  }

  const recruiter = metadata?.recruiter_name;
  if (typeof recruiter === "string" && recruiter.trim()) {
    return recruiter.trim();
  }

  const name = metadata?.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return email.split("@")[0] || "User";
}

/**
 * Returns the authenticated user or redirects to sign-in.
 * Role comes only from `public.profiles` — never JWT / user_metadata.
 */
export async function requireUser(
  redirectTo = "/candidate/dashboard",
  platform: Platform = "public",
): Promise<AuthUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    const params = new URLSearchParams({ next: redirectTo });
    redirect(`${getLoginPathForPlatform(platform)}?${params.toString()}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);

  // Fail closed: authenticated users without a profile cannot proceed.
  if (!role) {
    await supabase.auth.signOut();
    const params = new URLSearchParams({ next: redirectTo });
    redirect(`${getLoginPathForPlatform(platform)}?${params.toString()}`);
  }

  return {
    id: user.id,
    email: user.email,
    fullName: resolveFullName(
      user.user_metadata as Record<string, unknown> | undefined,
      user.email,
      profile,
    ),
    role,
    platform: getPlatformForRole(role),
  };
}

/** Require an authenticated candidate (or admin) for candidate surfaces. */
export async function requireCandidateUser(
  redirectTo = "/candidate/dashboard",
): Promise<AuthUser> {
  const user = await requireUser(redirectTo, "public");

  if (!canAccessPublicDashboard(user.role)) {
    redirect(getHomePathForRole(user.role));
  }

  return user;
}

/** @deprecated alias */
export async function requirePublicUser(
  redirectTo = "/candidate/dashboard",
): Promise<AuthUser> {
  return requireCandidateUser(redirectTo);
}

/** Require an employer/recruiter (or admin). */
export async function requireRecruiterUser(
  redirectTo = "/employer/dashboard",
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

/** Stub — no institution platform */
export async function requireInstitutionUser(
  redirectTo = "/candidate/dashboard",
): Promise<AuthUser> {
  redirect(redirectTo);
}
