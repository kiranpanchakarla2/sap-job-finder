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
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import type { AuthRole } from "@/types/auth";

const CANDIDATE_ROLES: AuthRole[] = ["candidate", "admin"];

function useCandidateNavSections(): SidebarNavSection[] {
  const { savedCount } = useSavedJobs();
  const { applicationCount } = useApplications();

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
        return item;
      }),
    }));
  }, [savedCount, applicationCount]);
}

export function CandidateLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sections = useCandidateNavSections();

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
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader
            onMenuClick={() => setSidebarOpen(true)}
            searchPlaceholder="Search SAP jobs, companies…"
            notificationsHref="/candidate/notifications"
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
