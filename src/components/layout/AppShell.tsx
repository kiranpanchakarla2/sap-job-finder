import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import type { AuthUser } from "@/lib/auth/session";

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar fullName={user.fullName} email={user.email} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
