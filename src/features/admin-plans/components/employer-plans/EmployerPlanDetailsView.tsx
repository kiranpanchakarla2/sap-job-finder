"use client";

import { memo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCircle2,
  Coins,
  Edit3,
  FileText,
  Layers,
  Power,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import type { AdminEmployerPlan } from "../../types/plan.types";
import { EMPLOYER_FEATURE_OPTIONS } from "../../constants/employerFeatures";

type EmployerPlanDetailsViewProps = {
  plan: AdminEmployerPlan;
  onDeactivate: () => void;
  onActivate: () => void;
};

export const EmployerPlanDetailsView = memo(function EmployerPlanDetailsView({
  plan,
  onDeactivate,
  onActivate,
}: EmployerPlanDetailsViewProps) {
  const currencySymbol = plan.currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/subscriptions/employer-plans"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Employer Plans
        </Link>
        <div className="flex items-center gap-3">
          {plan.isActive ? (
            <button
              type="button"
              onClick={onDeactivate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Power className="h-4 w-4" />
              Deactivate Plan
            </button>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-soft transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Activate Plan
            </button>
          )}
          <Link
            href={`/admin/subscriptions/employer-plans/${plan.id}/edit`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-soft transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            Edit Plan
          </Link>
        </div>
      </div>

      {/* Main Plan Header Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                {plan.name}
              </h1>
              {plan.badge && (
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}
              {plan.highlighted && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Featured Tier
                </span>
              )}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  plan.isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-surface-hover text-text-muted border border-border"
                }`}
              >
                {plan.isActive ? "● Active" : "○ Inactive"}
              </span>
            </div>
            <p className="text-sm font-mono text-text-muted">Slug: {plan.id}</p>
            {plan.tagline && (
              <p className="text-sm text-text-secondary font-medium pt-1">
                {plan.tagline}
              </p>
            )}
            {plan.description && (
              <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
                {plan.description}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right shrink-0 bg-surface-hover/40 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-border">
            <div className="text-2xl sm:text-3xl font-black text-text tracking-tight">
              {plan.priceMonthly === 0 ? "Free" : `${currencySymbol}${plan.priceMonthly.toLocaleString("en-IN")}`}
              <span className="text-xs font-normal text-text-muted ml-1">/ month</span>
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Duration: {plan.durationValue} {plan.durationUnit}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Pricing, Usage, Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pricing Options */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2 text-text font-bold text-sm border-b border-border pb-3">
            <Coins className="h-4 w-4 text-primary" />
            Pricing Schedule
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Monthly (1 mo)</span>
              <span className="font-bold text-text">
                {currencySymbol}{plan.priceMonthly.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Quarterly (3 mo)</span>
              <span className="font-bold text-text">
                {currencySymbol}{plan.priceQuarterly.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Yearly (12 mo)</span>
              <span className="font-bold text-text">
                {currencySymbol}{plan.priceYearly.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-text-muted">Currency</span>
              <span className="font-bold text-text">{plan.currency}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Usage & Subscription Counts */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2 text-text font-bold text-sm border-b border-border pb-3">
            <Users className="h-4 w-4 text-emerald-500" />
            Subscription Usage
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Active Subscriptions</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {plan.activeSubscriptionsCount ?? 0} active
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Total Historical</span>
              <span className="font-bold text-text">
                {plan.totalSubscriptionsCount ?? 0} total
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Display Priority</span>
              <span className="font-bold text-text">#{plan.sortOrder}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-text-muted">Last Updated</span>
              <span className="font-medium text-text">
                {plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Employer Limits */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2 text-text font-bold text-sm border-b border-border pb-3">
            <Layers className="h-4 w-4 text-blue-500" />
            Recruitment Quotas & Limits
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Active Jobs Cap</span>
              <span className="font-bold text-text">
                {plan.limits.activeJobs === null ? "Unlimited" : plan.limits.activeJobs}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Applications Capacity</span>
              <span className="font-bold text-text">
                {plan.limits.applications === null ? "Unlimited" : plan.limits.applications}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-text-muted">Talent Search Views</span>
              <span className="font-bold text-text">
                {plan.limits.talentSearch === null ? "Unlimited" : plan.limits.talentSearch}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-text-muted">Team Member Seats</span>
              <span className="font-bold text-text">
                {plan.limits.teamMembers === null ? "Unlimited" : plan.limits.teamMembers}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Entitlements Checklist */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center gap-2 text-text font-bold text-sm border-b border-border pb-3">
          <Shield className="h-4 w-4 text-primary" />
          Employer Feature Entitlements
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {EMPLOYER_FEATURE_OPTIONS.map((feat) => {
            const hasAccess = plan.featureFlags.includes(feat.key);
            return (
              <div
                key={feat.key}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  hasAccess
                    ? "bg-primary/5 border-primary/20 text-text"
                    : "bg-surface-hover/20 border-border/60 text-text-muted opacity-60"
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded mt-0.5 ${
                    hasAccess ? "bg-primary text-white" : "bg-surface-hover text-text-muted"
                  }`}
                >
                  {hasAccess && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-bold block">{feat.label}</span>
                  <span className="text-[11px] text-text-muted leading-tight block mt-0.5">
                    {feat.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employer-Facing Display Bullets */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center gap-2 text-text font-bold text-sm border-b border-border pb-3">
          <FileText className="h-4 w-4 text-amber-500" />
          Employer-Facing Feature Highlights
        </div>
        <ul className="space-y-2">
          {plan.features.map((bullet, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-text">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
          {plan.features.length === 0 && (
            <p className="text-xs text-text-muted italic">No custom highlight bullets configured.</p>
          )}
        </ul>
      </div>
    </div>
  );
});
