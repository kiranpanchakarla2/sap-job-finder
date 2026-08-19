"use client";

/**
 * SubscriptionsKpiSection Component
 * Displays Subscription KPIs: Active and Expiring Candidate & Employer Subscriptions.
 */

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  UserCheck,
} from "lucide-react";
import { DashboardKpiCard } from "./DashboardKpiCard";
import type { SubscriptionKpis } from "../types/dashboard.types";

type SubscriptionsKpiSectionProps = {
  kpis: SubscriptionKpis;
  loading?: boolean;
  error?: string | null;
};

export function SubscriptionsKpiSection({
  kpis,
  loading = false,
  error = null,
}: SubscriptionsKpiSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Subscriptions Overview
        </h2>
        <span className="text-[11px] text-muted">
          Active & expiring platform plans
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Candidate Subscriptions */}
        <DashboardKpiCard
          title="Active Candidate Subs"
          value={kpis.activeCandidateSubs}
          icon={CheckCircle2}
          iconColorClass="text-emerald-500"
          iconBgClass="bg-emerald-500/10"
          description="Active premium candidates"
          badge={{ text: "Candidate", variant: "success" }}
          loading={loading}
          error={error}
        />

        {/* Expiring Candidate Subscriptions */}
        <DashboardKpiCard
          title="Expiring Candidate Subs"
          value={kpis.expiringCandidateSubs}
          icon={Clock}
          iconColorClass="text-amber-500"
          iconBgClass="bg-amber-500/10"
          description="Expiring in the next 7 days"
          badge={{
            text: kpis.expiringCandidateSubs > 0 ? "Needs Renewal" : "Stable",
            variant: kpis.expiringCandidateSubs > 0 ? "warning" : "neutral",
          }}
          loading={loading}
          error={error}
        />

        {/* Active Employer Subscriptions */}
        <DashboardKpiCard
          title="Active Employer Subs"
          value={kpis.activeEmployerSubs}
          icon={Building2}
          iconColorClass="text-primary"
          iconBgClass="bg-primary/10"
          description="Active employer plans"
          badge={{ text: "Employer", variant: "primary" }}
          loading={loading}
          error={error}
        />

        {/* Expiring Employer Subscriptions */}
        <DashboardKpiCard
          title="Expiring Employer Subs"
          value={kpis.expiringEmployerSubs}
          icon={AlertTriangle}
          iconColorClass="text-rose-500"
          iconBgClass="bg-rose-500/10"
          description="Expiring in the next 7 days"
          badge={{
            text: kpis.expiringEmployerSubs > 0 ? "Action Required" : "Stable",
            variant: kpis.expiringEmployerSubs > 0 ? "danger" : "neutral",
          }}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
