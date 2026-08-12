"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/Button";
import type { CandidateCertification } from "../types/profile.types";

type CertificationDraft = Omit<CandidateCertification, "id" | "status">;

const emptyDraft = (): CertificationDraft => ({
  name: "",
  issuingOrganization: "",
  certificationId: "",
  issueDate: "",
  expiryDate: "",
});

export function CertificationModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: CandidateCertification | null;
  onClose: () => void;
  onSave: (draft: CertificationDraft & { id?: string }) => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState<CertificationDraft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof CertificationDraft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setDraft(
      initial
        ? {
            name: initial.name,
            issuingOrganization: initial.issuingOrganization,
            certificationId: initial.certificationId,
            issueDate: initial.issueDate,
            expiryDate: initial.expiryDate,
          }
        : emptyDraft(),
    );
    setErrors({});
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

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

  const validate = () => {
    const next: Partial<Record<keyof CertificationDraft, string>> = {};
    if (!draft.name.trim()) next.name = "Certification name is required";
    if (!draft.issuingOrganization.trim()) {
      next.issuingOrganization = "Issuing organization is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
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
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {initial ? "Edit Certification" : "Add Certification"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Changes are saved when you click Save Changes on your profile.
            </p>

            <div className="mt-5 grid gap-4">
              <AuthInput
                label="Certification Name"
                value={draft.name}
                error={errors.name}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <AuthInput
                label="Issuing Organization"
                value={draft.issuingOrganization}
                error={errors.issuingOrganization}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    issuingOrganization: event.target.value,
                  }))
                }
              />
              <AuthInput
                label="Certification ID"
                value={draft.certificationId}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    certificationId: event.target.value,
                  }))
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthInput
                  label="Issue Date"
                  type="date"
                  value={draft.issueDate}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      issueDate: event.target.value,
                    }))
                  }
                />
                <AuthInput
                  label="Expiry Date"
                  type="date"
                  value={draft.expiryDate}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      expiryDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="!px-4 !py-2.5"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="!px-4 !py-2.5"
                onClick={() => {
                  if (!validate()) return;
                  onSave({ ...draft, id: initial?.id });
                }}
              >
                {initial ? "Update" : "Add Certification"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
