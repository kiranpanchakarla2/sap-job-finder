"use client";

import { EmployerProtectedRoute } from "@/features/employer-auth";
import { EmployerSessionProvider } from "@/features/employer-auth/components/EmployerSessionProvider";
import { CompanyOnboardingPage } from "@/features/employer-company";

export default function Page() {
  return (
    <EmployerProtectedRoute>
      <EmployerSessionProvider>
        <CompanyOnboardingPage />
      </EmployerSessionProvider>
    </EmployerProtectedRoute>
  );
}
