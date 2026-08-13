"use client";

import { useMemo } from "react";
import {
  getPlanLimit,
  hasPlanEntitlement,
} from "../config/planRules";
import type {
  PlanEntitlement,
  PlanId,
  UsageMetricKey,
} from "../types/subscription.types";
import { useEmployerSubscription } from "./useEmployerSubscription";

export function useEmployerPlan() {
  const { data, isLoading, isError, error, reload } = useEmployerSubscription();

  const planId: PlanId = data?.planId ?? "free";

  const hasFeature = useMemo(
    () => (entitlement: PlanEntitlement) => hasPlanEntitlement(planId, entitlement),
    [planId],
  );

  const getLimit = useMemo(
    () => (key: UsageMetricKey) => getPlanLimit(planId, key),
    [planId],
  );

  return {
    plan: planId,
    subscription: data,
    isLoading,
    isError,
    error,
    reload,
    hasFeature,
    getLimit,
  };
}
