"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

type CandidateSuspendModalProps = {
  isOpen: boolean;
  candidateName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function CandidateSuspendModal({
  isOpen,
  candidateName,
  onClose,
  onConfirm,
}: CandidateSuspendModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-candidate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 id="suspend-candidate-title" className="text-base font-semibold text-text">
                Suspend Candidate?
              </h2>
              <p className="text-xs text-muted">Administrative Account Action</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-muted hover:text-text disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 text-xs text-muted leading-relaxed">
          <p>
            Are you sure you want to suspend{" "}
            <span className="font-semibold text-text">{candidateName}</span>?
          </p>
          <div className="rounded-md bg-rose-500/5 border border-rose-500/20 p-3 text-rose-600 dark:text-rose-400 space-y-1">
            <p className="font-medium">Consequences of suspension:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>The candidate will be logged out and cannot sign into the Candidate Portal.</li>
              <li>Active sessions will be rejected by authorization guards.</li>
              <li>Candidate data will be preserved and can be reactivated at any time.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Suspending...</span>
              </>
            ) : (
              <span>Suspend Account</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
