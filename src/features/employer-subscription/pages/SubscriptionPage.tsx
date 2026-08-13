"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { PLAN_DEFINITIONS } from "../config/planRules";
import { BillingSection } from "../components/BillingSection";
import { CurrentPlanCard } from "../components/CurrentPlanCard";
import { PlanCard } from "../components/PlanCard";
import { PlanComparison } from "../components/PlanComparison";
import { SubscriptionSkeleton } from "../components/SubscriptionSkeleton";
import { SubscriptionStatusBanners } from "../components/SubscriptionStatusBanners";
import { UpgradeModal } from "../components/UpgradeModal";
import { UsageCard } from "../components/UsageCard";
import { useEmployerSubscription } from "../hooks/useEmployerSubscription";
import type { PlanId } from "../types/subscription.types";

export function SubscriptionPage() {
  const { data, isLoading, isError, error, reload } = useEmployerSubscription();
  const [upgradePlanId, setUpgradePlanId] = useState<PlanId | null>(null);
  const plansRef = useRef<HTMLElement>(null);

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <ErrorState
          title="Unable to load subscription."
          description={error ?? undefined}
          onRetry={() => void reload()}
        />
      </div>
    );
  }

  const openUpgrade = (planId: PlanId) => {
    if (planId === data.planId) return;
    setUpgradePlanId(planId);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Subscription
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choose the plan that fits your hiring needs.
        </p>
      </div>

      <SubscriptionStatusBanners
        subscription={data}
        onChoosePlan={scrollToPlans}
        onUpdateBilling={() =>
          toast.message("Payment integration coming soon.", {
            description: "Online payment options will be available soon.",
          })
        }
      />

      <CurrentPlanCard subscription={data} />

      <UsageCard
        subscription={data}
        onUpgrade={() =>
          openUpgrade(data.planId === "business" ? "pro" : data.planId === "pro" ? "business" : "pro")
        }
      />

      <section ref={plansRef}>
        <h2 className="mb-3 text-lg font-semibold text-text">Plans</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {PLAN_DEFINITIONS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={data.planId}
              onUpgrade={openUpgrade}
            />
          ))}
        </div>
      </section>

      <PlanComparison />

      <BillingSection subscription={data} />

      <UpgradeModal
        open={Boolean(upgradePlanId)}
        planId={upgradePlanId}
        onClose={() => setUpgradePlanId(null)}
      />
    </div>
  );
}
