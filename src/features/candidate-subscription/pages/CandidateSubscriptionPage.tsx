"use client";

import { useRef, useState } from "react";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import type { BillingCycle } from "@/features/shared-subscription";
import { CANDIDATE_PLAN_DEFINITIONS } from "../config/planRules";
import { useCandidateSubscription } from "../context/CandidateSubscriptionProvider";
import { CurrentPlanCard } from "../components/CurrentPlanCard";
import { PlanCard } from "../components/PlanCard";
import { UsageCard } from "../components/UsageCard";
import { PlanComparison } from "../components/PlanComparison";
import { BenefitsSection } from "../components/BenefitsSection";
import { SubscriptionStatusBanners } from "../components/SubscriptionStatusBanners";
import { BillingPeriodSelector } from "../components/BillingPeriodSelector";
import { CandidatePaymentRequestModal } from "../components/CandidatePaymentRequestModal";
import { ManageSubscriptionModal } from "../components/ManageSubscriptionModal";
import { CancelSubscriptionModal } from "../components/CancelSubscriptionModal";
import { SubscriptionSkeleton } from "../components/SubscriptionSkeleton";
import type { CandidatePlanId } from "../types/subscription.types";

export function CandidateSubscriptionPage() {
  const {
    subscription,
    currentPlan,
    plans,
    usage,
    pendingPaymentRequest,
    isLoading,
    isError,
    error,
    cancelSubscription,
    reactivateSubscription,
    reload,
  } = useCandidateSubscription();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("quarterly");
  const [paymentModalPlanId, setPaymentModalPlanId] = useState<CandidatePlanId | null>(null);
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
      </div>
    );
  }

  const handleSelectPlan = (planId: CandidatePlanId) => {
    if (planId === subscription.planId) return;

    // Free plan does not trigger payment modal
    if (planId === "free") {
      // If candidate already has an active paid subscription, they can manage or cancel it
      setManageModalOpen(true);
      return;
    }

    // Paid plans trigger the Candidate Payment Request Modal
    setPaymentModalPlanId(planId);
  };

  const handleRequestCancel = () => {
    setManageModalOpen(false);
    setCancelModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* PAGE HEADER */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Subscription
          </h1>
          <p className="mt-1 text-sm text-muted">
            Choose the plan that fits your SAP job search.
          </p>
        </div>
      </header>

      {/* STATUS BANNERS (Pending Request / Cancelled / Expired / Past Due) */}
      <SubscriptionStatusBanners
        subscription={subscription}
        currentPlan={currentPlan}
        pendingPaymentRequest={pendingPaymentRequest}
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

      {/* AVAILABLE CANDIDATE PLANS WITH BILLING PERIOD SELECTOR */}
      <section ref={plansRef} aria-labelledby="available-plans-heading" className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="available-plans-heading" className="text-xl font-bold tracking-tight text-text">
              Available Candidate Plans
            </h2>
            <p className="mt-1 text-xs text-muted">
              Select the plan and billing cycle that matches your career search goals.
            </p>
          </div>

          {/* BILLING CYCLE SELECTOR */}
          <BillingPeriodSelector
            selectedCycle={billingCycle}
            onSelectCycle={setBillingCycle}
          />
        </div>

        {/* THREE PLAN CARDS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {(plans && plans.length > 0 ? plans : CANDIDATE_PLAN_DEFINITIONS).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={subscription.planId}
              billingCycle={billingCycle}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      </section>

      {/* PLAN COMPARISON */}
      <PlanComparison />

      {/* BENEFITS HIGHLIGHTS */}
      <BenefitsSection />

      {/* CANDIDATE MANUAL PAYMENT REQUEST MODAL */}
      <CandidatePaymentRequestModal
        open={Boolean(paymentModalPlanId)}
        targetPlanId={paymentModalPlanId}
        billingCycle={billingCycle}
        onClose={() => setPaymentModalPlanId(null)}
        onSuccess={() => {
          void reload();
        }}
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
