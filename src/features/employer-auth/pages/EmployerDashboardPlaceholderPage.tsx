"use client";

import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthMessage } from "../components/AuthMessage";
import { useEmployerAuth } from "../hooks/useEmployerAuth";

export function EmployerDashboardPlaceholderPage() {
  const router = useRouter();
  const { employer, logout } = useEmployerAuth();

  const onLogout = async () => {
    await logout();
    router.push("/employer/login");
  };

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f0f9ff_50%,#ffffff_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo href="/employer/dashboard" />
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
          >
            Logout
          </button>
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <div className="rounded-[24px] border border-border bg-card/90 p-6 shadow-soft backdrop-blur-xl sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              SAP Jobs Finder
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-dark">
              Employer Dashboard
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
              Authentication successful.
              {employer?.email ? (
                <>
                  {" "}
                  Signed in as <span className="font-semibold text-dark">{employer.email}</span>.
                </>
              ) : null}
            </p>

            <div className="mt-6 space-y-4">
              <AuthMessage variant="success" title="Sprint 1 authentication UI is ready">
                This page exists only so we can test the login flow. Full dashboard features
                belong to Sprint 2.
              </AuthMessage>

              <AuthButton type="button" variant="secondary" onClick={onLogout}>
                Logout
              </AuthButton>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
