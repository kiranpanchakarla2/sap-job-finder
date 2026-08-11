"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useAuth } from "@/auth/AuthContext";
import { employerAuthService } from "../services/employerAuthService";
import type {
  AuthResult,
  AuthState,
  Employer,
  EmployerAuthSuccess,
  EmployerForgotPasswordData,
  EmployerLoginData,
  EmployerProfile,
  EmployerRegistrationData,
  EmployerResetPasswordData,
} from "../types/employerAuth.types";

function mapEmployer(
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

/**
 * Employer auth API for Sprint 1 UI.
 * Session source of truth: Supabase (via AuthProvider + employerAuthService).
 */
export function useEmployerAuth() {
  const {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    refreshSession,
  } = useAuth();

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(
    null,
  );
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);

  useEffect(() => {
    setPendingVerificationEmail(employerAuthService.getPendingVerificationEmail());
  }, []);

  const isEmployer = Boolean(
    isAuthenticated && user && (user.role === "employer" || user.role === "admin"),
  );

  useEffect(() => {
    let cancelled = false;

    if (!isEmployer) {
      setEmployerProfile(null);
      return;
    }

    (async () => {
      const next = await employerAuthService.getCurrentProfile();
      if (!cancelled) {
        setEmployerProfile(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEmployer, user?.id]);

  const employer: Employer | null = useMemo(() => {
    if (!isEmployer || !user) return null;
    return mapEmployer(user.id, user.email, profile);
  }, [isEmployer, profile, user]);

  const state: AuthState = {
    employer,
    profile: employerProfile,
    session: (session as Session | null) ?? null,
    isAuthenticated: isEmployer,
    isEmployer,
    isLoading,
    pendingVerificationEmail,
  };

  const register = useCallback(
    async (
      data: EmployerRegistrationData,
    ): Promise<AuthResult<{ email: string; needsEmailConfirmation: boolean }>> => {
      const result = await employerAuthService.register(data);
      if (result.success) {
        setPendingVerificationEmail(result.data.email);
        if (!result.data.needsEmailConfirmation) {
          await refreshSession();
        }
      }
      return result;
    },
    [refreshSession],
  );

  const login = useCallback(
    async (data: EmployerLoginData): Promise<AuthResult<EmployerAuthSuccess>> => {
      const result = await employerAuthService.login(data);
      if (result.success) {
        setPendingVerificationEmail(null);
        await refreshSession();
        const { markEmployerSessionStart } = await import(
          "../lib/employerSessionStorage"
        );
        markEmployerSessionStart(result.data.employer.id);
      }
      return result;
    },
    [refreshSession],
  );

  const logout = useCallback(async (): Promise<AuthResult> => {
    const { endEmployerSession } = await import("../lib/endEmployerSession");
    await endEmployerSession({ reason: "explicit" });
    setPendingVerificationEmail(null);
    setEmployerProfile(null);
    await refreshSession();
    return { success: true, data: undefined };
  }, [refreshSession]);

  const requestPasswordReset = useCallback(
    (data: EmployerForgotPasswordData): Promise<AuthResult<{ email: string }>> =>
      employerAuthService.requestPasswordReset(data),
    [],
  );

  const resetPassword = useCallback(
    async (data: EmployerResetPasswordData): Promise<AuthResult> => {
      const result = await employerAuthService.resetPassword(data);
      if (result.success) {
        await refreshSession();
      }
      return result;
    },
    [refreshSession],
  );

  const resendVerificationEmail = useCallback(async (): Promise<AuthResult> => {
    const result = await employerAuthService.resendVerificationEmail(
      pendingVerificationEmail ?? undefined,
    );
    return result;
  }, [pendingVerificationEmail]);

  return {
    ...state,
    user: employer,
    signIn: login,
    signUp: register,
    signOut: logout,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    resendVerificationEmail,
  };
}
