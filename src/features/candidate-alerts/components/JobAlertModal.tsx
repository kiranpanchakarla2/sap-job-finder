"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Check, Info, Sparkles, X } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import {
  EXPERIENCE_FILTER_OPTIONS,
  LOCATION_FILTER_OPTIONS,
  SAP_MODULE_FILTER_OPTIONS,
  WORK_MODE_OPTIONS,
} from "@/features/candidate-jobs/constants";
import type {
  AlertFrequency,
  JobAlert,
  JobAlertFormErrors,
  JobAlertInput,
} from "../types/alert.types";

const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string; desc: string }[] = [
  { value: "instant", label: "Instant", desc: "As soon as a match is posted" },
  { value: "daily", label: "Daily Digest", desc: "Once per day summary" },
  { value: "weekly", label: "Weekly Summary", desc: "Weekly roundup of new roles" },
];

const EMPLOYMENT_TYPES = ["Any", "Full-time", "Contract", "Part-time", "Internship", "Freelance"];

const emptyFormState = (): JobAlertInput => ({
  name: "",
  keywords: [],
  sapModules: [],
  location: "",
  experience: "",
  workMode: "",
  employmentType: "",
  salaryMin: null,
  salaryMax: null,
  frequency: "daily",
});

export function JobAlertModal({
  open,
  initialAlert,
  onClose,
  onSave,
}: {
  open: boolean;
  initialAlert?: JobAlert | null;
  onClose: () => void;
  onSave: (input: JobAlertInput) => Promise<boolean>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [form, setForm] = useState<JobAlertInput>(emptyFormState);
  const [keywordInput, setKeywordInput] = useState("");
  const [errors, setErrors] = useState<JobAlertFormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialAlert) {
      setForm({
        name: initialAlert.name,
        keywords: [...initialAlert.keywords],
        sapModules: [...initialAlert.sapModules],
        location: initialAlert.location,
        experience: initialAlert.experience,
        workMode: initialAlert.workMode,
        employmentType: initialAlert.employmentType,
        salaryMin: initialAlert.salaryMin,
        salaryMax: initialAlert.salaryMax,
        frequency: initialAlert.frequency,
      });
    } else {
      setForm(emptyFormState());
    }
    setKeywordInput("");
    setErrors({});
    setSaving(false);
  }, [open, initialAlert]);

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

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;
    if (!form.keywords.includes(trimmed)) {
      setForm((prev) => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setForm((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((item) => item !== kw),
    }));
  };

  const toggleModule = (module: string) => {
    setForm((prev) => {
      const exists = prev.sapModules.includes(module);
      return {
        ...prev,
        sapModules: exists
          ? prev.sapModules.filter((m) => m !== module)
          : [...prev.sapModules, module],
      };
    });
  };

  // Generate dynamic live preview sentence
  const previewText = useMemo(() => {
    const parts: string[] = [];
    if (form.sapModules.length) {
      parts.push(form.sapModules.slice(0, 2).join(" / "));
    }
    if (form.keywords.length) {
      parts.push(form.keywords.slice(0, 2).join(", "));
    }
    const topic = parts.length ? parts.join(" & ") : "SAP";
    const loc = form.location ? `in ${form.location}` : "in any location";
    const exp = form.experience ? `for ${form.experience}` : "";
    const mode = form.workMode && form.workMode !== "Any" ? `(${form.workMode})` : "";
    const freqLabel =
      form.frequency === "instant"
        ? "instantly"
        : form.frequency === "daily"
          ? "daily"
          : "weekly";

    return `Notify me ${freqLabel} about ${topic} jobs ${loc} ${exp} ${mode}`.replace(/\s+/g, " ").trim() + ".";
  }, [form]);

  const validate = (): boolean => {
    const next: JobAlertFormErrors = {};
    if (!form.name.trim()) {
      next.name = "Alert name is required";
    }

    const hasCriteria =
      form.keywords.length > 0 ||
      form.sapModules.length > 0 ||
      Boolean(form.location && form.location !== "Any") ||
      Boolean(form.experience && form.experience !== "Any") ||
      Boolean(form.workMode && form.workMode !== "Any");

    if (!hasCriteria) {
      next.criteria = "Please select at least one SAP module, keyword, location, or experience criteria.";
    }

    if (
      form.salaryMin != null &&
      form.salaryMax != null &&
      form.salaryMin > form.salaryMax
    ) {
      next.salary = "Minimum salary cannot exceed maximum salary.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const success = await onSave(form);
    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
                  {initialAlert ? "Edit Job Alert" : "Create Job Alert"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Get notified when new SAP jobs match your preferences.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Alert Name */}
              <AuthInput
                label="Alert Name"
                placeholder="e.g. SAP Fiori Jobs - Hyderabad"
                value={form.name}
                error={errors.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />

              {/* SAP Modules / Skills */}
              <div>
                <label className="block text-sm font-medium text-text">
                  SAP Skills / Modules
                </label>
                <p className="text-xs text-muted">
                  Select key SAP modules you specialize in.
                </p>
                <div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border bg-surface/30 p-2.5">
                  {SAP_MODULE_FILTER_OPTIONS.map((module) => {
                    const selected = form.sapModules.includes(module);
                    return (
                      <button
                        key={module}
                        type="button"
                        onClick={() => toggleModule(module)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                          selected
                            ? "bg-primary text-white shadow-soft"
                            : "bg-surface text-muted hover:bg-card hover:text-text"
                        }`}
                        aria-pressed={selected}
                      >
                        {selected && <Check size={12} aria-hidden="true" />}
                        {module}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-text">
                  Keywords / Technologies
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="e.g. RAP, CAP, CDS, OData (press Enter)"
                    className="flex-1 rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addKeyword}
                    className="!h-10 !px-4"
                  >
                    Add
                  </Button>
                </div>
                {form.keywords.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeKeyword(kw)}
                          className="hover:text-accent focus:outline-none"
                          aria-label={`Remove keyword ${kw}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Location & Experience */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text">Location</label>
                  <NativeSelect
                    value={form.location}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2 text-sm text-text"
                  >
                    <option value="">Any Location</option>
                    {LOCATION_FILTER_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text">Experience</label>
                  <NativeSelect
                    value={form.experience}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, experience: e.target.value }))
                    }
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2 text-sm text-text"
                  >
                    <option value="">Any Experience</option>
                    {EXPERIENCE_FILTER_OPTIONS.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {/* Work Mode & Employment Type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text">Work Mode</label>
                  <NativeSelect
                    value={form.workMode}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, workMode: e.target.value }))
                    }
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2 text-sm text-text"
                  >
                    <option value="">Any Work Mode</option>
                    {WORK_MODE_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text">Employment Type</label>
                  <NativeSelect
                    value={form.employmentType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, employmentType: e.target.value }))
                    }
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2 text-sm text-text"
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type === "Any" ? "" : type}>
                        {type}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {/* Salary Range (LPA) */}
              <div>
                <label className="block text-sm font-medium text-text">
                  Salary Range (in ₹ LPA) <span className="text-xs text-muted font-normal">(Optional)</span>
                </label>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Min LPA (e.g. 10)"
                    value={form.salaryMin ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salaryMin: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="number"
                    min="0"
                    max="150"
                    placeholder="Max LPA (e.g. 25)"
                    value={form.salaryMax ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        salaryMax: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {errors.salary && (
                  <p className="mt-1 text-xs text-error" role="alert">
                    {errors.salary}
                  </p>
                )}
              </div>

              {/* Alert Frequency */}
              <div>
                <label className="block text-sm font-medium text-text">
                  Notification Frequency
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const selected = form.frequency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, frequency: opt.value }))}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-primary bg-primary/5 text-primary shadow-soft"
                            : "border-border bg-card text-muted hover:border-primary/30 hover:text-text"
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="text-xs font-semibold text-text">{opt.label}</span>
                        <span className="mt-0.5 text-[11px] leading-tight text-muted">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Criteria Validation Error */}
              {errors.criteria && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error" role="alert">
                  {errors.criteria}
                </div>
              )}

              {/* Dynamic Live Alert Preview */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Sparkles size={14} aria-hidden="true" />
                  <span>Alert Preview</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text">
                  {previewText}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="!px-4 !py-2.5"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="!px-5 !py-2.5"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : initialAlert
                      ? "Save Changes"
                      : "Create Job Alert"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
