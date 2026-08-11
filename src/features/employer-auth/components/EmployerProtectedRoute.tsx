"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { getDashboardPathForRole } from "@/types/auth";
import { useAuth } from "@/auth/AuthContext";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { EMPLOYER_SESSION_MESSAGES } from "../config/employerSession";
import { endEmployerSession } from "../lib/endEmployerSession";
import { useEmployerAuth } from "../hooks/useEmployerAuth";
import { resolveEmployerMembership } from "../services/employerMembershipService";
import type { EmployerMembershipRecord } from "../services/employerMembershipService";

type EmployerProtectedRouteProps = {
  children: ReactNode;
};

type GateState =
  | { phase: "loading" }
  | { phase: "ready"; membership: EmployerMembershipRecord | null }
  | { phase: "redirecting" };

/**
 * Centralized Employer route guard.
 *
 * Auth (Supabase) → platform employer role → active employer_accounts → render.
 * Suspended memberships are blocked; missing membership goes to onboarding.
 */
export function EmployerProtectedRoute({ children }: EmployerProtectedRouteProps) {
  const { isEmployer, isLoading } = useEmployerAuth();
  const { isAuthenticated, user, refreshSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<GateState>({ phase: "loading" });

  useEffect(() => {
    if (isLoading) return;

    if (!isEmployer) {
      setGate({ phase: "redirecting" });
      if (isAuthenticated && user?.role === "candidate") {
        router.replace(getDashboardPathForRole("candidate"));
        return;
      }
      router.replace(`/employer/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    let cancelled = false;

    (async () => {
      setGate({ phase: "loading" });
      const result = await resolveEmployerMembership();
      if (cancelled) return;

      if (result.status === "suspended") {
        setGate({ phase: "redirecting" });
        const redirect = await endEmployerSession({ reason: "suspended" });
        await refreshSession();
        router.replace(redirect);
        return;
      }

      if (result.status === "missing" || result.status === "error") {
        // Platform employer without membership: complete company onboarding.
        if (!pathname.startsWith(EMPLOYER_ROUTES.onboarding)) {
          setGate({ phase: "redirecting" });
          router.replace(EMPLOYER_ROUTES.onboarding);
          return;
        }
        setGate({ phase: "ready", membership: null });
        return;
      }

      setGate({ phase: "ready", membership: result.membership });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    isEmployer,
    isLoading,
    pathname,
    refreshSession,
    router,
    user?.role,
  ]);

  if (isLoading || gate.phase === "loading" || gate.phase === "redirecting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner
          label={
            gate.phase === "redirecting"
              ? "Redirecting…"
              : "Checking your session…"
          }
        />
      </div>
    );
  }

  if (!isEmployer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Redirecting…" />
      </div>
    );
  }

  return <>{children}</>;
}

export function useEmployerSessionIdentity() {
  const { employer, isEmployer } = useEmployerAuth();

  if (!isEmployer || !employer) return null;

  return {
    email: employer.email,
    name:
      [employer.firstName, employer.lastName].filter(Boolean).join(" ") ||
      employer.email,
    source: "supabase" as const,
  };
}

/** @deprecated message helper kept for login banner */
export function employerSuspendedMessage() {
  return EMPLOYER_SESSION_MESSAGES.suspended;
}
