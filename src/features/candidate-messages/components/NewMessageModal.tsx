"use client";

import { useId, useState } from "react";
import { Send, X } from "lucide-react";
import { useApplications } from "@/features/candidate-applications";
import type { StartConversationInput } from "../types/message.types";

export function NewMessageModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: StartConversationInput) => Promise<void>;
}) {
  const selectId = useId();
  const messageId = useId();
  const { applications } = useApplications();
  const [selectedAppId, setSelectedAppId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const validOptions = applications.filter((app) => app.job && app.job.companyName);

  const selectedApp = applications.find((app) => app.id === selectedAppId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !message.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        companyId: `comp_${selectedApp.job.companyName.toLowerCase().replace(/\s+/g, "_")}`,
        companyName: selectedApp.job.companyName,
        jobId: selectedApp.jobId,
        jobTitle: selectedApp.job.title,
        applicationId: selectedApp.id,
        applicationStatus: selectedApp.status,
        initialMessage: message.trim(),
      });
      setMessage("");
      setSelectedAppId("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-message-title"
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-lift max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 id="new-message-title" className="text-lg font-bold text-text">
              New Message
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Message an employer regarding an active job application.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            aria-label="Close dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor={selectId}
              className="block text-xs font-semibold text-text"
            >
              Select Application / Employer <span className="text-error">*</span>
            </label>
            <select
              id={selectId}
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              required
              className="mt-1.5 w-full rounded-[var(--radius-control)] border border-border bg-input px-3.5 py-2.5 text-sm text-input-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <option value="" disabled>
                Select an application…
              </option>
              {validOptions.length > 0 ? (
                validOptions.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.job.companyName} — {app.job.title}
                  </option>
                ))
              ) : (
                <option value="default" disabled>
                  No applications found (apply to jobs first)
                </option>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor={messageId}
              className="block text-xs font-semibold text-text"
            >
              Message <span className="text-error">*</span>
            </label>
            <textarea
              id={messageId}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I would like to inquire about the status of my application…"
              required
              maxLength={5000}
              className="mt-1.5 w-full resize-none rounded-[var(--radius-control)] border border-border bg-input px-3.5 py-2.5 text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedAppId || !message.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-50"
            >
              <Send size={15} aria-hidden="true" />
              <span>{submitting ? "Sending…" : "Send Message"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
