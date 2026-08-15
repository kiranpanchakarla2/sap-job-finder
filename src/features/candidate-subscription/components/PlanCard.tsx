"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCandidatePlanPrice } from "../config/planRules";
import type { CandidatePlanDefinition, CandidatePlanId } from "../types/subscription.types";

export function PlanCard({
  plan,
  currentPlanId,
  onSelectPlan,
}: {
  plan: CandidatePlanDefinition;
  currentPlanId: CandidatePlanId;
  onSelectPlan: (planId: CandidatePlanId) => void;
}) {
  const isCurrent = plan.id === currentPlanId;
  const isDowngrade =
    (currentPlanId === "premium" && plan.id !== "premium") ||
    (currentPlanId === "professional" && plan.id === "free");

  let ctaLabel = `Upgrade to ${plan.name}`;
  if (isCurrent) {
    ctaLabel = "Current Plan";
  } else if (isDowngrade) {
    ctaLabel = `Switch to ${plan.name}`;
  } else if (plan.id === "free") {
    ctaLabel = "Choose Free";
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
        <div className="mb-3 flex items-center gap-1.5">
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

      <div className="mt-4 flex items-baseline gap-1 border-b border-border pb-5">
        <span className="text-3xl font-extrabold tracking-tight text-text">
          {formatCandidatePlanPrice(plan.priceMonthly, plan.currency)}
        </span>
        <span className="text-sm font-medium text-muted">/{plan.billingPeriod}</span>
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
              : `${ctaLabel} for ${formatCandidatePlanPrice(plan.priceMonthly, plan.currency)} per month`
          }
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  );
}
