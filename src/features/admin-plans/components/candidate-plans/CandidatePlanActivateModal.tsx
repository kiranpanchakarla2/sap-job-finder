"use client";

import { memo, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { AdminCandidatePlan } from "../../types/plan.types";

type CandidatePlanActivateModalProps = {
  plan: AdminCandidatePlan | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const CandidatePlanActivateModal = memo(function CandidatePlanActivateModal({
  plan,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: CandidatePlanActivateModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !plan) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activate-plan-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-elevation-3 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 id="activate-plan-title" className="text-lg font-bold text-text">
              Activate Plan?
            </h3>
            <p className="text-xs font-semibold text-text-muted">
              Plan: <span className="text-text font-bold">{plan.name}</span> ({plan.id})
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-surface-hover/60 border border-border/70 p-3.5 text-sm text-text-secondary leading-relaxed">
          Make this plan available for new subscriptions again? It will immediately appear on the Candidate subscription page in its configured display order.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover hover:text-text transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-soft transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate Plan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
