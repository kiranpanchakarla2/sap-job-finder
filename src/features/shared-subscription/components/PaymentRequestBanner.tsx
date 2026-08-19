"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock, MessageSquare, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PaymentRequestRecord } from "../types/subscription.types";
import { formatCurrency } from "../utils/pricingCalculations";
import { getBillingCycleMetadata } from "../config/billingCycles";
import { getPaymentRequestDisplayStatus } from "../utils/paymentRequestUtils";

interface PaymentRequestBannerProps {
  request: PaymentRequestRecord | null | undefined;
  onRequestNew?: () => void;
  className?: string;
}

export function PaymentRequestBanner({
  request,
  onRequestNew,
  className = "",
}: PaymentRequestBannerProps) {
  if (!request) return null;

  const display = getPaymentRequestDisplayStatus(request);
  const cycleMeta = getBillingCycleMetadata(request.billingCycle);
  const planDisplay = request.planName || request.planId;
  const formattedAmount = formatCurrency(request.amount, request.currency);

  if (display.variant === "expired") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-slate-500/30 bg-slate-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-500/20 text-slate-700 dark:text-slate-300">
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Payment Request Expired
                </p>
                <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] font-semibold text-slate-800 dark:text-slate-300">
                  {planDisplay} · {cycleMeta.displayName}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                This request is no longer valid. You can submit a new request.
              </p>
            </div>
          </div>

          {onRequestNew && (
            <div className="shrink-0">
              <Button
                type="button"
                onClick={onRequestNew}
                className="theme-btn-primary h-8 text-xs font-semibold"
              >
                <RefreshCw size={13} aria-hidden="true" className="mr-1.5" />
                Request New Payment Link
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (display.variant === "pending") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <Clock size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Payment Request Pending
                </p>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                  {planDisplay} · {cycleMeta.displayName}
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                We’ve received your request for <strong>{planDisplay}</strong> ({formattedAmount}).
                Our team will contact you on WhatsApp at{" "}
                <strong>{request.whatsappNumber}</strong> with the payment details.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <MessageSquare size={13} aria-hidden="true" />
              Awaiting Payment Details
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (display.variant === "payment_link_sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-sky-500/30 bg-sky-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300">
              <MessageSquare size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-sky-900 dark:text-sky-100">
                  Payment Link Sent
                </p>
                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:text-sky-300">
                  {planDisplay} · {cycleMeta.displayName}
                </span>
              </div>
              <p className="mt-1 text-xs text-sky-800/90 dark:text-sky-200/90 leading-relaxed">
                Payment details have been sent to your WhatsApp contact at{" "}
                <strong>{request.whatsappNumber}</strong>. Please complete the transfer to activate your subscription.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (display.variant === "payment_received") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-emerald-500/30 bg-emerald-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                Payment Received
              </p>
              <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed">
                We’ve recorded your payment. Your subscription will be activated through the subscription management process.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (display.variant === "cancelled") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-rose-500/30 bg-rose-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
              <XCircle size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-100">
                Payment Request Cancelled
              </p>
              <p className="mt-1 text-xs text-rose-800/90 dark:text-rose-200/90 leading-relaxed">
                This payment request has been cancelled.
              </p>
            </div>
          </div>

          {onRequestNew && (
            <div className="shrink-0">
              <Button
                type="button"
                onClick={onRequestNew}
                className="theme-btn-primary h-8 text-xs font-semibold"
              >
                Choose a Plan
                <ArrowRight size={13} aria-hidden="true" className="ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
