"use client";

import { useState, type ReactNode } from "react";
import {
  DashboardSidebar,
  employerNavSections,
} from "@/components/dashboard/shared/DashboardSidebar";
import { TopHeader } from "@/components/dashboard/shared/TopHeader";
import { EmployerProtectedRoute } from "@/features/employer-auth/components/EmployerProtectedRoute";

export function EmployerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <EmployerProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          sections={employerNavSections}
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
            notificationCount={5}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </EmployerProtectedRoute>
  );
}
