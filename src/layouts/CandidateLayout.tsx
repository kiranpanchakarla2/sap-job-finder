"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  DashboardSidebar,
  candidateNavSections,
  type SidebarNavSection,
} from "@/components/dashboard/shared/DashboardSidebar";
import { TopHeader } from "@/components/dashboard/shared/TopHeader";
import { useApplications } from "@/features/candidate-applications";
import { useSavedJobs } from "@/features/candidate-jobs";
import { useJobAlerts } from "@/features/candidate-alerts";
import { useCandidateMessages } from "@/features/candidate-messages";
import { useCandidateNotifications } from "@/features/candidate-notifications";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import type { AuthRole } from "@/types/auth";

const CANDIDATE_ROLES: AuthRole[] = ["candidate", "admin"];

function useCandidateNavSections(): SidebarNavSection[] {
  const { savedCount } = useSavedJobs();
  const { applicationCount } = useApplications();
  const { activeAlertsCount } = useJobAlerts();
  const { unreadCount } = useCandidateMessages();
  const { unreadCount: notificationsCount } = useCandidateNotifications();

  return useMemo(() => {
    return candidateNavSections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.href === "/candidate/saved-jobs") {
          return { ...item, badgeCount: savedCount || undefined };
        }
        if (item.href === "/candidate/applications") {
          return { ...item, badgeCount: applicationCount || undefined };
        }
        if (item.href === "/candidate/job-alerts") {
          return { ...item, badgeCount: activeAlertsCount || undefined };
        }
        if (item.href === "/candidate/messages") {
          return { ...item, badgeCount: unreadCount || undefined };
        }
        if (item.href === "/candidate/notifications") {
          return { ...item, badgeCount: notificationsCount || undefined };
        }
        return item;
      }),
    }));
  }, [savedCount, applicationCount, activeAlertsCount, unreadCount, notificationsCount]);
}

export function CandidateLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sections = useCandidateNavSections();
  const { unreadCount: notificationsCount } = useCandidateNotifications();

  return (
    <ProtectedRoute allowedRoles={CANDIDATE_ROLES}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          sections={sections}
          homeHref="/candidate/dashboard"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ariaLabel="Candidate navigation"
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopHeader
            onMenuClick={() => setSidebarOpen(true)}
            searchPlaceholder="Search SAP jobs, companies…"
            notificationsHref="/candidate/notifications"
            notificationCount={notificationsCount}
          />
          <main className="flex-1 min-w-0 w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
