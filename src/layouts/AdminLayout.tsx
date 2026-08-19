"use client";

import { useState, type ReactNode } from "react";
import { AdminProtectedRoute } from "@/features/admin-auth/components/AdminProtectedRoute";
import { AdminSidebar } from "@/features/admin-shell/components/AdminSidebar";
import { AdminTopHeader } from "@/features/admin-shell/components/AdminTopHeader";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminTopHeader
            onMenuClick={() => setSidebarOpen(true)}
            title={title}
            subtitle={subtitle}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
