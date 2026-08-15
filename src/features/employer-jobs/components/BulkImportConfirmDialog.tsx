"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";

interface BulkImportConfirmDialogProps {
  open: boolean;
  selectedCount: number;
  warningCount: number;
  errorCount: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkImportConfirmDialog({
  open,
  selectedCount,
  warningCount,
  errorCount,
  loading = false,
  onConfirm,
  onCancel,
}: BulkImportConfirmDialogProps) {
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
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss confirmation dialog"
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
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
            className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-lift"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {loading ? (
                  <Loader2 size={24} className="animate-spin text-primary" aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={24} aria-hidden="true" />
                )}
              </div>
              <div>
                <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
                  {loading ? "Importing Jobs..." : "Ready to Import?"}
                </h2>
                <p className="text-xs text-muted">
                  {loading
                    ? "Validating records and creating draft job postings..."
                    : "Please confirm the job creation details below."}
                </p>
              </div>
            </div>

            {/* Import Breakdown */}
            <div id={descriptionId} className="mt-5 space-y-3">
              {/* Ready / Selected Items */}
              <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs text-success">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                <div>
                  <span className="font-bold text-text">
                    {selectedCount} job{selectedCount === 1 ? "" : "s"}
                  </span>{" "}
                  are ready to be created in your company&apos;s job postings.
                </div>
              </div>

              {/* Warning Notice if applicable */}
              {warningCount > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-warning-foreground">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning-foreground" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-text">
                      {warningCount} selected job{warningCount === 1 ? "" : "s"}
                    </span>{" "}
                    contain warnings that you have acknowledged.
                  </div>
                </div>
              )}

              {/* Error Notice if applicable */}
              {errorCount > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error">
                  <XCircle size={16} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-error">
                      {errorCount} error row{errorCount === 1 ? "" : "s"}
                    </span>{" "}
                    will not be imported.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                className="w-full sm:w-auto !px-4 !py-2.5"
              >
                Back to Review
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
                disabled={loading || selectedCount === 0}
                className="w-full sm:w-auto !px-5 !py-2.5 min-w-[170px]"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Importing Jobs...</span>
                  </span>
                ) : (
                  "Confirm & Import"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

