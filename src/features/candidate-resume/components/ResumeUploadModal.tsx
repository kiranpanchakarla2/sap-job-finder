"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileUp, Loader2, Upload } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { formatFileSize, validateResumeFile } from "../lib/resumeUtils";

export function ResumeUploadModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelected(null);
    setUploading(false);

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    window.requestAnimationFrame(() => {
      (focusables[0] ?? panel)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !uploading) {
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
  }, [open, onClose, uploading]);

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const validationError = validateResumeFile(file);
    if (validationError) {
      setSelected(null);
      setError(validationError);
      return;
    }
    setError(null);
    setSelected(file);
  };

  const submit = async () => {
    if (!selected) return;
    setUploading(true);
    setError(null);
    const result = await onUpload(selected);
    setUploading(false);
    if (!result.success) {
      setError(result.error ?? "We couldn't upload your resume. Please try again.");
      return;
    }
    onClose();
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
              if (!uploading) onClose();
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
            className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              Upload Resume
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-muted">
              Upload your latest resume to use when applying for SAP jobs.
            </p>

            <div
              role="button"
              tabIndex={0}
              aria-label="Resume drop zone"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                pickFile(event.dataTransfer.files?.[0]);
              }}
              className={`mt-5 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface/40"
              }`}
            >
              <Upload
                className="mx-auto text-primary"
                size={28}
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-text">
                Upload your resume
              </p>
              <p className="mt-1 text-sm text-muted">
                Drag and drop your file here or
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => pickFile(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-4 !px-4 !py-2.5"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <FileUp size={15} aria-hidden="true" />
                Browse Files
              </Button>
              <p className="mt-4 text-xs text-muted">
                PDF, DOC, DOCX
                <br />
                Maximum file size: 5 MB
              </p>
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-sm font-medium text-error">
                {error}
              </p>
            ) : null}

            {selected ? (
              <div className="mt-4 rounded-xl border border-border bg-surface/50 px-4 py-3 text-sm">
                <p className="font-medium text-text">{selected.name}</p>
                <p className="text-muted">{formatFileSize(selected.size)}</p>
              </div>
            ) : null}

            {uploading ? (
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading…</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-primary to-accent" />
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="!px-4 !py-2.5"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="!px-4 !py-2.5"
                disabled={!selected || uploading}
                onClick={() => void submit()}
              >
                {uploading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                {uploading ? "Uploading…" : "Upload Resume"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
