"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  buildAuthUser,
  getCurrentProfile,
  getLogoutRedirectPath,
  getSession,
  login as loginService,
  logout as logoutService,
  registerCandidate as registerCandidateService,
  registerEmployer as registerEmployerService,
  subscribeToAuthChanges,
} from "@/services/authService";
import type { AuthProfile, AuthRole, AuthUser } from "@/types/auth";
import type { CandidateRegisterInput } from "@/types/candidate";
import type { EmployerRegisterInput } from "@/types/employer";

type AuthActionResult =
  | { success: true; needsEmailConfirmation?: boolean }
  | { success: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  profile: AuthProfile | null;
  role: AuthRole | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (email: string, password: string, role: AuthRole) => Promise<AuthActionResult>;
  registerCandidate: (data: CandidateRegisterInput) => Promise<AuthActionResult>;
  registerEmployer: (data: EmployerRegisterInput) => Promise<AuthActionResult>;
  logout: () => Promise<string>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setUser(null);
      setProfile(null);
      return;
    }

    const [authUser, authProfile] = await Promise.all([
      buildAuthUser(nextSession.user),
      getCurrentProfile(),
    ]);

    setUser(authUser);
    setProfile(authProfile);
  }, []);

  const refreshSession = useCallback(async () => {
    const current = await getSession();
    await applySession(current);
  }, [applySession]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const current = await getSession();
        if (!mounted) return;
        await applySession(current);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    const unsubscribe = subscribeToAuthChanges((event, nextSession) => {
      if (!mounted) return;

      // Initial state is handled by the validated getSession() call above.
      // Applying Supabase's storage-backed INITIAL_SESSION directly can briefly
      // mount protected data loaders with a stale token.
      if (event === "INITIAL_SESSION") return;

      window.setTimeout(() => {
        if (!mounted) return;
        void applySession(nextSession).finally(() => {
          if (mounted) setIsLoading(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string, role: AuthRole) => {
      const result = await loginService(email, password, role);
      if (!result.success) {
        return { success: false as const, error: result.error };
      }
      await refreshSession();
      return { success: true as const };
    },
    [refreshSession],
  );

  const registerCandidate = useCallback(
    async (data: CandidateRegisterInput) => {
      const result = await registerCandidateService(data);
      if (!result.success) {
        return { success: false as const, error: result.error };
      }
      if (result.needsEmailConfirmation) {
        return { success: true as const, needsEmailConfirmation: true };
      }
      await refreshSession();
      return { success: true as const };
    },
    [refreshSession],
  );

  const registerEmployer = useCallback(
    async (data: EmployerRegisterInput) => {
      const result = await registerEmployerService(data);
      if (!result.success) {
        return { success: false as const, error: result.error };
      }
      if (result.needsEmailConfirmation) {
        return { success: true as const, needsEmailConfirmation: true };
      }
      await refreshSession();
      return { success: true as const };
    },
    [refreshSession],
  );

  const logout = useCallback(async () => {
    const role = user?.role ?? profile?.role ?? null;
    await logoutService();
    setUser(null);
    setProfile(null);
    setSession(null);
    return getLogoutRedirectPath(role);
  }, [profile?.role, user?.role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role: user?.role ?? profile?.role ?? null,
      session,
      token: session?.access_token ?? null,
      isAuthenticated: Boolean(session?.user && user),
      isLoading,
      loading: isLoading,
      login,
      registerCandidate,
      registerEmployer,
      logout,
      refreshSession,
    }),
    [
      user,
      profile,
      session,
      isLoading,
      login,
      registerCandidate,
      registerEmployer,
      logout,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
