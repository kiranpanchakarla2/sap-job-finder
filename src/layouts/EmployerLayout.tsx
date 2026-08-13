"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DashboardSidebar,
  employerNavSections,
  type SidebarNavSection,
} from "@/components/dashboard/shared/DashboardSidebar";
import { TopHeader } from "@/components/dashboard/shared/TopHeader";
import { EmployerProtectedRoute } from "@/features/employer-auth/components/EmployerProtectedRoute";
import { EmployerSessionProvider } from "@/features/employer-auth/components/EmployerSessionProvider";
import { useEmployerAuth } from "@/features/employer-auth/hooks/useEmployerAuth";
import { resolveEmployerMembership } from "@/features/employer-auth/services/employerMembershipService";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { canManageEmployerAccounts } from "@/lib/auth/employerPermissions";
import { useUnreadMessageCount } from "@/features/employer-messages";

export function EmployerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const { isEmployer, isLoading: authLoading } = useEmployerAuth();
  const canLoadEmployerData = !authLoading && isEmployer;
  const { unreadCount } = useUnreadMessageCount(canLoadEmployerData);

  useEffect(() => {
    if (!canLoadEmployerData) {
      setCanManageTeam(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await resolveEmployerMembership();
      if (cancelled) return;
      setCanManageTeam(
        result.status === "active" &&
          canManageEmployerAccounts(result.membership.role),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [canLoadEmployerData]);

  const sections = useMemo<SidebarNavSection[]>(
    () =>
      employerNavSections.map((section) => ({
        ...section,
        items: section.items
          .filter((item) =>
            canManageTeam ? true : item.href !== EMPLOYER_ROUTES.team,
          )
          .map((item) =>
            item.href === "/employer/messages"
              ? { ...item, badgeCount: unreadCount }
              : item,
          ),
      })),
    [canManageTeam, unreadCount],
  );

  return (
    <EmployerProtectedRoute>
      <EmployerSessionProvider>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar
            sections={sections}
            homeHref="/employer/dashboard"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ariaLabel="Employer navigation"
            collapsible
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopHeader
              onMenuClick={() => setSidebarOpen(true)}
              searchPlaceholder="Search applicants, jobs…"
              notificationsHref="/employer/messages"
              notificationCount={unreadCount}
            />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </EmployerSessionProvider>
    </EmployerProtectedRoute>
  );
}
