"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import type { EmployerCandidateProfile } from "../types/employerCandidate.types";

type ContactCandidateModalProps = {
  candidate: EmployerCandidateProfile;
  isOpen: boolean;
  onClose: () => void;
};

export function ContactCandidateModal({
  candidate,
  isOpen,
  onClose,
}: ContactCandidateModalProps) {
  const [roleTitle, setRoleTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please provide a project description or message.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success(`Inquiry sent to ${candidate.name}.`);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare size={16} />
            </div>
            <h3 className="text-base font-bold text-text">Contact Candidate</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:bg-surface hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="mt-4 text-base font-bold text-text">Interest Expressed</h4>
            <p className="mt-2 text-xs text-muted max-w-sm mx-auto">
              Your inquiry has been logged. {candidate.name} will be notified of your project opportunity.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-[var(--radius-button)] bg-primary px-6 py-2 text-xs font-semibold text-white shadow-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Candidate
              </label>
              <p className="mt-1 text-sm font-semibold text-text">
                {candidate.name} — <span className="text-primary">{candidate.headline}</span>
              </p>
            </div>

            <div>
              <label htmlFor="roleTitle" className="text-xs font-bold uppercase tracking-wider text-muted">
                Role / Engagement Title (Optional)
              </label>
              <input
                id="roleTitle"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Lead S/4HANA Finance Architect"
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs text-text shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="inquiryMsg" className="text-xs font-bold uppercase tracking-wider text-muted">
                Project Overview or Inquiry Message *
              </label>
              <textarea
                id="inquiryMsg"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your project scope, implementation timelines, location preferences, and why this candidate's profile is a fit..."
                className="mt-1.5 w-full rounded-lg border border-border bg-card p-3 text-xs text-text shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 disabled:opacity-50"
              >
                <Send size={13} />
                <span>{submitting ? "Sending..." : "Send Inquiry"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
