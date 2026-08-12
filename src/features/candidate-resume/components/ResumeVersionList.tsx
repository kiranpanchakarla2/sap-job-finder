"use client";

import {
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { CandidateResume } from "../types/resume.types";
import { formatDisplayDate, formatFileSize } from "../lib/resumeUtils";
import { SectionCard } from "./SectionCard";

export function ResumeVersionList({
  resumes,
  onView,
  onDownload,
  onSetCurrent,
  onDelete,
}: {
  resumes: CandidateResume[];
  onView: (resume: CandidateResume) => void;
  onDownload: (resume: CandidateResume) => void;
  onSetCurrent: (resume: CandidateResume) => void;
  onDelete: (resume: CandidateResume) => void;
}) {
  return (
    <SectionCard
      title="Resume Versions"
      description="Keep track of previous resumes and choose which one to use when applying."
    >
      {resumes.length ? (
        <ul className="space-y-3">
          {resumes.map((resume) => (
            <li
              key={resume.id}
              className="rounded-2xl border border-border bg-surface/40 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text">
                      {resume.fileName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {resume.fileType} • {formatFileSize(resume.fileSize)}
                    </p>
                    <p className="text-xs text-muted">
                      Updated {formatDisplayDate(resume.uploadedAt)}
                    </p>
                    {resume.isCurrent ? (
                      <div className="mt-2">
                        <StatusBadge tone="success">CURRENT</StatusBadge>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs"
                    onClick={() => onView(resume)}
                  >
                    <Eye size={13} aria-hidden="true" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs"
                    onClick={() => onDownload(resume)}
                  >
                    <Download size={13} aria-hidden="true" />
                    Download
                  </Button>
                  {!resume.isCurrent ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="!px-2.5 !py-1.5 text-xs"
                        onClick={() => onSetCurrent(resume)}
                      >
                        <MoreHorizontal size={13} aria-hidden="true" />
                        Set as Current
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="!px-2.5 !py-1.5 text-xs !text-error hover:!bg-error/10"
                        onClick={() => onDelete(resume)}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-surface/30 px-4 py-8 text-center text-sm text-muted">
          No resume versions yet.
        </p>
      )}
    </SectionCard>
  );
}
