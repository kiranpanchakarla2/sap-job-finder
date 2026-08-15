"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { formatCandidatePlanPrice, getCandidatePlanDefinition } from "../config/planRules";
import type { CandidatePlanId } from "../types/subscription.types";

export function UpgradeModal({
  open,
  targetPlanId,
  currentPlanId,
  onClose,
  onConfirmUpgrade,
}: {
  open: boolean;
  targetPlanId: CandidatePlanId | null;
  currentPlanId: CandidatePlanId;
  onClose: () => void;
  onConfirmUpgrade: (planId: CandidatePlanId) => Promise<boolean>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const targetPlan = targetPlanId ? getCandidatePlanDefinition(targetPlanId) : null;
  const currentPlan = getCandidatePlanDefinition(currentPlanId);

  const isDowngrade =
    (currentPlanId === "premium" && targetPlanId !== "premium") ||
    (currentPlanId === "professional" && targetPlanId === "free");

  useEffect(() => {
    if (open) {
      setStep("confirm");
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      const panel = panelRef.current;
      const focusables = panel ? getFocusableElements(panel) : [];
      window.requestAnimationFrame(() => {
        (focusables[0] ?? panel)?.focus({ preventScroll: true });
      });

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && step !== "processing") {
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
  }, [open, onClose, step]);

  const handleContinue = async () => {
    if (!targetPlanId) return;
    setStep("processing");
    const success = await onConfirmUpgrade(targetPlanId);
    if (success) {
      setStep("success");
    } else {
      setStep("confirm");
    }
  };

  return (
    <AnimatePresence>
      {open && targetPlan ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={() => {
              if (step !== "processing") onClose();
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
            className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-lift"
          >
            {step !== "processing" && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-5 right-5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-text transition"
              >
                <X size={16} />
              </button>
            )}

            {/* STEP 1: CONFIRM */}
            {step === "confirm" && (
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 items-center gap-1 rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                    <Sparkles size={12} aria-hidden="true" />
                    {isDowngrade ? "Plan Change" : "Upgrade Plan"}
                  </span>
                </div>

                <h2 id={titleId} className="mt-3 text-xl font-bold tracking-tight text-text">
                  {isDowngrade
                    ? `Switch to ${targetPlan.name}`
                    : `Upgrade to ${targetPlan.name}`}
                </h2>

                <p id={descriptionId} className="mt-1 text-xs text-muted leading-relaxed">
                  {isDowngrade
                    ? `You are switching from ${currentPlan.name} to ${targetPlan.name}. Your new benefits and limits will apply.`
                    : `You are upgrading from ${currentPlan.name} to ${targetPlan.name}. Unlock advanced tools and higher candidate limits.`}
                </p>

                <div className="mt-4 rounded-xl border border-border bg-surface/50 p-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted">Selected Plan</p>
                      <p className="text-lg font-bold text-text">{targetPlan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-text">
                        {formatCandidatePlanPrice(targetPlan.priceMonthly, targetPlan.currency)}
                      </p>
                      <p className="text-[11px] text-muted">Billed monthly</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Key {targetPlan.name} Benefits
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {targetPlan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-text">
                        <Check size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleContinue()}
                    className="theme-btn-primary font-semibold"
                  >
                    {isDowngrade ? "Confirm Switch" : `Continue to ${targetPlan.name}`}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: PROCESSING */}
            {step === "processing" && (
              <div className="py-8 text-center">
                <Loader2
                  size={36}
                  className="mx-auto animate-spin text-primary"
                  aria-hidden="true"
                />
                <h2 id={titleId} className="mt-4 text-lg font-bold text-text">
                  Processing your subscription...
                </h2>
                <p id={descriptionId} className="mt-1 text-xs text-muted">
                  Applying {targetPlan.name} plan entitlements to your candidate profile.
                </p>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === "success" && (
              <div className="text-center py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={32} aria-hidden="true" />
                </div>

                <h2 id={titleId} className="mt-4 text-xl font-bold tracking-tight text-text">
                  {isDowngrade ? "Plan Switched Successfully" : "Upgrade Successful!"}
                </h2>

                <p id={descriptionId} className="mt-1.5 text-xs text-muted max-w-sm mx-auto">
                  You are now on the <strong>{targetPlan.name}</strong> plan. Your candidate account has been upgraded with all {targetPlan.name} capabilities.
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link
                    href="/candidate/dashboard"
                    onClick={onClose}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-soft hover:opacity-95 transition"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/candidate/jobs"
                    onClick={onClose}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-text hover:bg-surface-hover transition"
                  >
                    Explore SAP Jobs
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
