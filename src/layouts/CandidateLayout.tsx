"use client";

import { useState, type ReactNode } from "react";
import {
  DashboardSidebar,
  candidateNavSections,
} from "@/components/dashboard/shared/DashboardSidebar";
import { TopHeader } from "@/components/dashboard/shared/TopHeader";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import type { AuthRole } from "@/types/auth";

const CANDIDATE_ROLES: AuthRole[] = ["candidate", "admin"];

export function CandidateLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={CANDIDATE_ROLES}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          sections={candidateNavSections}
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
