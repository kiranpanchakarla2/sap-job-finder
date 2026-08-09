import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginEmployer } from "@/auth/LoginEmployer";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Employer Login — ${siteConfig.name}`,
  description: "Hire the right SAP professionals with ERPJobs.",
};

export default function EmployerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <LoginEmployer />
    </Suspense>
  );
}
