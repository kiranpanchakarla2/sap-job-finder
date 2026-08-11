"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import {
  getPlanLimits,
  isAtLimit,
} from "../config/planRules";
import type { EmployerSubscription } from "../types/subscription.types";

export function JobLimitReachedDialog({
  open,
  subscription,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  subscription: EmployerSubscription | null;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

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
  }, [open, onClose]);

  const limit = subscription
    ? getPlanLimits(subscription.planId).activeJobs
    : null;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/40"
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
            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              Active job limit reached
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              Your active job limit has been reached
              {limit !== null && subscription
                ? ` (${subscription.usage.activeJobs} / ${limit})`
                : ""}
              . Upgrade your plan to post more jobs.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={onUpgrade}>
                Upgrade Plan
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function JobLimitReachedPanel({
  subscription,
  onUpgrade,
}: {
  subscription: EmployerSubscription;
  onUpgrade: () => void;
}) {
  const limit = getPlanLimits(subscription.planId).activeJobs;
  if (!isAtLimit(subscription.usage.activeJobs, limit)) return null;

  return (
    <EmptyState
      icon={CreditCard}
      title="Active job limit reached"
      description="Your active job limit has been reached. Upgrade your plan to continue posting jobs."
      action={
        <Button type="button" onClick={onUpgrade}>
          Upgrade Plan
        </Button>
      }
    />
  );
}
