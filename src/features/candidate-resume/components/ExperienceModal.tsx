"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { AuthTextarea } from "@/components/auth/AuthTextarea";
import { Button } from "@/components/ui/Button";
import { EMPLOYMENT_TYPE_OPTIONS } from "../lib/resumeUtils";
import type {
  CareerExperience,
  ExperienceFieldErrors,
  ResumeEmploymentType,
} from "../types/resume.types";

const emptyDraft = (): Omit<CareerExperience, "id"> => ({
  jobTitle: "",
  company: "",
  location: "",
  employmentType: "Full-time",
  startDate: "",
  endDate: "",
  currentlyWorking: false,
  description: "",
});

export function ExperienceModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: CareerExperience | null;
  onClose: () => void;
  onSave: (draft: Omit<CareerExperience, "id"> & { id?: string }) => void | Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<ExperienceFieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setDraft(
      initial
        ? {
            jobTitle: initial.jobTitle,
            company: initial.company,
            location: initial.location,
            employmentType: initial.employmentType,
            startDate: initial.startDate,
            endDate: initial.endDate,
            currentlyWorking: initial.currentlyWorking,
            description: initial.description,
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
    const next: ExperienceFieldErrors = {};
    if (!draft.jobTitle.trim()) next.jobTitle = "Job title is required";
    if (!draft.company.trim()) next.company = "Company is required";
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
              {initial ? "Edit Experience" : "Add Experience"}
            </h2>
            <div className="mt-5 grid gap-4">
              <AuthInput
                label="Job Title"
                value={draft.jobTitle}
                error={errors.jobTitle}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, jobTitle: e.target.value }))
                }
              />
              <AuthInput
                label="Company"
                value={draft.company}
                error={errors.company}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, company: e.target.value }))
                }
              />
              <AuthInput
                label="Location"
                value={draft.location}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, location: e.target.value }))
                }
              />
              <AuthSelect
                label="Employment Type"
                value={draft.employmentType}
                options={[...EMPLOYMENT_TYPE_OPTIONS]}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    employmentType: e.target.value as ResumeEmploymentType,
                  }))
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
                  disabled={draft.currentlyWorking}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      endDate: e.target.value ? `${e.target.value}-01` : "",
                    }))
                  }
                />
              </div>
              <AuthCheckbox
                label="Currently Working Here"
                checked={draft.currentlyWorking}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    currentlyWorking: e.target.checked,
                    endDate: e.target.checked ? "" : prev.endDate,
                  }))
                }
              />
              <AuthTextarea
                label="Description"
                rows={5}
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
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
                {initial ? "Save Changes" : "Add Experience"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
