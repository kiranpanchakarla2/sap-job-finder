"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import {
  findActivePendingPaymentRequest,
  paymentRequestService,
  type PaymentRequestRecord,
} from "@/features/shared-subscription";
import {
  buildCandidateUsageMetrics,
  CANDIDATE_PLAN_DEFINITIONS,
  getCandidatePlanDefinition,
} from "../config/planRules";
import {
  candidateSubscriptionService,
  MOCK_PRESETS,
} from "../services/candidateSubscriptionService";
import type {
  CandidatePlanDefinition,
  CandidatePlanId,
  CandidateSubscription,
  CandidateUsageMetric,
} from "../types/subscription.types";

type CandidateSubscriptionContextValue = {
  subscription: CandidateSubscription | null;
  currentPlan: CandidatePlanDefinition;
  plans: CandidatePlanDefinition[];
  usage: CandidateUsageMetric[];
  pendingPaymentRequest: PaymentRequestRecord | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  upgradePlan: (targetPlanId: CandidatePlanId) => Promise<boolean>;
  switchPlan: (targetPlanId: CandidatePlanId) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  reactivateSubscription: () => Promise<boolean>;
  reload: () => Promise<void>;
  applyMockPreset: (presetKey: string) => Promise<void>;
  toggleSimulateError: (enabled: boolean) => void;
  isSimulatingError: boolean;
};

const CandidateSubscriptionContext =
  createContext<CandidateSubscriptionContextValue | null>(null);

export function CandidateSubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isCandidate = Boolean(
    isAuthenticated &&
      user &&
      (user.role === "candidate" || user.role === "admin"),
  );

  const [subscription, setSubscription] =
    useState<CandidateSubscription | null>(null);
  const [plans, setPlans] =
    useState<CandidatePlanDefinition[]>(CANDIDATE_PLAN_DEFINITIONS);
  const [pendingPaymentRequest, setPendingPaymentRequest] =
    useState<PaymentRequestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simError, setSimError] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!isCandidate || !user?.id) {
      setSubscription(null);
      setPendingPaymentRequest(null);
      setIsLoading(false);
      setIsError(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const [subRes, plansRes, reqsRes] = await Promise.all([
        candidateSubscriptionService.getSubscription(),
        candidateSubscriptionService.getPlans(),
        paymentRequestService.getCandidatePaymentRequests(),
      ]);

      if (plansRes.success && plansRes.data.length > 0) {
        setPlans(plansRes.data);
      }

      if (reqsRes.success && reqsRes.data) {
        const pending = findActivePendingPaymentRequest(reqsRes.data);
        setPendingPaymentRequest(pending ?? null);
      } else {
        setPendingPaymentRequest(null);
      }

      if (subRes.success) {
        setSubscription(subRes.data);
      } else {
        setIsError(true);
        setError(subRes.error);
      }
    } catch {
      setIsError(true);
      setError("Unable to load candidate subscription.");
    } finally {
      setIsLoading(false);
    }
  }, [isCandidate, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void fetchSubscription();
    setSimError(candidateSubscriptionService.isSimulatingError());
  }, [authLoading, fetchSubscription]);

  const upgradePlan = useCallback(
    async (targetPlanId: CandidatePlanId): Promise<boolean> => {
      try {
        const res = await candidateSubscriptionService.upgradePlan(targetPlanId);
        if (res.success) {
          setSubscription(res.data);
          const planDef = getCandidatePlanDefinition(targetPlanId);
          toast.success(`Upgraded to ${planDef.name}!`, {
            description: `You now have access to all ${planDef.name} features and limits.`,
          });
          return true;
        }
        toast.error("Upgrade failed", { description: res.error });
        return false;
      } catch {
        toast.error("Upgrade failed", {
          description: "An unexpected error occurred.",
        });
        return false;
      }
    },
    [],
  );

  const switchPlan = useCallback(
    async (targetPlanId: CandidatePlanId): Promise<boolean> => {
      try {
        const res = await candidateSubscriptionService.switchPlan(targetPlanId);
        if (res.success) {
          setSubscription(res.data);
          const planDef = getCandidatePlanDefinition(targetPlanId);
          toast.success(`Switched to ${planDef.name}`, {
            description: `Your subscription has been updated to ${planDef.name}.`,
          });
          return true;
        }
        toast.error("Plan switch failed", { description: res.error });
        return false;
      } catch {
        toast.error("Plan switch failed", {
          description: "An unexpected error occurred.",
        });
        return false;
      }
    },
    [],
  );

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const res = await candidateSubscriptionService.cancelSubscription();
      if (res.success) {
        setSubscription(res.data);
        toast.info("Subscription cancelled", {
          description:
            "You will retain access to your plan features until the end of your billing period.",
        });
        return true;
      }
      toast.error("Cancellation failed", { description: res.error });
      return false;
    } catch {
      toast.error("Cancellation failed", {
        description: "An unexpected error occurred.",
      });
      return false;
    }
  }, []);

  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const res = await candidateSubscriptionService.reactivateSubscription();
      if (res.success) {
        setSubscription(res.data);
        toast.success("Subscription reactivated!", {
          description:
            "Your subscription will automatically renew at the end of the period.",
        });
        return true;
      }
      toast.error("Reactivation failed", { description: res.error });
      return false;
    } catch {
      toast.error("Reactivation failed", {
        description: "An unexpected error occurred.",
      });
      return false;
    }
  }, []);

  const applyMockPreset = useCallback(
    async (presetKey: string): Promise<void> => {
      const res = await candidateSubscriptionService.setMockPreset(presetKey);
      if (res.success) {
        setSubscription(res.data);
        setIsError(false);
        setError(null);
        toast.success(
          `Loaded mock state: ${MOCK_PRESETS[presetKey]?.label ?? presetKey}`,
        );
      }
    },
    [],
  );

  const toggleSimulateError = useCallback(
    (enabled: boolean) => {
      candidateSubscriptionService.setSimulateError(enabled);
      setSimError(enabled);
      void fetchSubscription();
    },
    [fetchSubscription],
  );

  const currentPlan = useMemo(() => {
    return getCandidatePlanDefinition(subscription?.planId ?? "free");
  }, [subscription?.planId]);

  const usage = useMemo(() => {
    if (!subscription) return [];
    return buildCandidateUsageMetrics(subscription);
  }, [subscription]);

  const value = useMemo(
    () => ({
      subscription,
      currentPlan,
      plans,
      usage,
      pendingPaymentRequest,
      isLoading,
      isError,
      error,
      upgradePlan,
      switchPlan,
      cancelSubscription,
      reactivateSubscription,
      reload: fetchSubscription,
      applyMockPreset,
      toggleSimulateError,
      isSimulatingError: simError,
    }),
    [
      subscription,
      currentPlan,
      plans,
      usage,
      pendingPaymentRequest,
      isLoading,
      isError,
      error,
      upgradePlan,
      switchPlan,
      cancelSubscription,
      reactivateSubscription,
      fetchSubscription,
      applyMockPreset,
      toggleSimulateError,
      simError,
    ],
  );

  return (
    <CandidateSubscriptionContext.Provider value={value}>
      {children}
    </CandidateSubscriptionContext.Provider>
  );
}

export function useCandidateSubscription() {
  const context = useContext(CandidateSubscriptionContext);
  if (!context) {
    throw new Error(
      "useCandidateSubscription must be used within a CandidateSubscriptionProvider",
    );
  }
  return context;
}
