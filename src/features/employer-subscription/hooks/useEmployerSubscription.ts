"use client";

import { useCallback, useEffect, useState } from "react";
import { resolveEmployerMembership } from "@/features/employer-auth/services/employerMembershipService";
import { useCompanyProfile } from "@/features/employer-company/hooks/useCompanyProfile";
import { isOwnerOrAdmin, type EmployerCompanyRole } from "@/lib/auth/employerPermissions";
import { subscriptionService, type EmployerSubscriptionOverview } from "../services/subscriptionService";
import { PLAN_DEFINITIONS } from "../config/planRules";
import type {
  EmployerSubscription,
  PaymentRequestRecord,
  PlanDefinition,
} from "../types/subscription.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useEmployerSubscription() {
  const { profile: companyProfile, isLoading: companyLoading } = useCompanyProfile();
  const [overview, setOverview] = useState<EmployerSubscriptionOverview | null>(null);
  const [companyRole, setCompanyRole] = useState<EmployerCompanyRole | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const canManage = isOwnerOrAdmin(companyRole);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    const [subResult, membershipResult] = await Promise.all([
      subscriptionService.getSubscriptionOverview(),
      resolveEmployerMembership(),
    ]);

    if (membershipResult.status === "active") {
      setCompanyRole(membershipResult.membership.role);
    } else {
      setCompanyRole(null);
    }

    if (!subResult.success) {
      setOverview(null);
      setError(subResult.error);
      setStatus("error");
      return;
    }

    setOverview(subResult.data);
    setStatus("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const data: EmployerSubscription | null = overview?.subscription ?? null;
  const plans: PlanDefinition[] = overview?.plans && overview.plans.length > 0
    ? overview.plans
    : PLAN_DEFINITIONS;
  const pendingPaymentRequest: PaymentRequestRecord | null = overview?.pendingPaymentRequest ?? null;

  return {
    data,
    subscription: data,
    plans,
    pendingPaymentRequest,
    companyProfile,
    companyRole,
    canManage,
    isLoading: (status === "loading" || status === "idle") && !data,
    isInitialLoading: status === "loading" || companyLoading,
    isError: status === "error",
    error,
    reload: load,
  };
}
