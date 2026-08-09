"use client";

import { useState, type ReactNode } from "react";
import {
  DashboardSidebar,
  employerNavSections,
} from "@/components/dashboard/shared/DashboardSidebar";
import { TopHeader } from "@/components/dashboard/shared/TopHeader";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import type { AuthRole } from "@/types/auth";

const EMPLOYER_ROLES: AuthRole[] = ["employer", "admin"];

export function EmployerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          sections={employerNavSections}
          homeHref="/employer/dashboard"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ariaLabel="Employer navigation"
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
    </ProtectedRoute>
  );
}
