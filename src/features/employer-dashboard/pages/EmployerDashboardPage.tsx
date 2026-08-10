"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CalendarDays,
  FileText,
  PlusCircle,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { useCompanySetupStatus } from "@/features/employer-company/hooks/useCompanySetupStatus";
import { QuickActionCard } from "../components/QuickActionCard";
import { RecentApplicantsTable } from "../components/RecentApplicantsTable";
import { RecentJobsTable } from "../components/RecentJobsTable";
import { UpcomingInterviews } from "../components/UpcomingInterviews";
import { useEmployerDashboard } from "../hooks/useEmployerDashboard";

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export function EmployerDashboardPage() {
  const router = useRouter();
  const { setupComplete, isChecking } = useCompanySetupStatus();
  const { data, employer, isLoading, isError, error, reload } = useEmployerDashboard();

  useEffect(() => {
    if (!isChecking && !setupComplete) {
      router.replace(EMPLOYER_ROUTES.onboarding);
    }
  }, [isChecking, setupComplete, router]);

  if (isChecking || (!setupComplete && !isError)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading your workspace…" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Unable to load dashboard data."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  const firstName =
    employer?.firstName ||
    employer?.email?.split("@")[0] ||
    "there";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {data.companyName}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {greetingForNow()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here&apos;s an overview of your hiring activity.
          </p>
          <p className="mt-2 text-xs text-muted">{formatToday()}</p>
        </div>
        <Button href={EMPLOYER_ROUTES.jobsNew}>
          <PlusCircle size={16} aria-hidden="true" />
          Post a Job
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Jobs"
          value={data.stats.activeJobs}
          icon={Briefcase}
          hint={data.stats.activeJobsDelta}
        />
        <StatCard
          label="Draft Jobs"
          value={data.stats.draftJobs}
          icon={FileText}
          tone="info"
          hint={data.stats.draftJobsDelta}
        />
        <StatCard
          label="Applications"
          value={data.stats.totalApplications}
          icon={Users}
          tone="success"
          hint={data.stats.applicationsDelta}
        />
        <StatCard
          label="Upcoming Interviews"
          value={data.stats.upcomingInterviews}
          icon={CalendarDays}
          tone="warning"
          hint={data.stats.interviewsDelta}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            title="Post a Job"
            description="Create a new SAP role"
            href={EMPLOYER_ROUTES.jobsNew}
            icon={PlusCircle}
          />
          <QuickActionCard
            title="View Applicants"
            description="Review recent applications"
            href={EMPLOYER_ROUTES.applicants}
            icon={Users}
          />
          <QuickActionCard
            title="Search Talent"
            description="Find SAP specialists"
            href={EMPLOYER_ROUTES.talentSearch}
            icon={Search}
          />
          <QuickActionCard
            title="View Interviews"
            description="See upcoming interviews"
            href={EMPLOYER_ROUTES.interviews}
            icon={CalendarDays}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">Recent Jobs</h2>
            <Button href={EMPLOYER_ROUTES.jobs} variant="ghost" className="!px-3 !py-2 text-xs">
              Manage Jobs
            </Button>
          </div>
          <RecentJobsTable jobs={data.recentJobs} />
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-text">Upcoming Interviews</h2>
          <UpcomingInterviews interviews={data.upcomingInterviews} />
        </section>
      </div>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-text">Recent Applicants</h2>
        <RecentApplicantsTable applicants={data.recentApplicants} />
      </section>
    </div>
  );
}
