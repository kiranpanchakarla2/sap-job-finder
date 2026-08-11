"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import {
  INVITE_ROLE_OPTIONS,
  type InvitationRole,
} from "../types/team.types";

type InviteMemberDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: InvitationRole) => Promise<boolean>;
};

export function InviteMemberDialog({
  open,
  onClose,
  onSubmit,
}: InviteMemberDialogProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("recruiter");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole("recruiter");
    setError(null);
    setSubmitting(false);
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    window.requestAnimationFrame(() => {
      (focusables[0] ?? panel)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        event.preventDefault();
        onClose();
        return;
      }
      if (panel) trapFocus(event, panel);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const ok = await onSubmit(trimmed, role);
    setSubmitting(false);
    if (ok) onClose();
  };

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
              if (!submitting) onClose();
            }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              Invite Team Member
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              Invite a colleague to join your company on SAP Jobs Finder.
              Email delivery will be connected in a later step.
            </p>
            <form className="mt-5 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-1.5 block text-sm font-medium text-text"
                >
                  Email *
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm text-input-fg outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
                  disabled={submitting}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-1.5 block text-sm font-medium text-text"
                >
                  Role *
                </label>
                <NativeSelect
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as InvitationRole)}
                  disabled={submitting}
                  className="h-11 w-full"
                >
                  {INVITE_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {error ? (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={submitting}
                  className="!px-4 !py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="!px-4 !py-2.5"
                >
                  {submitting ? "Sending…" : "Send Invitation"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
