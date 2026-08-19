"use client";

import { useState } from "react";
import { BadgeCheck, ShieldX, X, Loader2 } from "lucide-react";

type EmployerVerifyModalProps = {
  isOpen: boolean;
  companyName: string;
  targetVerification: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function EmployerVerifyModal({
  isOpen,
  companyName,
  targetVerification,
  onClose,
  onConfirm,
}: EmployerVerifyModalProps) {
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
      aria-labelledby="verify-employer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                targetVerification
                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              }`}
            >
              {targetVerification ? <BadgeCheck size={20} /> : <ShieldX size={20} />}
            </div>
            <div>
              <h2 id="verify-employer-title" className="text-base font-semibold text-text">
                {targetVerification ? "Verify Employer?" : "Remove Verification?"}
              </h2>
              <p className="text-xs text-muted">Employer Credential Governance</p>
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
            {targetVerification ? (
              <>
                Are you sure you want to mark{" "}
                <span className="font-semibold text-text">{companyName}</span> as a{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Verified Employer
                </span>
                ?
              </>
            ) : (
              <>
                Are you sure you want to remove verified status from{" "}
                <span className="font-semibold text-text">{companyName}</span>?
              </>
            )}
          </p>
          <p className="text-xs text-text">
            {targetVerification
              ? "Verified employers receive a trust badge across platform listings and job postings."
              : "The employer will be displayed with standard unverified status across platform listings."}
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
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition shadow-sm ${
              targetVerification
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <span>{targetVerification ? "Verify Employer" : "Remove Verification"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
