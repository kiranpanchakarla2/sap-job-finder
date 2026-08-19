"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { getHomePathForRole } from "@/lib/auth/roles";
import { useAdminAuth } from "../hooks/useAdminAuth";

type AdminProtectedRouteProps = {
  children: ReactNode;
};

/**
 * Client-side route guard for all /admin routes.
 * Enforces authenticated super_admin role and prevents unauthorized flash of content.
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isSuperAdmin, isAuthenticated, role, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isSuperAdmin) {
      // Authenticated as candidate or employer — redirect to their dashboard
      if (role) {
        router.replace(getHomePathForRole(role));
      } else {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      }
    }
  }, [isAuthenticated, isLoading, isSuperAdmin, pathname, role, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Verifying admin credentials…" />
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Redirecting…" />
      </div>
    );
  }

  return <>{children}</>;
}
