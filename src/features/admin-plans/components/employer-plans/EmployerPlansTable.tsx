"use client";

import { memo } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  Power,
  Sparkles,
  Users,
} from "lucide-react";
import type { AdminEmployerPlan } from "../../types/plan.types";

type EmployerPlansTableProps = {
  plans: AdminEmployerPlan[];
  isLoading: boolean;
  error: string | null;
  onDeactivate: (plan: AdminEmployerPlan) => void;
  onActivate: (plan: AdminEmployerPlan) => void;
  onRetry?: () => void;
};

export const EmployerPlansTable = memo(function EmployerPlansTable({
  plans,
  isLoading,
  error,
  onDeactivate,
  onActivate,
  onRetry,
}: EmployerPlansTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-soft">
        <div className="divide-y divide-border/60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 flex items-center justify-between animate-pulse">
              <div className="space-y-2">
                <div className="h-4 w-36 bg-surface-hover rounded-md" />
                <div className="h-3 w-56 bg-surface-hover/70 rounded-md" />
              </div>
              <div className="h-6 w-20 bg-surface-hover rounded-md" />
              <div className="h-8 w-24 bg-surface-hover rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
          Unable to load subscription plans: {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-soft hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center space-y-4 shadow-soft">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text">No employer plans created yet.</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Get started by defining your first employer recruitment tier.
          </p>
        </div>
        <Link
          href="/admin/subscriptions/employer-plans/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-soft transition-colors"
        >
          Create Employer Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-soft">
      {/* Desktop & Tablet Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-hover/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              <th className="py-3.5 px-4">Plan Name</th>
              <th className="py-3.5 px-4">Pricing</th>
              <th className="py-3.5 px-4">Duration</th>
              <th className="py-3.5 px-4">Job Limit & Recruitment Limits</th>
              <th className="py-3.5 px-4">Candidate Access</th>
              <th className="py-3.5 px-4 text-center">Subscriptions</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Order</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {plans.map((plan) => {
              const currencySymbol = plan.currency === "INR" ? "₹" : "$";
              const hasTalentSearch = plan.featureFlags.includes("talent_search");
              const hasMessaging = plan.featureFlags.includes("candidate_messaging");

              return (
                <tr
                  key={plan.id}
                  className="hover:bg-surface-hover/30 transition-colors group"
                >
                  {/* Plan Name & Badges */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/subscriptions/employer-plans/${plan.id}`}
                          className="font-bold text-text hover:text-primary transition-colors text-sm"
                        >
                          {plan.name}
                        </Link>
                        {plan.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                            {plan.badge}
                          </span>
                        )}
                        {plan.highlighted && (
                          <span className="text-amber-500" title="Featured tier">
                            <Sparkles className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-text-muted text-[11px]">
                        <span className="font-mono">{plan.id}</span>
                        {plan.tagline && (
                          <span className="truncate max-w-xs text-text-secondary font-medium">
                            • {plan.tagline}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Pricing */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-text">
                      {plan.priceMonthly === 0
                        ? "Free"
                        : `${currencySymbol}${plan.priceMonthly.toLocaleString("en-IN")}`}
                      <span className="text-[11px] font-normal text-text-muted ml-0.5">/mo</span>
                    </div>
                    {plan.priceYearly > 0 && (
                      <span className="text-[10px] text-text-muted block">
                        {currencySymbol}{plan.priceYearly.toLocaleString("en-IN")}/yr
                      </span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-4 px-4 text-text-secondary font-medium whitespace-nowrap">
                    {plan.durationValue} {plan.durationUnit}
                  </td>

                  {/* Job Limit & Limits */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-text flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-surface-hover text-text font-bold">
                          {plan.limits.activeJobs === null ? "Unlimited Active Jobs" : `${plan.limits.activeJobs} Active Jobs`}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted flex items-center gap-2">
                        <span>
                          Seats: {plan.limits.teamMembers === null ? "Unlimited" : plan.limits.teamMembers}
                        </span>
                        <span>•</span>
                        <span>
                          Apps: {plan.limits.applications === null ? "Unlimited" : plan.limits.applications}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Candidate Access */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          hasTalentSearch
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-hover text-text-muted"
                        }`}
                      >
                        {hasTalentSearch
                          ? `Talent Search (${plan.limits.talentSearch === null ? "Unlimited" : plan.limits.talentSearch})`
                          : "No Talent Search"}
                      </span>
                      {hasMessaging && (
                        <span className="block text-[10px] text-text-muted font-medium">
                          ✓ Direct Candidate Messaging
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Active Subscriptions Count */}
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-hover text-xs font-bold text-text">
                      <Users className="h-3 w-3 text-emerald-500" />
                      {plan.activeSubscriptionsCount ?? 0}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        plan.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-surface-hover text-text-muted border border-border"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Display Order */}
                  <td className="py-4 px-4 text-center font-mono font-bold text-text-muted">
                    #{plan.sortOrder}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/subscriptions/employer-plans/${plan.id}`}
                        title="View Details"
                        className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/subscriptions/employer-plans/${plan.id}/edit`}
                        title="Edit Plan"
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      {plan.isActive ? (
                        <button
                          type="button"
                          onClick={() => onDeactivate(plan)}
                          title="Deactivate Plan"
                          className="p-1.5 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onActivate(plan)}
                          title="Activate Plan"
                          className="p-1.5 rounded-lg text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden divide-y divide-border/60">
        {plans.map((plan) => {
          const currencySymbol = plan.currency === "INR" ? "₹" : "$";
          return (
            <div key={plan.id} className="p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/subscriptions/employer-plans/${plan.id}`}
                      className="font-bold text-text text-sm hover:text-primary"
                    >
                      {plan.name}
                    </Link>
                    {plan.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted font-mono">{plan.id}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    plan.isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-surface-hover text-text-muted"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <span className="text-text-muted">Price:</span>
                <span className="font-bold text-text">
                  {plan.priceMonthly === 0
                    ? "Free"
                    : `${currencySymbol}${plan.priceMonthly.toLocaleString("en-IN")} / mo`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Active Jobs Cap:</span>
                <span className="font-bold text-text">
                  {plan.limits.activeJobs === null ? "Unlimited" : plan.limits.activeJobs}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Active Subscriptions:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {plan.activeSubscriptionsCount ?? 0} active
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Link
                  href={`/admin/subscriptions/employer-plans/${plan.id}`}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-surface-hover"
                >
                  View
                </Link>
                <Link
                  href={`/admin/subscriptions/employer-plans/${plan.id}/edit`}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
                >
                  Edit
                </Link>
                {plan.isActive ? (
                  <button
                    type="button"
                    onClick={() => onDeactivate(plan)}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-600 text-xs font-semibold hover:bg-amber-500/10"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onActivate(plan)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
