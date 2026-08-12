"use client";

import {
  Download,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { CandidateResume } from "../types/resume.types";
import { formatDisplayDate, formatFileSize } from "../lib/resumeUtils";

export function CurrentResumeCard({
  resume,
  onView,
  onDownload,
  onReplace,
}: {
  resume: CandidateResume;
  onView: () => void;
  onDownload: () => void;
  onReplace: () => void;
}) {
  return (
    <section className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText size={26} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Current Resume
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-text">
              {resume.fileName}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {resume.fileType} • {formatFileSize(resume.fileSize)}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Updated {formatDisplayDate(resume.uploadedAt)}
            </p>
            <div className="mt-3">
              <StatusBadge tone="success">Current Resume ✓</StatusBadge>
            </div>
          </div>
        </div>

        <div className="flex min-h-full flex-col items-stretch justify-between gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="primary"
              className="!h-9 !px-3 !py-0 text-xs"
              onClick={onView}
            >
              <Eye size={14} aria-hidden="true" />
              View Resume
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!h-9 !px-3 !py-0 text-xs"
              onClick={onDownload}
            >
              <Download size={14} aria-hidden="true" />
              Download
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="!h-9 !px-3 !py-0 text-xs sm:self-end"
            onClick={onReplace}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Replace Resume
          </Button>
        </div>
      </div>
    </section>
  );
}
