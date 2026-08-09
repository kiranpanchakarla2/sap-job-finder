"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { getDashboardPathForRole, type AuthRole } from "@/types/auth";

/**
 * Redirects authenticated users away from login/register pages
 * to their role dashboard.
 */
export function GuestOnlyRoute({
  children,
  expectedRole,
}: {
  children: ReactNode;
  expectedRole?: AuthRole;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      if (expectedRole && user.role !== expectedRole && user.role !== "admin") {
        router.replace(getDashboardPathForRole(user.role));
        return;
      }
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [expectedRole, isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner label="Loading…" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner label="Redirecting…" />
      </div>
    );
  }

  return <>{children}</>;
}
