"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { getDashboardPathForRole } from "@/types/auth";
import { useAuth } from "@/auth/AuthContext";
import { useEmployerAuth } from "../hooks/useEmployerAuth";

type EmployerProtectedRouteProps = {
  children: ReactNode;
};

/**
 * Protects employer routes using Supabase session + profiles.role.
 * Candidates (and unauthenticated users) are redirected away.
 */
export function EmployerProtectedRoute({ children }: EmployerProtectedRouteProps) {
  const { isEmployer, isLoading } = useEmployerAuth();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isEmployer) {
      if (isAuthenticated && user?.role === "candidate") {
        router.replace(getDashboardPathForRole("candidate"));
        return;
      }
      router.replace(`/employer/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isEmployer, isLoading, pathname, router, user?.role]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Checking your session…" />
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
      [employer.firstName, employer.lastName].filter(Boolean).join(" ") || employer.email,
    source: "supabase" as const,
  };
}
