"use client";

import { useState } from "react";
import { CheckCircle2, X, Loader2 } from "lucide-react";

type CandidateReactivateModalProps = {
  isOpen: boolean;
  candidateName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function CandidateReactivateModal({
  isOpen,
  candidateName,
  onClose,
  onConfirm,
}: CandidateReactivateModalProps) {
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
      aria-labelledby="reactivate-candidate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 id="reactivate-candidate-title" className="text-base font-semibold text-text">
                Reactivate Candidate?
              </h2>
              <p className="text-xs text-muted">Restore Account Access</p>
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
            Are you sure you want to reactivate{" "}
            <span className="font-semibold text-text">{candidateName}</span>?
          </p>
          <p className="text-xs text-text">
            This will allow the candidate to sign into the platform and resume standard candidate privileges.
          </p>
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
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Reactivating...</span>
              </>
            ) : (
              <span>Reactivate Account</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
