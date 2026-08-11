import type { EmployerSubscription } from "../types/subscription.types";

/**
 * Sprint 6A mock subscription.
 * Flip `status` / `planId` / usage to exercise trial, past_due, cancelled, and limit UIs.
 */
export const MOCK_SUBSCRIPTION: EmployerSubscription = {
  planId: "pro",
  status: "active",
  renewalDate: "2026-08-30",
  trialEndsAt: null,
  billingCycle: "monthly",
  nextBillingDate: "2026-08-30",
  paymentMethodConfigured: false,
  usage: {
    activeJobs: 13,
    applications: 124,
    talentSearch: 48,
    teamMembers: 2,
  },
  invoices: [
    {
      id: "inv_2026_07",
      date: "2026-07-30",
      label: "INV-2026-07",
      amount: 29,
      currency: "USD",
      status: "paid",
    },
    {
      id: "inv_2026_06",
      date: "2026-06-30",
      label: "INV-2026-06",
      amount: 29,
      currency: "USD",
      status: "paid",
    },
    {
      id: "inv_2026_05",
      date: "2026-05-30",
      label: "INV-2026-05",
      amount: 29,
      currency: "USD",
      status: "paid",
    },
  ],
};

/** Alternate scenarios for QA — import and swap in the mock service if needed. */
export const MOCK_SUBSCRIPTION_SCENARIOS = {
  freeNearLimit: {
    ...MOCK_SUBSCRIPTION,
    planId: "free" as const,
    status: "active" as const,
    usage: {
      activeJobs: 3,
      applications: 48,
      talentSearch: 9,
      teamMembers: 1,
    },
    invoices: [],
    renewalDate: null,
    nextBillingDate: null,
  },
  proTrial: {
    ...MOCK_SUBSCRIPTION,
    status: "trialing" as const,
    trialEndsAt: "2026-08-18",
    renewalDate: null,
    nextBillingDate: null,
  },
  pastDue: {
    ...MOCK_SUBSCRIPTION,
    status: "past_due" as const,
  },
  cancelled: {
    ...MOCK_SUBSCRIPTION,
    status: "cancelled" as const,
    renewalDate: null,
    nextBillingDate: null,
  },
} satisfies Record<string, EmployerSubscription>;
