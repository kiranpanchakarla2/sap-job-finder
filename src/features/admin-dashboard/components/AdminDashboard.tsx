"use client";

/**
 * AdminDashboard Master Component
 * Sprint 10B: Main command center dashboard for CTO/CEO super administrators.
 */

import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { AdminDashboardHeader } from "./AdminDashboardHeader";
import { ContactUsSummaryCard } from "./ContactUsSummaryCard";
import { DashboardErrorState } from "./DashboardErrorState";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PaymentsKpiSection } from "./PaymentsKpiSection";
import { PendingPaymentsTable } from "./PendingPaymentsTable";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { RecentCandidatesTable } from "./RecentCandidatesTable";
import { RecentEmployersTable } from "./RecentEmployersTable";
import { RecentJobsTable } from "./RecentJobsTable";
import { SapModulesSummaryCard } from "./SapModulesSummaryCard";
import { SubscriptionsKpiSection } from "./SubscriptionsKpiSection";
import { SubscriptionSummaryCard } from "./SubscriptionSummaryCard";
import { UsersKpiSection } from "./UsersKpiSection";

export function AdminDashboard() {
  const {
    dateRange,
    changeDateRange,
    data,
    errors,
    loading,
    refreshing,
    refresh,
  } = useAdminDashboard("30d");

  // Show full skeleton during initial loading when data is not yet available
  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const hasFatalError =
    errors.users && errors.subscriptions && errors.payments;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header with Title, Date Range Selector & Refresh Button */}
      <AdminDashboardHeader
        dateRange={dateRange}
        onDateRangeChange={changeDateRange}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      {/* Error alert banner if any query encountered an issue */}
      {hasFatalError && (
        <DashboardErrorState
          message="Could not load complete metrics from the database. Please check connection and retry."
          onRetry={refresh}
        />
      )}

      {/* 2. Users Primary KPI Cards */}
      {data && (
        <UsersKpiSection
          kpis={data.users}
          periodLabel={dateRange.label}
          loading={refreshing}
          error={errors.users}
        />
      )}

      {/* 3. Subscriptions Primary KPI Cards */}
      {data && (
        <SubscriptionsKpiSection
          kpis={data.subscriptions}
          loading={refreshing}
          error={errors.subscriptions}
        />
      )}

      {/* 4. Payments Primary KPI Cards */}
      {data && (
        <PaymentsKpiSection
          kpis={data.payments}
          periodLabel={dateRange.label}
          loading={refreshing}
          error={errors.payments}
        />
      )}

      {/* 5. Pending Payment Requests (Prominent Operational Table) */}
      {data && (
        <PendingPaymentsTable
          items={data.pendingPayments}
          loading={refreshing}
          error={errors.pendingPayments}
        />
      )}

      {/* 6. Subscription Summary & Breakdown Overview */}
      {data && (
        <SubscriptionSummaryCard
          kpis={data.subscriptions}
          loading={refreshing}
          error={errors.subscriptions}
        />
      )}

      {/* 7. Two-Column Grid: Recent Activity Stream & Recent Candidates */}
      {data && (
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <RecentActivityFeed
            activities={data.recentActivity}
            loading={refreshing}
            error={errors.recentActivity}
          />
          <RecentCandidatesTable
            candidates={data.recentCandidates}
            loading={refreshing}
            error={errors.recentCandidates}
          />
        </div>
      )}

      {/* 8. Two-Column Grid: Recent Employers & Recent Jobs */}
      {data && (
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <RecentEmployersTable
            employers={data.recentEmployers}
            loading={refreshing}
            error={errors.recentEmployers}
          />
          <RecentJobsTable
            jobs={data.recentJobs}
            loading={refreshing}
            error={errors.recentJobs}
          />
        </div>
      )}

      {/* 9. Two-Column Grid: Contact Us & SAP Modules Summaries */}
      {data && (
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <ContactUsSummaryCard
            summary={data.contactUs}
            loading={refreshing}
            error={errors.contactUs}
          />
          <SapModulesSummaryCard
            summary={data.sapModules}
            loading={refreshing}
            error={errors.sapModules}
          />
        </div>
      )}
    </div>
  );
}
