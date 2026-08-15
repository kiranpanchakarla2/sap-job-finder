/**
 * Employer authentication service (Sprint 1 — Supabase Auth + profiles).
 *
 * UI → useEmployerAuth → employerAuthService → Supabase
 *
 * Passwords are handled only by Supabase Auth — never stored in app tables.
 * Role is enforced from public.profiles (created by DB trigger), not from the browser.
 */

import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile, mapAuthError } from "@/services/authService";
import type {
  AuthResult,
  Employer,
  EmployerAuthSuccess,
  EmployerForgotPasswordData,
  EmployerLoginData,
  EmployerProfile,
  EmployerRegistrationData,
  EmployerResetPasswordData,
} from "../types/employerAuth.types";
import { EMPLOYER_PENDING_EMAIL_KEY } from "../constants";

import { getEmailRedirectTo, getAppOrigin } from "@/lib/auth/origin";

export { EMPLOYER_PENDING_EMAIL_KEY };

function canUseDom(): boolean {
  return typeof window !== "undefined";
}

function toEmployer(
  userId: string,
  email: string,
  profile: { first_name: string | null; last_name: string | null } | null,
): Employer {
  return {
    id: userId,
    role: "employer",
    email,
    firstName: profile?.first_name ?? undefined,
    lastName: profile?.last_name ?? undefined,
  };
}

async function fetchEmployerProfileRow(userId: string): Promise<EmployerProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, role, first_name, last_name, email, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || (data.role !== "employer" && data.role !== "admin")) {
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    role: "employer",
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

async function requireEmployerSession(): Promise<AuthResult<EmployerAuthSuccess>> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Invalid email or password." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account profile is incomplete. Please contact support.",
    };
  }

  if (profile.role !== "employer" && profile.role !== "admin") {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account does not have permission to access this area.",
    };
  }

  const employerProfile = await fetchEmployerProfileRow(user.id);
  const employer = toEmployer(user.id, user.email ?? "", profile);

  return {
    success: true,
    data: {
      employer,
      profile: employerProfile,
    },
  };
}

export const employerAuthService = {
  getPendingVerificationEmail(): string | null {
    if (!canUseDom()) return null;
    return window.sessionStorage.getItem(EMPLOYER_PENDING_EMAIL_KEY);
  },

  setPendingVerificationEmail(email: string | null): void {
    if (!canUseDom()) return;
    if (email) {
      window.sessionStorage.setItem(EMPLOYER_PENDING_EMAIL_KEY, email);
    } else {
      window.sessionStorage.removeItem(EMPLOYER_PENDING_EMAIL_KEY);
    }
  },

  async getSession(): Promise<Session | null> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentProfile(): Promise<EmployerProfile | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return fetchEmployerProfileRow(user.id);
  },

  async register(
    data: EmployerRegistrationData,
  ): Promise<AuthResult<{ email: string; needsEmailConfirmation: boolean }>> {
    const supabase = createClient();
    const email = data.email.trim().toLowerCase();
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const designation = data.jobTitle?.trim() || undefined;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        emailRedirectTo: getEmailRedirectTo("/employer/login"),
        data: {
          // Role is hardcoded in the service — never taken from a form field.
          // DB trigger still sanitizes to employer|candidate and never admin.
          role: "employer",
          first_name: firstName,
          last_name: lastName,
          designation: designation ?? null,
          job_title: designation ?? null,
          recruiter_name: `${firstName} ${lastName}`.trim(),
        },
      },
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    if (!signUpData.user) {
      return { success: false, error: "Unable to create your account. Please try again." };
    }

    if (signUpData.user.identities && signUpData.user.identities.length === 0) {
      return { success: false, error: "An account with this email already exists." };
    }

    const needsEmailConfirmation = !signUpData.session;
    this.setPendingVerificationEmail(email);

    if (signUpData.session) {
      const roleCheck = await requireEmployerSession();
      if (!roleCheck.success) {
        return roleCheck;
      }
    }

    return {
      success: true,
      data: { email, needsEmailConfirmation },
    };
  },

  async login(data: EmployerLoginData): Promise<AuthResult<EmployerAuthSuccess>> {
    const supabase = createClient();
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    if (!signInData.user) {
      return { success: false, error: "Invalid email or password." };
    }

    const result = await requireEmployerSession();
    if (result.success) {
      this.setPendingVerificationEmail(null);
    }
    return result;
  },

  async logout(): Promise<AuthResult> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    this.setPendingVerificationEmail(null);
    if (error) {
      return { success: false, error: mapAuthError(error) };
    }
    return { success: true, data: undefined };
  },

  async requestPasswordReset(
    data: EmployerForgotPasswordData,
  ): Promise<AuthResult<{ email: string }>> {
    const supabase = createClient();
    const email = data.email.trim().toLowerCase();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getEmailRedirectTo("/employer/reset-password"),
    });

    // Always return a generic success to avoid account enumeration,
    // except for rate-limit / delivery configuration failures.
    if (error) {
      const message = (error.message || "").toLowerCase();
      if (message.includes("rate limit") || message.includes("error sending")) {
        return { success: false, error: mapAuthError(error) };
      }
    }

    return { success: true, data: { email } };
  },

  async resetPassword(data: EmployerResetPasswordData): Promise<AuthResult> {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Your password reset link is invalid or has expired. Please request a new one.",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    await supabase.auth.signOut();
    return { success: true, data: undefined };
  },

  async resendVerificationEmail(email?: string): Promise<AuthResult> {
    const supabase = createClient();
    const target = (email ?? this.getPendingVerificationEmail())?.trim().toLowerCase();

    if (!target) {
      return {
        success: false,
        error: "No pending verification email found. Please register again.",
      };
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: {
        emailRedirectTo: getEmailRedirectTo("/employer/login"),
      },
    });

    if (error) {
      return { success: false, error: mapAuthError(error) };
    }

    this.setPendingVerificationEmail(target);
    return { success: true, data: undefined };
  },
};
