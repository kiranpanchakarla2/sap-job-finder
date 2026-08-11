"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import {
  canCreateJob,
  JobLimitReachedPanel,
  subscriptionService,
  type EmployerSubscription,
} from "@/features/employer-subscription";
import { JobForm } from "../components/JobForm";
import { jobService } from "../services/jobService";

export function CreateJobPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [subscription, setSubscription] = useState<EmployerSubscription | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      const [profileResult, subscriptionResult] = await Promise.all([
        jobService.getCompanyProfileStatus(),
        subscriptionService.getSubscription(),
      ]);
      if (!active) return;
      setProfileReady(profileResult.success && profileResult.data.ready);
      setSubscription(
        subscriptionResult.success ? subscriptionResult.data : null,
      );
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  if (!profileReady) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Complete your company profile
        </h1>
        <p className="mt-3 text-sm text-muted">
          Complete your company profile before posting a job.
        </p>
        <div className="mt-6">
          <Button href={EMPLOYER_ROUTES.onboarding}>Complete Company Profile</Button>
        </div>
        <p className="mt-4 text-xs text-muted">
          Already completed setup?{" "}
          <Link href={EMPLOYER_ROUTES.company} className="text-primary hover:underline">
            Review company profile
          </Link>
        </p>
      </div>
    );
  }

  if (subscription && !canCreateJob(subscription)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Post a Job
          </h1>
          <p className="mt-1 text-sm text-muted">
            Create a new opportunity and connect with qualified SAP professionals.
          </p>
        </div>
        <JobLimitReachedPanel
          subscription={subscription}
          onUpgrade={() => router.push(EMPLOYER_ROUTES.subscription)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Post a Job
        </h1>
        <p className="mt-1 text-sm text-muted">
          Create a new opportunity and connect with qualified SAP professionals.
        </p>
      </div>
      <JobForm mode="create" />
    </div>
  );
}
