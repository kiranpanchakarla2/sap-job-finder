"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { formatPlanPrice, getPlanDefinition } from "../config/planRules";
import type { PlanId } from "../types/subscription.types";

export function UpgradeModal({
  open,
  planId,
  onClose,
}: {
  open: boolean;
  planId: PlanId | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const plan = planId ? getPlanDefinition(planId) : null;

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

  const onContinue = () => {
    toast.message("Payment integration coming soon.", {
      description: "Upgrade flow started. Billing will be available in Sprint 6B.",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && plan ? (
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
              Upgrade to {plan.name}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              {plan.description}
            </p>

            <p className="mt-4 text-3xl font-bold text-text">
              {formatPlanPrice(plan.priceMonthly)}
              <span className="text-sm font-medium text-muted">
                /{plan.billingPeriod}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">Billed monthly</p>

            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-text">
                  <Check
                    size={16}
                    className="mt-0.5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={onContinue}>
                Continue
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
