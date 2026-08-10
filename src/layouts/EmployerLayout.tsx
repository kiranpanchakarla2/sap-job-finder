"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  DashboardSidebar,
  employerNavSections,
  type SidebarNavSection,
} from "@/components/dashboard/shared/DashboardSidebar";
import { TopHeader } from "@/components/dashboard/shared/TopHeader";
import { EmployerProtectedRoute } from "@/features/employer-auth/components/EmployerProtectedRoute";
import { useUnreadMessageCount } from "@/features/employer-messages";

export function EmployerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useUnreadMessageCount();

  const sections = useMemo<SidebarNavSection[]>(
    () =>
      employerNavSections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.href === "/employer/messages"
            ? { ...item, badgeCount: unreadCount }
            : item,
        ),
      })),
    [unreadCount],
  );

  return (
    <EmployerProtectedRoute>
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
    </EmployerProtectedRoute>
  );
}
