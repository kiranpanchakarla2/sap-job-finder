"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/Button";
import type {
  CareerEducation,
  EducationFieldErrors,
} from "../types/resume.types";

const emptyDraft = (): Omit<CareerEducation, "id"> => ({
  degree: "",
  fieldOfStudy: "",
  institution: "",
  location: "",
  startDate: "",
  endDate: "",
  grade: "",
});

export function EducationModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: CareerEducation | null;
  onClose: () => void;
  onSave: (draft: Omit<CareerEducation, "id"> & { id?: string }) => void | Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<EducationFieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setDraft(
      initial
        ? {
            degree: initial.degree,
            fieldOfStudy: initial.fieldOfStudy,
            institution: initial.institution,
            location: initial.location,
            startDate: initial.startDate,
            endDate: initial.endDate,
            grade: initial.grade,
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
    const next: EducationFieldErrors = {};
    if (!draft.degree.trim()) next.degree = "Degree is required";
    if (!draft.institution.trim()) next.institution = "Institution is required";
    if (!draft.startDate) next.startDate = "Start date is required";
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
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {initial ? "Edit Education" : "Add Education"}
            </h2>
            <div className="mt-5 grid gap-4">
              <AuthInput
                label="Degree"
                value={draft.degree}
                error={errors.degree}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, degree: e.target.value }))
                }
              />
              <AuthInput
                label="Field of Study"
                value={draft.fieldOfStudy}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    fieldOfStudy: e.target.value,
                  }))
                }
              />
              <AuthInput
                label="Institution"
                value={draft.institution}
                error={errors.institution}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    institution: e.target.value,
                  }))
                }
              />
              <AuthInput
                label="Location"
                value={draft.location}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, location: e.target.value }))
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthInput
                  label="Start Date"
                  type="month"
                  value={draft.startDate.slice(0, 7)}
                  error={errors.startDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      startDate: e.target.value
                        ? `${e.target.value}-01`
                        : "",
                    }))
                  }
                />
                <AuthInput
                  label="End Date"
                  type="month"
                  value={draft.endDate.slice(0, 7)}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      endDate: e.target.value ? `${e.target.value}-01` : "",
                    }))
                  }
                />
              </div>
              <AuthInput
                label="Grade / Score"
                value={draft.grade}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, grade: e.target.value }))
                }
              />
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
                  void onSave({ ...draft, id: initial?.id });
                }}
              >
                {initial ? "Save Changes" : "Add Education"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
