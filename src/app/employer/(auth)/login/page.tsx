import { Suspense } from "react";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { EmployerLoginPage } from "@/features/employer-auth/pages/EmployerLoginPage";

export default function EmployerLoginRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <LoadingSpinner label="Loading…" />
        </div>
      }
    >
      <EmployerLoginPage />
    </Suspense>
  );
}
