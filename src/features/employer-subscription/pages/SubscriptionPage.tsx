"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { BillingPeriodSelector, type BillingCycle } from "@/features/shared-subscription";
import { BillingSection } from "../components/BillingSection";
import { CurrentPlanCard } from "../components/CurrentPlanCard";
import { EmployerPaymentRequestModal } from "../components/EmployerPaymentRequestModal";
import { PlanCard } from "../components/PlanCard";
import { PlanComparison } from "../components/PlanComparison";
import { SubscriptionSkeleton } from "../components/SubscriptionSkeleton";
import { SubscriptionStatusBanners } from "../components/SubscriptionStatusBanners";
import { UsageCard } from "../components/UsageCard";
import { useEmployerSubscription } from "../hooks/useEmployerSubscription";
import type { PlanId } from "../types/subscription.types";

export function SubscriptionPage() {
  const {
    data,
    subscription,
    plans,
    pendingPaymentRequest,
    companyProfile,
    canManage,
    isLoading,
    isError,
    error,
    reload,
  } = useEmployerSubscription();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("quarterly");
  const [paymentModalPlanId, setPaymentModalPlanId] = useState<PlanId | null>(null);
  const plansRef = useRef<HTMLElement>(null);

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
          title="Unable to load subscription."
          description={error ?? "Please check your connection and try again."}
          onRetry={() => void reload()}
        />
      </div>
    );
  }

  const handleSelectPlan = (planId: PlanId) => {
    if (planId === subscription.planId) return;

    // Free plan does not trigger manual payment request modal
    if (planId === "free") {
      toast.message("You are already on the Free plan or have an active company plan.");
      return;
    }

    if (!canManage) {
      toast.error("Permission Required", {
        description: "Only Company Admins (Owner/Admin) can request subscription plans.",
      });
      return;
    }

    // Paid plans trigger the Employer Payment Request Modal
    setPaymentModalPlanId(planId);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* PAGE HEADER */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Subscription
          </h1>
          <p className="mt-1 text-sm text-muted">
            Choose the plan that fits your company hiring needs.
          </p>
        </div>
      </header>

      {/* STATUS BANNERS (Pending Request / Trialing / Past Due / Cancelled / Renewal) */}
      <SubscriptionStatusBanners
        subscription={subscription}
        pendingPaymentRequest={pendingPaymentRequest}
        canManage={canManage}
        onChoosePlan={scrollToPlans}
        onUpdateBilling={() =>
          toast.message("Payment integration coming soon.", {
            description: "Online payment options will be available soon.",
          })
        }
      />


      {/* CURRENT PLAN SUMMARY */}
      <CurrentPlanCard subscription={subscription} />

      {/* USAGE METRICS */}
      <UsageCard
        subscription={subscription}
        onUpgrade={scrollToPlans}
      />

      {/* AVAILABLE EMPLOYER PLANS WITH BILLING PERIOD SELECTOR */}
      <section ref={plansRef} aria-labelledby="employer-plans-heading" className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="employer-plans-heading" className="text-xl font-bold tracking-tight text-text">
              Available Employer Plans
            </h2>
            <p className="mt-1 text-xs text-muted">
              Select the plan and billing cycle that matches your team hiring goals.
            </p>
          </div>

          {/* BILLING CYCLE SELECTOR */}
          <BillingPeriodSelector
            selectedCycle={billingCycle}
            onSelectCycle={setBillingCycle}
          />
        </div>

        {/* PLAN CARDS GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={subscription.planId}
              billingCycle={billingCycle}
              canManage={canManage}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      </section>

      {/* PLAN COMPARISON */}
      <PlanComparison />

      {/* BILLING SECTION */}
      <BillingSection subscription={subscription} />

      {/* EMPLOYER PAYMENT REQUEST MODAL */}
      <EmployerPaymentRequestModal
        open={Boolean(paymentModalPlanId)}
        targetPlanId={paymentModalPlanId}
        billingCycle={billingCycle}
        companyName={companyProfile?.companyName}
        onClose={() => setPaymentModalPlanId(null)}
        onSuccess={() => {
          void reload();
        }}
      />
    </div>
  );
}
