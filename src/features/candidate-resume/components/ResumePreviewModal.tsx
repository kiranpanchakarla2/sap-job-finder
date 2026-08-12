"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, FileText, X } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { CandidateResume } from "../types/resume.types";
import { formatDisplayDate, formatFileSize } from "../lib/resumeUtils";

export function ResumePreviewModal({
  open,
  resume,
  onClose,
  onDownload,
}: {
  open: boolean;
  resume: CandidateResume | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
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

  return (
    <AnimatePresence>
      {open && resume ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
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
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            className="relative z-10 flex h-[90vh] w-full max-w-4xl flex-col rounded-[var(--radius-card)] border border-border bg-card shadow-lift"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="truncate text-lg font-semibold text-text"
                >
                  {resume.fileName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {resume.isCurrent ? (
                    <StatusBadge tone="success">Current</StatusBadge>
                  ) : (
                    <StatusBadge tone="muted">{resume.status}</StatusBadge>
                  )}
                  <span className="text-xs text-muted">
                    {resume.fileType} • {formatFileSize(resume.fileSize)} •{" "}
                    {formatDisplayDate(resume.uploadedAt)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-3 !py-2 text-xs"
                  onClick={onDownload}
                >
                  <Download size={14} aria-hidden="true" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-3 !py-2 text-xs"
                  onClick={onClose}
                  aria-label="Close preview"
                >
                  <X size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-surface/50 p-4 sm:p-6">
              {resume.previewUrl && resume.fileType === "PDF" ? (
                <iframe
                  title={`Preview of ${resume.fileName}`}
                  src={resume.previewUrl}
                  className="h-full min-h-[60vh] w-full rounded-xl border border-border bg-card"
                />
              ) : (
                <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 shadow-soft sm:p-8">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <FileText className="text-primary" size={22} />
                    <div>
                      <p className="font-semibold text-text">
                        Resume Preview
                      </p>
                      <p className="text-xs text-muted">
                        {resume.fileType === "PDF"
                          ? "Generating secure preview…"
                          : "Word documents open via download — browser PDF preview is not available for DOC/DOCX."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4 text-sm text-text">
                    <div>
                      <p className="text-xl font-bold">Kiran Panchakarla</p>
                      <p className="text-primary">
                        SAP UI / Frontend Developer
                      </p>
                      <p className="mt-1 text-muted">
                        Hyderabad, India • kiran.candidate@example.com
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Professional Summary</h3>
                      <p className="mt-1 text-muted">
                        SAP professional with experience in enterprise
                        application development, UI technologies and SAP
                        ecosystem solutions.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold">SAP Expertise</h3>
                      <p className="mt-1 text-muted">
                        SAP Fiori • SAP UI5 • SAP BTP • React • TypeScript •
                        OData
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Experience</h3>
                      <p className="mt-2 font-medium">
                        SAP UI5 / Fiori Developer — ABC Technologies
                      </p>
                      <p className="text-xs text-muted">Jan 2023 — Present</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                        <li>Developed SAP Fiori applications</li>
                        <li>Built reusable UI5 components</li>
                        <li>Integrated OData services</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
