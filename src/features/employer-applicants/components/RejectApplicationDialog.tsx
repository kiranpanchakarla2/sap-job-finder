"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import type { EmployerApplication } from "../types/application.types";

export function RejectApplicationDialog({
  open,
  application,
  reason,
  loading = false,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  application: EmployerApplication | null;
  reason: string;
  loading?: boolean;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    window.requestAnimationFrame(() => {
      (focusables[0] ?? panel)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (panel) trapFocus(event, panel);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus({ preventScroll: true });
    };
  }, [open, loading, onCancel]);

  return (
    <AnimatePresence>
      {open && application ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/40"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={() => {
              if (!loading) onCancel();
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
            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              Reject Candidate?
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              Are you sure you want to reject this application from{" "}
              {application.candidateName}?
            </p>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Reason (optional)
              <textarea
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                rows={3}
                placeholder="Share a short reason for your team…"
                className="mt-2 w-full resize-none rounded-2xl border border-border bg-input px-3 py-2.5 text-sm font-medium text-input-fg outline-none focus:border-primary"
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                className="!px-4 !py-2.5"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={onConfirm}
                disabled={loading}
                className="!border-error/30 !bg-error/10 !px-4 !py-2.5 !text-error hover:!bg-error/15"
              >
                {loading ? "Please wait…" : "Reject Candidate"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
