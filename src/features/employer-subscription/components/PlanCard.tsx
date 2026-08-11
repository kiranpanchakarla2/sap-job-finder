"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPlanPrice } from "../config/planRules";
import type { PlanDefinition, PlanId } from "../types/subscription.types";

export function PlanCard({
  plan,
  currentPlanId,
  onUpgrade,
}: {
  plan: PlanDefinition;
  currentPlanId: PlanId;
  onUpgrade: (planId: PlanId) => void;
}) {
  const isCurrent = plan.id === currentPlanId;
  const isDowngrade =
    (currentPlanId === "business" && plan.id !== "business") ||
    (currentPlanId === "pro" && plan.id === "free");

  let ctaLabel = `Upgrade to ${plan.name}`;
  if (isCurrent) ctaLabel = "Current Plan";
  else if (isDowngrade) ctaLabel = `Switch to ${plan.name}`;
  else if (plan.id === "free") ctaLabel = "Choose Free";

  return (
    <article
      className={`flex h-full flex-col rounded-[var(--radius-card)] border bg-card p-5 shadow-soft ${
        plan.highlighted
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
      }`}
    >
      {plan.highlighted ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
          Most popular
        </p>
      ) : (
        <div className="mb-3 h-4" aria-hidden="true" />
      )}
      <h3 className="text-xl font-bold text-text">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted">{plan.description}</p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-text">
        {formatPlanPrice(plan.priceMonthly)}
        <span className="text-sm font-medium text-muted">/{plan.billingPeriod}</span>
      </p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-text">
            <Check
              size={16}
              className="mt-0.5 shrink-0 text-success"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Button
          type="button"
          variant={isCurrent ? "secondary" : plan.highlighted ? "primary" : "secondary"}
          className="w-full"
          disabled={isCurrent}
          onClick={() => onUpgrade(plan.id)}
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  );
}
