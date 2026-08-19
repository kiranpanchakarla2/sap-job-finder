"use client";

/**
 * UsersKpiSection Component
 * Displays User KPIs: Total Candidates, Total Employers, New Candidates, New Employers.
 */

import { Building2, UserCheck, UserPlus, Users } from "lucide-react";
import { DashboardKpiCard } from "./DashboardKpiCard";
import type { UsersKpis } from "../types/dashboard.types";

type UsersKpiSectionProps = {
  kpis: UsersKpis;
  periodLabel: string;
  loading?: boolean;
  error?: string | null;
};

export function UsersKpiSection({
  kpis,
  periodLabel,
  loading = false,
  error = null,
}: UsersKpiSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Users Overview
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Candidates */}
        <DashboardKpiCard
          title="Total Candidates"
          value={kpis.totalCandidates}
          icon={Users}
          iconColorClass="text-blue-500"
          iconBgClass="bg-blue-500/10"
          description="Total registered candidates"
          badge={{ text: "All Time", variant: "neutral" }}
          loading={loading}
          error={error}
        />

        {/* Total Employers */}
        <DashboardKpiCard
          title="Total Employers"
          value={kpis.totalEmployers}
          icon={Building2}
          iconColorClass="text-indigo-500"
          iconBgClass="bg-indigo-500/10"
          description="Registered company organizations"
          badge={{ text: "All Time", variant: "neutral" }}
          loading={loading}
          error={error}
        />

        {/* New Candidates in Range */}
        <DashboardKpiCard
          title="New Candidates"
          value={kpis.newCandidates}
          icon={UserPlus}
          iconColorClass="text-emerald-500"
          iconBgClass="bg-emerald-500/10"
          description={`Registered in ${periodLabel.toLowerCase()}`}
          badge={{ text: periodLabel, variant: "success" }}
          loading={loading}
          error={error}
        />

        {/* New Employers in Range */}
        <DashboardKpiCard
          title="New Employers"
          value={kpis.newEmployers}
          icon={UserCheck}
          iconColorClass="text-violet-500"
          iconBgClass="bg-violet-500/10"
          description={`Joined in ${periodLabel.toLowerCase()}`}
          badge={{ text: periodLabel, variant: "primary" }}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
