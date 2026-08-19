"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import {
  getDashboardPathForRole,
  getLoginPathForRole,
  type AuthRole,
} from "@/types/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: AuthRole[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      const preferredRole = allowedRoles[0] ?? "candidate";
      const loginPath = getLoginPathForRole(preferredRole);
      router.replace(`${loginPath}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.status === "suspended") {
      const loginPath = getLoginPathForRole(user.role);
      router.replace(`${loginPath}?error=suspended`);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [allowedRoles, isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Checking your session…" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Redirecting…" />
      </div>
    );
  }

  return <>{children}</>;
}
