export { SubscriptionPage } from "./pages/SubscriptionPage";
export { subscriptionService } from "./services/subscriptionService";
export { useEmployerSubscription } from "./hooks/useEmployerSubscription";
export {
  canCreateJob,
  canUseFeature,
  getPlanDefinition,
  getPlanLimits,
  PLAN_DEFINITIONS,
  PLAN_FEATURES,
  PLAN_LIMITS,
} from "./config/planRules";
export { UpgradeModal } from "./components/UpgradeModal";
export { JobLimitReachedPanel } from "./components/JobLimitGate";
export { PlanStatusBadge } from "./components/PlanStatusBadge";
export type {
  EmployerSubscription,
  PlanFeature,
  PlanId,
  SubscriptionStatus,
} from "./types/subscription.types";

export const EMPLOYER_SUBSCRIPTION_ROUTES = {
  subscription: "/employer/subscription",
} as const;
