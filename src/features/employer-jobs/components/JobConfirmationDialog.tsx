"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";

type JobConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function JobConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: JobConfirmationDialogProps) {
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
              {title}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              {description}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                className="!px-4 !py-2.5"
              >
                {cancelLabel}
              </Button>
              <Button
                variant={tone === "danger" ? "secondary" : "primary"}
                onClick={onConfirm}
                disabled={loading}
                className={
                  tone === "danger"
                    ? "!border-error/30 !bg-error/10 !px-4 !py-2.5 !text-error hover:!bg-error/15"
                    : "!px-4 !py-2.5"
                }
              >
                {loading ? "Please wait…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
