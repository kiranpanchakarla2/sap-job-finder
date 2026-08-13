/**
 * Supabase authentication service for SAPJobsFinder.
 * Passwords are handled only by Supabase Auth — never stored in app tables.
 */

import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  displayNameFromProfile,
  getDashboardPathForRole,
  getLoginPathForRole,
  initialsFromName,
  isAuthRole,
  type AuthProfile,
  type AuthResult,
  type AuthRole,
  type AuthUser,
} from "@/types/auth";
import type { CandidateRegisterInput } from "@/types/candidate";
import type { EmployerRegisterInput } from "@/types/employer";

function getEmailRedirectTo(next: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function mapAuthError(error: { message?: string; status?: number } | null | undefined): string {
  const message = (error?.message || "").toLowerCase();

  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("invalid login credentials") || message.includes("invalid email or password")) {
    return "Invalid email or password.";
  }
  if (message.includes("email not confirmed") || message.includes("email_not_confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("already registered")
  ) {
    return "An account with this email already exists.";
  }
  if (
    message.includes("password should be") ||
    message.includes("weak password") ||
    message.includes("password is known") ||
    (message.includes("password") && message.includes("least"))
  ) {
    return "Your password does not meet the required security requirements.";
  }
  if (message.includes("password")) {
    return "Your password does not meet the required security requirements.";
  }
  if (message.includes("over_email_send_rate_limit") || message.includes("email rate limit")) {
    return "Email sending is temporarily rate-limited. Wait a few minutes, or disable Confirm email in the Supabase Auth settings for local testing.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "Unable to complete authentication. Please try again.";
}

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, role, first_name, last_name, email, phone, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || !isAuthRole(data.role)) {
    return null;
  }

  return data as AuthProfile;
}

async function fetchCompanyName(userId: string): Promise<string | undefined> {
  const supabase = createClient();
  const { data } = await supabase
    .from("employer_profiles")
    .select("company_name")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.company_name ?? undefined;
}

export async function buildAuthUser(user: User, profile?: AuthProfile | null): Promise<AuthUser | null> {
  const resolved = profile ?? (await fetchProfile(user.id));
  if (!resolved) return null;

  const name = displayNameFromProfile(resolved, user.email);
  const companyName =
    resolved.role === "employer" ? await fetchCompanyName(user.id) : undefined;

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    role: resolved.role,
    phone: resolved.phone ?? undefined,
    avatarInitials: initialsFromName(name),
    companyName,
  };
}

async function requireRoleMatch(
  user: User,
  expectedRole: AuthRole,
): Promise<AuthResult> {
  const profile = await fetchProfile(user.id);
  if (!profile) {
    await createClient().auth.signOut();
    return {
      success: false,
      error: "Your account profile is incomplete. Please contact support.",
    };
  }

  if (profile.role !== expectedRole && !(expectedRole === "employer" && profile.role === "admin")) {
    await createClient().auth.signOut();
    return {
      success: false,
      error: "Your account does not have permission to access this area.",
    };
  }

  const authUser = await buildAuthUser(user, profile);
  if (!authUser) {
    await createClient().auth.signOut();
    return { success: false, error: "Unable to load your account." };
  }

  const {
    data: { session },
  } = await createClient().auth.getSession();

  return {
    success: true,
    user: authUser,
    token: session?.access_token ?? null,
  };
}

export async function registerCandidate(data: CandidateRegisterInput): Promise<AuthResult> {
  const supabase = createClient();

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      emailRedirectTo: getEmailRedirectTo("/candidate/dashboard"),
      data: {
        role: "candidate",
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        current_location: data.location,
        years_of_experience: data.experience,
        sap_module: data.sapModule,
      },
    },
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  if (!signUpData.user) {
    return { success: false, error: "Unable to create your account. Please try again." };
  }

  // Supabase returns a user with empty identities when email already exists (depending on settings)
  if (signUpData.user.identities && signUpData.user.identities.length === 0) {
    return { success: false, error: "An account with this email already exists." };
  }

  const needsEmailConfirmation = !signUpData.session;

  if (needsEmailConfirmation) {
    return {
      success: true,
      user: {
        id: signUpData.user.id,
        email: data.email.trim().toLowerCase(),
        name: `${data.firstName} ${data.lastName}`.trim(),
        role: "candidate",
        phone: data.phone,
        avatarInitials: initialsFromName(`${data.firstName} ${data.lastName}`),
      },
      token: null,
      needsEmailConfirmation: true,
    };
  }

  return requireRoleMatch(signUpData.user, "candidate");
}

export async function registerEmployer(data: EmployerRegisterInput): Promise<AuthResult> {
  const supabase = createClient();

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      emailRedirectTo: getEmailRedirectTo("/employer/dashboard"),
      data: {
        role: "employer",
        recruiter_name: data.recruiterName,
        company_name: data.companyName,
        phone: data.phone,
        company_website: data.website,
        company_size: data.companySize,
        industry: data.industry,
      },
    },
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  if (!signUpData.user) {
    return { success: false, error: "Unable to create your company account. Please try again." };
  }

  if (signUpData.user.identities && signUpData.user.identities.length === 0) {
    return { success: false, error: "An account with this email already exists." };
  }

  const needsEmailConfirmation = !signUpData.session;

  if (needsEmailConfirmation) {
    return {
      success: true,
      user: {
        id: signUpData.user.id,
        email: data.email.trim().toLowerCase(),
        name: data.recruiterName,
        role: "employer",
        phone: data.phone,
        companyName: data.companyName,
        avatarInitials: initialsFromName(data.recruiterName),
      },
      token: null,
      needsEmailConfirmation: true,
    };
  }

  return requireRoleMatch(signUpData.user, "employer");
}

export async function loginCandidate(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }
  if (!data.user) {
    return { success: false, error: "Invalid email or password." };
  }

  return requireRoleMatch(data.user, "candidate");
}

export async function loginEmployer(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }
  if (!data.user) {
    return { success: false, error: "Invalid email or password." };
  }

  return requireRoleMatch(data.user, "employer");
}

/** Role-aware login used by AuthContext */
export async function login(
  email: string,
  password: string,
  role: AuthRole,
): Promise<AuthResult> {
  if (role === "employer" || role === "admin") {
    return loginEmployer(email, password);
  }
  return loginCandidate(email, password);
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) return null;

  // A stored session can be stale. Validate it with Auth before protected
  // routes mount their data loaders.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (
      !userError ||
      userError.name === "AuthSessionMissingError" ||
      userError.status === 401 ||
      userError.status === 403
    ) {
      await supabase.auth.signOut({ scope: "local" });
    }
    return null;
  }
  return { ...session, user };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return buildAuthUser(user);
}

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchProfile(user.id);
}

export function isAuthenticated(session: Session | null | undefined): boolean {
  return Boolean(session?.user);
}

export function getLogoutRedirectPath(role?: AuthRole | null) {
  if (role && isAuthRole(role)) {
    return getLoginPathForRole(role);
  }
  return "/login/candidate";
}

export function getHomePath(role?: AuthRole | null) {
  if (role && isAuthRole(role)) {
    return getDashboardPathForRole(role);
  }
  return "/login/candidate";
}

export async function resetPassword(email: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createClient();
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${origin}/login/candidate`,
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  return { success: true };
}

export function subscribeToAuthChanges(
  callback: (event: string, session: Session | null) => void,
) {
  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription.unsubscribe();
}
