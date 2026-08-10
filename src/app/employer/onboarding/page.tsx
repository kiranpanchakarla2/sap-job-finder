"use client";

import { EmployerProtectedRoute } from "@/features/employer-auth";
import { CompanyOnboardingPage } from "@/features/employer-company";

export default function Page() {
  return (
    <EmployerProtectedRoute>
      <CompanyOnboardingPage />
    </EmployerProtectedRoute>
  );
}
