"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
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

export function CancelSubscriptionModal({
  open,
  subscription,
  currentPlan,
  onClose,
  onConfirmCancel,
}: {
  open: boolean;
  subscription: CandidateSubscription;
  currentPlan: CandidatePlanDefinition;
  onClose: () => void;
  onConfirmCancel: () => Promise<boolean>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      const panel = panelRef.current;
      const focusables = panel ? getFocusableElements(panel) : [];
      window.requestAnimationFrame(() => {
        (focusables[0] ?? panel)?.focus({ preventScroll: true });
      });

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !submitting) {
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
  }, [open, onClose, submitting]);

  const handleCancel = async () => {
    setSubmitting(true);
    const ok = await onConfirmCancel();
    setSubmitting(false);
    if (ok) {
      onClose();
    }
  };

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
            onClick={() => {
              if (!submitting) onClose();
            }}
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
            {!submitting && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-5 right-5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-text transition"
              >
                <X size={16} />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertCircle size={20} aria-hidden="true" />
              </div>
              <h2 id={titleId} className="text-lg font-bold tracking-tight text-text">
                Cancel your {currentPlan.name} subscription?
              </h2>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface/40 p-4">
              <p id={descriptionId} className="text-xs text-text leading-relaxed">
                You will continue to have access to all <strong>{currentPlan.name}</strong> features and higher limits until the end of your current billing period on <strong>{formatDisplayDate(subscription.currentPeriodEnd)}</strong>.
              </p>
              <p className="mt-2 text-[11px] text-muted">
                Your subscription will not renew automatically, and your account will revert to the Free plan afterwards.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={onClose}
              >
                Keep Plan
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void handleCancel()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
