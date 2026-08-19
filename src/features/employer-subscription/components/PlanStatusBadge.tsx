"use client";

import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { SubscriptionStatus } from "../types/subscription.types";

const LABELS: Record<SubscriptionStatus, string> = {
  pending: "Pending",
  active: "Active",
  trialing: "Trial",
  past_due: "Past Due",
  cancelled: "Cancelled",
  expired: "Expired",
};

const TONES: Record<
  SubscriptionStatus,
  "default" | "success" | "warning" | "info" | "danger" | "muted"
> = {
  pending: "warning",
  active: "success",
  trialing: "info",
  past_due: "warning",
  cancelled: "danger",
  expired: "muted",
};

export function PlanStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <StatusBadge tone={TONES[status]}>{LABELS[status]}</StatusBadge>;
}
