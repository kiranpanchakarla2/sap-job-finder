"use client";

import { Check, Minus } from "lucide-react";
import type { PlanId } from "../types/subscription.types";
import { PLAN_DEFINITIONS, PLAN_LIMITS, canUseFeature } from "../config/planRules";

type ComparisonRow = {
  label: string;
  values: Record<PlanId, string | boolean>;
};

function limitLabel(limit: number | null): string {
  return limit === null ? "Unlimited" : String(limit);
}

const ROWS: ComparisonRow[] = [
  {
    label: "Active Jobs",
    values: {
      free: limitLabel(PLAN_LIMITS.free.activeJobs),
      pro: limitLabel(PLAN_LIMITS.pro.activeJobs),
      business: limitLabel(PLAN_LIMITS.business.activeJobs),
    },
  },
  {
    label: "Analytics",
    values: {
      free: "Basic",
      pro: "Advanced",
      business: "Advanced",
    },
  },
  {
    label: "Talent Search",
    values: {
      free: canUseFeature("free", "talent_search"),
      pro: canUseFeature("pro", "talent_search"),
      business: canUseFeature("business", "talent_search"),
    },
  },
  {
    label: "Messaging",
    values: {
      free: canUseFeature("free", "candidate_messaging"),
      pro: canUseFeature("pro", "candidate_messaging"),
      business: canUseFeature("business", "candidate_messaging"),
    },
  },
  {
    label: "Interview Management",
    values: {
      free: canUseFeature("free", "interview_management"),
      pro: canUseFeature("pro", "interview_management"),
      business: canUseFeature("business", "interview_management"),
    },
  },
  {
    label: "Team Members",
    values: {
      free: limitLabel(PLAN_LIMITS.free.teamMembers),
      pro: limitLabel(PLAN_LIMITS.pro.teamMembers),
      business: limitLabel(PLAN_LIMITS.business.teamMembers),
    },
  },
  {
    label: "Support",
    values: {
      free: "Standard",
      pro: "Priority features",
      business: "Priority support",
    },
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1 text-success">
        <Check size={16} aria-hidden="true" />
        <span className="sr-only">Included</span>
        <span aria-hidden="true">Yes</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted">
        <Minus size={16} aria-hidden="true" />
        <span className="sr-only">Not included</span>
        <span aria-hidden="true">No</span>
      </span>
    );
  }
  return <span>{value}</span>;
}

export function PlanComparison() {
  const plans = PLAN_DEFINITIONS;

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-text">Plan comparison</h2>
      <p className="mt-1 text-sm text-muted">
        Compare features and limits across Free, Pro, and Business.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[36rem] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-3 font-semibold">Feature</th>
              {plans.map((plan) => (
                <th key={plan.id} className="px-3 py-3 font-semibold">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border/70 last:border-0">
                <th scope="row" className="px-3 py-3.5 font-medium text-text">
                  {row.label}
                </th>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-3 py-3.5 text-muted">
                    <CellValue value={row.values[plan.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
