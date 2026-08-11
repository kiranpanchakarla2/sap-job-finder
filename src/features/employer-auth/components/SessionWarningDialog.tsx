"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_SESSION_MESSAGES } from "../config/employerSession";

type SessionWarningDialogProps = {
  open: boolean;
  onContinue: () => void;
  onSignOut: () => void;
  continuing?: boolean;
};

export function SessionWarningDialog({
  open,
  onContinue,
  onSignOut,
  continuing = false,
}: SessionWarningDialogProps) {
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
    focusables[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }
      if (panel) trapFocus(event, panel);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          role="presentation"
        >
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              Session expiring
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              {EMPLOYER_SESSION_MESSAGES.inactivityWarning}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onSignOut}
                disabled={continuing}
              >
                Sign Out
              </Button>
              <Button
                type="button"
                onClick={onContinue}
                disabled={continuing}
              >
                {continuing ? "Continuing…" : "Continue Session"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function EmployerSessionShell({
  children,
  warningOpen,
  onContinue,
  onSignOut,
  continuing,
}: {
  children: ReactNode;
  warningOpen: boolean;
  onContinue: () => void;
  onSignOut: () => void;
  continuing?: boolean;
}) {
  return (
    <>
      {children}
      <SessionWarningDialog
        open={warningOpen}
        onContinue={onContinue}
        onSignOut={onSignOut}
        continuing={continuing}
      />
    </>
  );
}
