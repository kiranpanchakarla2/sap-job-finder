"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_OPTIONS,
} from "../constants";
import { getAllowedNextStatuses } from "../lib/status";
import type {
  ApplicationStatus,
  EmployerApplication,
} from "../types/application.types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

export function ChangeApplicationStatusDialog({
  open,
  application,
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  application: EmployerApplication | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (status: ApplicationStatus, notes?: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [nextStatus, setNextStatus] = useState<ApplicationStatus>("reviewing");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !application) return;
    const allowed = getAllowedNextStatuses(application.status);
    setNextStatus(allowed[0] ?? application.status);
    setNotes("");
  }, [open, application]);

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

  if (!application) return null;

  const options =
    getAllowedNextStatuses(application.status).length > 0
      ? getAllowedNextStatuses(application.status)
      : APPLICATION_STATUS_OPTIONS;

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
              Change Status
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              Update the application status for {application.candidateName}.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Current Status
                </p>
                <div className="mt-2">
                  <ApplicationStatusBadge status={application.status} />
                </div>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                New Status
                <NativeSelect
                  value={nextStatus}
                  onChange={(event) =>
                    setNextStatus(event.target.value as ApplicationStatus)
                  }
                  wrapperClassName="mt-2.5"
                  className="h-11 rounded-2xl border border-border bg-input px-3 text-sm font-medium text-input-fg outline-none focus:border-primary"
                >
                  {options.map((status) => (
                    <option key={status} value={status}>
                      {APPLICATION_STATUS_LABELS[status]}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Notes (optional)
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Add an internal note…"
                  className="mt-2 w-full resize-none rounded-2xl border border-border bg-input px-3 py-2.5 text-sm font-medium text-input-fg outline-none focus:border-primary"
                />
              </label>
            </div>

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
                onClick={() => onConfirm(nextStatus, notes)}
                disabled={loading}
                className="!px-4 !py-2.5"
              >
                {loading ? "Please wait…" : "Update Status"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
