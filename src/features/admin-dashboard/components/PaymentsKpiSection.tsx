"use client";

/**
 * PaymentsKpiSection Component
 * Displays Payments KPIs: Pending Payment Requests, Payments Received, Total Collected, Period Revenue.
 */

import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { DashboardKpiCard } from "./DashboardKpiCard";
import type { PaymentKpis } from "../types/dashboard.types";

type PaymentsKpiSectionProps = {
  kpis: PaymentKpis;
  periodLabel: string;
  loading?: boolean;
  error?: string | null;
};

export function PaymentsKpiSection({
  kpis,
  periodLabel,
  loading = false,
  error = null,
}: PaymentsKpiSectionProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Payments & Revenue Overview
        </h2>
        <span className="text-[11px] text-muted">Manual payment flow metrics</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Payment Requests */}
        <DashboardKpiCard
          title="Pending Requests"
          value={kpis.pendingRequestsCount}
          icon={Clock}
          iconColorClass="text-amber-500"
          iconBgClass="bg-amber-500/10"
          description="Awaiting link dispatch / confirmation"
          badge={{
            text: kpis.pendingRequestsCount > 0 ? "Pending Action" : "Clear",
            variant: kpis.pendingRequestsCount > 0 ? "warning" : "success",
          }}
          loading={loading}
          error={error}
        />

        {/* Payments Received Count */}
        <DashboardKpiCard
          title="Payments Recorded"
          value={kpis.paymentsReceivedCount}
          icon={CheckCircle2}
          iconColorClass="text-emerald-500"
          iconBgClass="bg-emerald-500/10"
          description="Successfully settled payments"
          badge={{ text: "All Time", variant: "neutral" }}
          loading={loading}
          error={error}
        />

        {/* Total Amount Collected */}
        <DashboardKpiCard
          title="Total Collected"
          value={formatCurrency(kpis.totalAmountCollected)}
          icon={Banknote}
          iconColorClass="text-primary"
          iconBgClass="bg-primary/10"
          description="Cumulative manual subscription revenue"
          badge={{ text: "All Time", variant: "primary" }}
          loading={loading}
          error={error}
        />

        {/* Collected In Period */}
        <DashboardKpiCard
          title="Revenue In Period"
          value={formatCurrency(kpis.collectedInPeriod)}
          icon={TrendingUp}
          iconColorClass="text-teal-500"
          iconBgClass="bg-teal-500/10"
          description={`${kpis.requestsInPeriod} request(s) in ${periodLabel.toLowerCase()}`}
          badge={{ text: periodLabel, variant: "success" }}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
