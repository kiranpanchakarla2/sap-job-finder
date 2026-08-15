"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, CreditCard, ShieldAlert, X } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { formatCandidatePlanPrice } from "../config/planRules";
import type { CandidatePlanDefinition, CandidateSubscription } from "../types/subscription.types";

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

export function ManageSubscriptionModal({
  open,
  subscription,
  currentPlan,
  onClose,
  onRequestCancel,
}: {
  open: boolean;
  subscription: CandidateSubscription;
  currentPlan: CandidatePlanDefinition;
  onClose: () => void;
  onRequestCancel: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      const panel = panelRef.current;
      const focusables = panel ? getFocusableElements(panel) : [];
      window.requestAnimationFrame(() => {
        (focusables[0] ?? panel)?.focus({ preventScroll: true });
      });

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (panel) trapFocus(event, panel);
      };

      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        previouslyFocused.current?.focus({ preventScroll: true });
      };
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-lift"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-5 right-5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-text transition"
            >
              <X size={16} />
            </button>

            <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
              Manage Subscription
            </h2>
            <p id={descriptionId} className="mt-1 text-xs text-muted">
              Review and manage your active candidate subscription plan.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-border bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Plan</span>
                  <span className="text-sm font-bold text-text">{currentPlan.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Price</span>
                  <span className="text-sm font-bold text-text">
                    {formatCandidatePlanPrice(currentPlan.priceMonthly, currentPlan.currency)}/month
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Next Renewal</span>
                  <span className="text-sm font-semibold text-text">
                    {formatDisplayDate(subscription.renewalDate ?? subscription.currentPeriodEnd)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Status</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 capitalize">
                    {subscription.status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface/30 p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={16} className="mt-0.5 text-muted shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold text-text">Cancellation Policy</p>
                    <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                      You can cancel anytime. If you cancel, you will maintain full access until the end of your current billing period.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-between items-center">
              <button
                type="button"
                onClick={onRequestCancel}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline py-2"
              >
                Cancel Subscription
              </button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
