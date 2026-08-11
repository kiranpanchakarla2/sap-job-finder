"use client";

import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { SubscriptionStatus } from "../types/subscription.types";

const LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past Due",
  cancelled: "Cancelled",
};

const TONES: Record<
  SubscriptionStatus,
  "success" | "info" | "warning" | "danger"
> = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  cancelled: "danger",
};

export function PlanStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <StatusBadge tone={TONES[status]}>{LABELS[status]}</StatusBadge>;
}
