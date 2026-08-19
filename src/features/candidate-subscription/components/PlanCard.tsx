"use client";

import { Check, Sparkles, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  calculateSavings,
  formatCurrency,
  getPlanPrice,
  type BillingCycle,
} from "@/features/shared-subscription";
import type {
  CandidatePlanDefinition,
  CandidatePlanId,
} from "../types/subscription.types";

export function PlanCard({
  plan,
  currentPlanId,
  billingCycle = "quarterly",
  onSelectPlan,
}: {
  plan: CandidatePlanDefinition;
  currentPlanId: CandidatePlanId;
  billingCycle?: BillingCycle;
  onSelectPlan: (planId: CandidatePlanId) => void;
}) {
  const isCurrent = plan.id === currentPlanId;
  const isFree = plan.id === "free";

  const isDowngrade =
    (currentPlanId === "premium" && plan.id !== "premium") ||
    (currentPlanId === "professional" && plan.id === "free");

  // Determine dynamic price based on the selected billing cycle
  const price = isFree
    ? 0
    : getPlanPrice(
        {
          priceMonthly: plan.priceMonthly,
          priceQuarterly: plan.priceQuarterly ?? plan.priceMonthly * 3,
          priceYearly: plan.priceYearly ?? plan.priceMonthly * 12,
        },
        billingCycle,
      );

  // Determine period label
  const periodLabel = isFree
    ? "/month"
    : billingCycle === "monthly"
    ? "/month"
    : billingCycle === "quarterly"
    ? "/3 months"
    : "/year";

  // Calculate savings compared to paying monthly
  const savings = isFree
    ? null
    : calculateSavings(plan.priceMonthly, price, billingCycle);

  let ctaLabel = isFree ? "Choose Free" : `Subscribe to ${plan.name}`;
  if (isCurrent) {
    ctaLabel = "Current Plan";
  } else if (isDowngrade) {
    ctaLabel = `Switch to ${plan.name}`;
  }

  return (
    <article
      className={`relative flex h-full flex-col rounded-[var(--radius-card)] border bg-card p-6 shadow-soft transition-all duration-200 ${
        plan.highlighted
          ? "border-primary ring-2 ring-primary/25 shadow-lift"
          : "border-border hover:border-border/80"
      }`}
    >
      {plan.badge ? (
        <div className="mb-3 flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles size={13} aria-hidden="true" />
            {plan.badge}
          </span>
        </div>
      ) : (
        <div className="mb-3 h-6" aria-hidden="true" />
      )}

      <div>
        <h3 className="text-xl font-bold tracking-tight text-text">{plan.name}</h3>
        <p className="mt-1 text-xs font-medium text-muted min-h-[2rem] leading-relaxed">
          {plan.tagline}
        </p>
      </div>

      <div className="mt-4 border-b border-border pb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-text">
            {formatCurrency(price, plan.currency)}
          </span>
          <span className="text-sm font-medium text-muted">{periodLabel}</span>
        </div>

        {/* Savings Badge */}
        {savings && savings.savings > 0 ? (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20">
              <TrendingDown size={12} aria-hidden="true" />
              Save {formatCurrency(savings.savings, plan.currency)} · {savings.discountPercentage}%
            </span>
          </div>
        ) : (
          <div className="mt-2.5 h-5" aria-hidden="true" />
        )}
      </div>

      <p className="mt-4 text-xs text-muted">{plan.description}</p>

      <ul className="mt-4 flex-1 space-y-2.5" aria-label={`${plan.name} plan features`}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-text">
            <Check
              size={16}
              className="mt-0.5 shrink-0 text-success"
              aria-hidden="true"
            />
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-4">
        <Button
          type="button"
          variant={isCurrent ? "secondary" : plan.highlighted ? "primary" : "secondary"}
          className={`w-full font-semibold ${
            isCurrent
              ? "opacity-75 cursor-default bg-surface text-muted border-border hover:bg-surface"
              : ""
          }`}
          disabled={isCurrent}
          onClick={() => onSelectPlan(plan.id)}
          aria-label={
            isCurrent
              ? `${plan.name} is your current plan`
              : `${ctaLabel} for ${formatCurrency(price, plan.currency)} ${periodLabel}`
          }
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  );
}
