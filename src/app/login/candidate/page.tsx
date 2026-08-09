import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginCandidate } from "@/auth/LoginCandidate";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Candidate Login — ${siteConfig.name}`,
  description: "Sign in to continue your ERPJobs career journey.",
};

export default function CandidateLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <LoginCandidate />
    </Suspense>
  );
}
