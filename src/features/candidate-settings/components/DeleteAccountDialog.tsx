"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";

export function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    if (!open) return;

    setConfirmInput("");
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

  const isConfirmed = confirmInput.trim().toUpperCase() === "DELETE";

  const handleDeleteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    // SPRINT 6G: UI-ONLY CONFIRMATION
    // DO NOT make Supabase delete queries or call account deletion endpoints.
    toast.info("Account deletion is simulated in UI mode. Data is preserved.");
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-error/30 bg-card p-6 shadow-lift"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 id={titleId} className="text-lg font-bold text-text">
                    Delete Candidate Account?
                  </h2>
                  <p id={descriptionId} className="text-xs text-error font-medium">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <p className="mt-4 text-xs text-muted leading-relaxed">
              Deleting your account will permanently remove your candidate profile,
              uploaded resumes, job application history, saved jobs, and notification preferences.
            </p>

            <form onSubmit={handleDeleteSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="delete-confirm-input"
                  className="block text-xs font-semibold text-text mb-1.5"
                >
                  Type <span className="font-mono font-bold text-error">DELETE</span> to confirm:
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-[var(--radius-control)] border border-border bg-input px-3.5 py-2.5 text-sm font-mono text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/20"
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end pt-3 border-t border-border/60">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={!isConfirmed}
                  className={`inline-flex items-center justify-center rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-semibold transition-all ${
                    isConfirmed
                      ? "bg-error text-white shadow-soft hover:bg-error/90 cursor-pointer"
                      : "bg-error/30 text-white/60 cursor-not-allowed"
                  }`}
                >
                  Delete Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
