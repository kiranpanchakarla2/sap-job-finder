"use client";

import { memo, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { AdminCandidatePlan } from "../../types/plan.types";

type CandidatePlanDeactivateModalProps = {
  plan: AdminCandidatePlan | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const CandidatePlanDeactivateModal = memo(function CandidatePlanDeactivateModal({
  plan,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: CandidatePlanDeactivateModalProps) {
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
      aria-labelledby="deactivate-plan-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-elevation-3 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 id="deactivate-plan-title" className="text-lg font-bold text-text">
              Deactivate Plan?
            </h3>
            <p className="text-xs font-semibold text-text-muted">
              Plan: <span className="text-text font-bold">{plan.name}</span> ({plan.id})
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-surface-hover/60 border border-border/70 p-3.5 text-sm text-text-secondary leading-relaxed">
          This plan will no longer be available for new subscriptions. Existing subscriptions using this plan will remain unchanged.
        </div>

        {plan.activeSubscriptionsCount !== undefined && plan.activeSubscriptionsCount > 0 && (
          <div className="text-xs text-text-muted flex items-center gap-1.5 px-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Currently used by{" "}
            <strong className="text-text">{plan.activeSubscriptionsCount} active</strong>{" "}
            candidate subscription{plan.activeSubscriptionsCount === 1 ? "" : "s"}.
          </div>
        )}

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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-soft transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deactivating...
              </>
            ) : (
              "Deactivate Plan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
