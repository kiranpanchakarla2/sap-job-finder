"use client";

import { useRef, useState } from "react";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { CANDIDATE_PLAN_DEFINITIONS } from "../config/planRules";
import { useCandidateSubscription } from "../context/CandidateSubscriptionProvider";
import { CurrentPlanCard } from "../components/CurrentPlanCard";
import { PlanCard } from "../components/PlanCard";
import { UsageCard } from "../components/UsageCard";
import { PlanComparison } from "../components/PlanComparison";
import { BenefitsSection } from "../components/BenefitsSection";
import { SubscriptionStatusBanners } from "../components/SubscriptionStatusBanners";
import { UpgradeModal } from "../components/UpgradeModal";
import { ManageSubscriptionModal } from "../components/ManageSubscriptionModal";
import { CancelSubscriptionModal } from "../components/CancelSubscriptionModal";
import { SubscriptionSkeleton } from "../components/SubscriptionSkeleton";
import { DevStateSwitcher } from "../components/DevStateSwitcher";
import type { CandidatePlanId } from "../types/subscription.types";

export function CandidateSubscriptionPage() {
  const {
    subscription,
    currentPlan,
    plans,
    usage,
    isLoading,
    isError,
    error,
    upgradePlan,
    switchPlan,
    cancelSubscription,
    reactivateSubscription,
    reload,
  } = useCandidateSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState<CandidatePlanId | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const plansRef = useRef<HTMLDivElement>(null);

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  if (isError || !subscription) {
    return (
      <div className="mx-auto max-w-7xl">
        <ErrorState
          title="Unable to load subscription information."
          description={error ?? "Please check your connection and try again."}
          onRetry={() => void reload()}
        />
        <DevStateSwitcher />
      </div>
    );
  }

  const handleSelectPlan = (planId: CandidatePlanId) => {
    if (planId === subscription.planId) return;
    setSelectedPlanId(planId);
  };

  const handleConfirmUpgradeOrSwitch = async (planId: CandidatePlanId): Promise<boolean> => {
    if (subscription.planId === "free") {
      return upgradePlan(planId);
    }
    return switchPlan(planId);
  };

  const handleRequestCancel = () => {
    setManageModalOpen(false);
    setCancelModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* PAGE HEADER */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Subscription
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choose the plan that fits your SAP job search.
        </p>
      </header>

      {/* STATUS BANNERS (Cancelled / Expired / Past Due) */}
      <SubscriptionStatusBanners
        subscription={subscription}
        currentPlan={currentPlan}
        onReactivate={() => void reactivateSubscription()}
        onViewPlans={scrollToPlans}
      />

      {/* CURRENT PLAN SUMMARY */}
      <CurrentPlanCard
        subscription={subscription}
        currentPlan={currentPlan}
        onManage={() => setManageModalOpen(true)}
        onReactivate={() => void reactivateSubscription()}
        onExplorePlans={scrollToPlans}
      />

      {/* USAGE METRICS */}
      <UsageCard
        usage={usage}
        planName={currentPlan.name}
        onUpgrade={scrollToPlans}
      />

      {/* THREE PLAN CARDS */}
      <section ref={plansRef} aria-labelledby="available-plans-heading" className="space-y-4">
        <div>
          <h2 id="available-plans-heading" className="text-xl font-bold tracking-tight text-text">
            Available Candidate Plans
          </h2>
          <p className="mt-1 text-xs text-muted">
            Select the plan that matches your current career search goals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {(plans && plans.length > 0 ? plans : CANDIDATE_PLAN_DEFINITIONS).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={subscription.planId}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      </section>

      {/* PLAN COMPARISON */}
      <PlanComparison />

      {/* BENEFITS HIGHLIGHTS */}
      <BenefitsSection />

      {/* DEV STATE SWITCHER (COLLAPSIBLE TEST CONTROL) */}
      <DevStateSwitcher />

      {/* UPGRADE / SWITCH PLAN MODAL */}
      <UpgradeModal
        open={Boolean(selectedPlanId)}
        targetPlanId={selectedPlanId}
        currentPlanId={subscription.planId}
        onClose={() => setSelectedPlanId(null)}
        onConfirmUpgrade={handleConfirmUpgradeOrSwitch}
      />

      {/* MANAGE ACTIVE SUBSCRIPTION MODAL */}
      <ManageSubscriptionModal
        open={manageModalOpen}
        subscription={subscription}
        currentPlan={currentPlan}
        onClose={() => setManageModalOpen(false)}
        onRequestCancel={handleRequestCancel}
      />

      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      <CancelSubscriptionModal
        open={cancelModalOpen}
        subscription={subscription}
        currentPlan={currentPlan}
        onClose={() => setCancelModalOpen(false)}
        onConfirmCancel={cancelSubscription}
      />
    </div>
  );
}
