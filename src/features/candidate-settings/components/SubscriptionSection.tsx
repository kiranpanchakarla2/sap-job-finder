"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  CreditCard,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { useCandidateSubscription } from "@/features/candidate-subscription";
import { SettingsSection } from "./SettingsSection";

export function SubscriptionSection() {
  const { currentPlan, subscription } = useCandidateSubscription();

  const isFree = currentPlan.id === "free";
  const isProfessional = currentPlan.id === "professional";
  const isPremium = currentPlan.id === "premium";

  return (
    <SettingsSection
      id="subscription"
      title="Subscription & Plan"
      description="View your active candidate membership, feature entitlements, and billing preferences."
      badge={
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            isPremium
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
              : isProfessional
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "bg-surface text-muted ring-1 ring-border"
          }`}
        >
          {currentPlan.name} Plan
        </span>
      }
    >
      <div className="space-y-5">
        {/* Active Plan Card */}
        <div className="rounded-xl border border-border bg-surface/30 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isPremium
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : isProfessional
                      ? "bg-primary/10 text-primary"
                      : "bg-surface text-muted"
                }`}
              >
                {isPremium ? (
                  <Crown className="h-6 w-6" />
                ) : isProfessional ? (
                  <Zap className="h-6 w-6" />
                ) : (
                  <CreditCard className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text">
                    {currentPlan.name} Membership
                  </h3>
                  {currentPlan.badge ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {currentPlan.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {currentPlan.tagline || currentPlan.description}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-lg font-extrabold text-text">
                    {currentPlan.priceMonthly === 0
                      ? "Free"
                      : `₹${currentPlan.priceMonthly}`}
                  </span>
                  {currentPlan.priceMonthly > 0 ? (
                    <span className="text-xs text-muted">/ month</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <Button href="/candidate/subscription" variant="primary" className="px-4 py-2 text-xs">
                <span>Manage Subscription</span>
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
              {isFree ? (
                <p className="text-[11px] text-muted">
                  Upgrade for ATS resume scoring & higher limits
                </p>
              ) : (
                <p className="text-[11px] text-muted">
                  Status: Active • Renews monthly
                </p>
              )}
            </div>
          </div>

          {/* Key Entitlements Preview */}
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
              Included In Your Plan
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {currentPlan.features.slice(0, 4).map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-xs text-text">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shortcuts related to Subscription & Limits */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-text">Active Job Alerts</p>
                <p className="text-[11px] text-muted">
                  Limit: {currentPlan.limits.jobAlerts === null ? "Unlimited" : `${currentPlan.limits.jobAlerts} alerts`}
                </p>
              </div>
            </div>
            <Link
              href="/candidate/job-alerts"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View Alerts →
            </Link>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-text">Monthly Applications</p>
                <p className="text-[11px] text-muted">
                  Limit: {currentPlan.limits.applicationsPerMonth === null ? "Unlimited" : `${currentPlan.limits.applicationsPerMonth} / month`}
                </p>
              </div>
            </div>
            <Link
              href="/candidate/applications"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Track Applications →
            </Link>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
