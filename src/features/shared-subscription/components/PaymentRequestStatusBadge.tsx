"use client";

import { AlertTriangle, CheckCircle2, Clock, MessageSquare, XCircle } from "lucide-react";
import type { PaymentRequestRecord, PaymentRequestStatus } from "../types/subscription.types";
import { getPaymentRequestDisplayStatus } from "../utils/paymentRequestUtils";

interface PaymentRequestStatusBadgeProps {
  status?: PaymentRequestStatus;
  request?: Pick<PaymentRequestRecord, "status" | "expiresAt" | "requestedAt"> | null;
  isExpired?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PaymentRequestStatusBadge({
  status,
  request,
  isExpired: forceExpired,
  size = "sm",
  className = "",
}: PaymentRequestStatusBadgeProps) {
  const reqObj = request ?? (status ? { status, expiresAt: null, requestedAt: new Date().toISOString() } : null);
  const display = getPaymentRequestDisplayStatus(reqObj);

  const effectiveVariant = forceExpired ? "expired" : display.variant;
  const effectiveLabel = forceExpired ? "Payment Request Expired" : display.label;

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5"
      : "text-xs px-2.5 py-1 gap-2";

  const iconSize = size === "sm" ? 12 : 14;

  let styleClasses = "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20";
  let Icon = Clock;

  switch (effectiveVariant) {
    case "pending":
      styleClasses = "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30";
      Icon = Clock;
      break;
    case "payment_link_sent":
      styleClasses = "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30";
      Icon = MessageSquare;
      break;
    case "payment_received":
      styleClasses = "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30";
      Icon = CheckCircle2;
      break;
    case "cancelled":
      styleClasses = "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30";
      Icon = XCircle;
      break;
    case "expired":
      styleClasses = "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
      Icon = AlertTriangle;
      break;
  }

  return (
    <span
      role="status"
      aria-label={effectiveLabel}
      className={`inline-flex items-center font-semibold rounded-md border ${sizeClasses} ${styleClasses} ${className}`}
    >
      <Icon size={iconSize} aria-hidden="true" className="shrink-0" />
      <span>{effectiveLabel}</span>
    </span>
  );
}
