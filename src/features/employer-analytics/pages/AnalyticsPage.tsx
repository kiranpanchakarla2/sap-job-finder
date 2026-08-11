"use client";

import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { AnalyticsExportMenu } from "../components/AnalyticsExportMenu";
import { AnalyticsFiltersBar } from "../components/AnalyticsFilters";
import { AnalyticsKpiCard } from "../components/AnalyticsKpiCard";
import { AnalyticsSkeleton } from "../components/AnalyticsSkeleton";
import { ApplicationFunnel } from "../components/ApplicationFunnel";
import { ApplicationStatusBreakdown } from "../components/ApplicationStatusBreakdown";
import { ApplicationTrend } from "../components/ApplicationTrend";
import { HiringOverviewCard } from "../components/HiringOverview";
import { InterviewAnalyticsCard } from "../components/InterviewAnalytics";
import { JobPerformanceTable } from "../components/JobPerformanceTable";
import { TopPerformingJobs } from "../components/TopPerformingJobs";
import { useEmployerAnalytics } from "../hooks/useEmployerAnalytics";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

export function AnalyticsPage() {
  const { filters, updateFilters, data, isLoading, isError, error, reload } =
    useEmployerAnalytics();

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <ErrorState
          title="Unable to load analytics."
          description={error ?? undefined}
          onRetry={reload}
        />
      </div>
    );
  }

  if (!data.hasJobs) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted">
            Track your hiring performance and job activity.
          </p>
        </div>
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Post your first job to start seeing hiring analytics."
          action={<Button href={EMPLOYER_ROUTES.jobsNew}>Post a Job</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted">
            Track your hiring performance and job activity.
          </p>
        </div>
        <AnalyticsExportMenu />
      </div>

      <AnalyticsFiltersBar
        filters={filters}
        jobs={data.jobs}
        onChange={updateFilters}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((kpi) => (
          <AnalyticsKpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <SectionCard title="Job Performance">
        <JobPerformanceTable rows={data.jobPerformance} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Application Funnel">
          <ApplicationFunnel stages={data.funnel} />
        </SectionCard>
        <SectionCard title="Application Overview">
          <ApplicationStatusBreakdown items={data.statusBreakdown} />
        </SectionCard>
      </div>

      <SectionCard title="Applications Over Time">
        <ApplicationTrend points={data.trend} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Interview Performance">
          <InterviewAnalyticsCard data={data.interviews} />
        </SectionCard>
        <SectionCard title="Hiring Overview">
          <HiringOverviewCard data={data.hiring} />
        </SectionCard>
      </div>

      <SectionCard title="Top Performing Jobs">
        <TopPerformingJobs jobs={data.topJobs} />
      </SectionCard>
    </div>
  );
}
