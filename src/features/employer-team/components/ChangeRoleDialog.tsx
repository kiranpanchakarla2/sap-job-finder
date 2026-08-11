"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import type { EmployerCompanyRole } from "@/lib/auth/employerPermissions";
import {
  CHANGE_ROLE_OPTIONS,
  memberDisplayName,
  teamRoleLabel,
  type TeamMember,
} from "../types/team.types";

type ChangeRoleDialogProps = {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onSubmit: (
    memberId: string,
    role: Exclude<EmployerCompanyRole, "owner">,
  ) => Promise<boolean>;
};

export function ChangeRoleDialog({
  open,
  member,
  onClose,
  onSubmit,
}: ChangeRoleDialogProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<Exclude<EmployerCompanyRole, "owner">>("recruiter");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !member) return;
    setRole(
      member.role === "owner" || member.role === "admin"
        ? member.role === "admin"
          ? "admin"
          : "recruiter"
        : member.role,
    );
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
  }, [open, member, onClose, submitting]);

  if (!member) return null;

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
              Change Role
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              {memberDisplayName(member)}
            </p>
            <p className="mt-3 text-sm text-text">
              Current role:{" "}
              <span className="font-semibold">{teamRoleLabel(member.role)}</span>
            </p>
            <div className="mt-4">
              <label
                htmlFor="change-role"
                className="mb-1.5 block text-sm font-medium text-text"
              >
                New role
              </label>
              <NativeSelect
                id="change-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as Exclude<EmployerCompanyRole, "owner">)
                }
                disabled={submitting || member.role === "owner"}
                className="h-11 w-full"
              >
                {CHANGE_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                type="button"
                disabled={submitting || member.role === "owner"}
                className="!px-4 !py-2.5"
                onClick={() => {
                  void (async () => {
                    setSubmitting(true);
                    const ok = await onSubmit(member.id, role);
                    setSubmitting(false);
                    if (ok) onClose();
                  })();
                }}
              >
                {submitting ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
