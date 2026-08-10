"use client";

import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { applicationService } from "../services/applicationService";

export function ResumeSection({
  applicationId,
  resumeName,
  resumePath,
}: {
  applicationId: string;
  resumeName: string | null;
  resumePath: string | null;
}) {
  const [loadingAction, setLoadingAction] = useState<"preview" | "download" | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!resumePath || !resumeName) {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-semibold text-text">Resume</h2>
        <p className="mt-3 text-sm text-muted">No resume available.</p>
      </section>
    );
  }

  const getSignedUrl = async () => {
    const result = await applicationService.getResumeSignedUrl(applicationId);
    if (!result.success) {
      toast.error(result.error);
      return null;
    }
    return result.data;
  };

  const handlePreview = async () => {
    setLoadingAction("preview");
    const data = await getSignedUrl();
    setLoadingAction(null);
    if (!data) return;

    const isPdf = data.fileName.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.message("Resume preview unavailable.", {
        description: "Download the file to view it.",
      });
      return;
    }

    setPreviewUrl(data.url);
  };

  const handleDownload = async () => {
    setLoadingAction("download");
    const data = await getSignedUrl();
    setLoadingAction(null);
    if (!data) {
      toast.error("Unable to download resume.");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = data.url;
    anchor.download = data.fileName;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="text-base font-semibold text-text">Resume</h2>
      <div className="mt-4 flex items-start gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{resumeName}</p>
          <p className="mt-0.5 text-xs text-muted">Secure private document</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="!px-3 !py-2 text-xs"
              disabled={loadingAction !== null}
              onClick={() => void handlePreview()}
            >
              <Eye size={14} aria-hidden="true" />
              {loadingAction === "preview" ? "Loading…" : "Preview"}
            </Button>
            <Button
              variant="secondary"
              className="!px-3 !py-2 text-xs"
              disabled={loadingAction !== null}
              onClick={() => void handleDownload()}
            >
              <Download size={14} aria-hidden="true" />
              {loadingAction === "download" ? "Loading…" : "Download"}
            </Button>
          </div>
        </div>
      </div>

      {previewUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <iframe
            title={`${resumeName} preview`}
            src={previewUrl}
            className="h-80 w-full bg-surface"
          />
        </div>
      ) : null}
    </section>
  );
}
