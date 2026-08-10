"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { canPerformJobAction } from "../lib/actions";
import { jobService } from "../services/jobService";
import type { EmployerJobRecord, JobAction } from "../types/job.types";

type ConfirmKind = "pause" | "close" | "delete" | null;

export function useJobMutations(onChanged?: () => void) {
  const router = useRouter();
  const pathname = usePathname();
  const [confirm, setConfirm] = useState<{
    kind: ConfirmKind;
    job: EmployerJobRecord | null;
  }>({ kind: null, job: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const closeConfirm = useCallback(() => {
    if (confirmLoading) return;
    setConfirm({ kind: null, job: null });
  }, [confirmLoading]);

  const handleAction = useCallback(
    async (action: JobAction, job: EmployerJobRecord) => {
      if (!canPerformJobAction(job.status, action)) {
        toast.error("This action is not available for the current job status.");
        return;
      }

      switch (action) {
        case "view":
          router.push(EMPLOYER_JOB_ROUTES.details(job.id));
          return;
        case "edit":
          router.push(EMPLOYER_JOB_ROUTES.edit(job.id));
          return;
        case "preview":
          router.push(EMPLOYER_JOB_ROUTES.preview(job.id));
          return;
        case "publish": {
          const result = await jobService.publishJob(job.id);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Job published successfully.");
          onChanged?.();
          router.push(EMPLOYER_JOB_ROUTES.details(result.data.id));
          return;
        }
        case "duplicate": {
          const result = await jobService.duplicateJob(job.id);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Job duplicated.");
          onChanged?.();
          router.push(EMPLOYER_JOB_ROUTES.edit(result.data.id));
          return;
        }
        case "resume": {
          const result = await jobService.resumeJob(job.id);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Job resumed.");
          onChanged?.();
          return;
        }
        case "pause":
          setConfirm({ kind: "pause", job });
          return;
        case "close":
          setConfirm({ kind: "close", job });
          return;
        case "delete":
          if (job.status !== "Draft") return;
          setConfirm({ kind: "delete", job });
          return;
        default:
          return;
      }
    },
    [onChanged, router],
  );

  const confirmAction = useCallback(async () => {
    if (!confirm.kind || !confirm.job) return;
    setConfirmLoading(true);
    try {
      if (confirm.kind === "pause") {
        const result = await jobService.pauseJob(confirm.job.id);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Job paused.");
      } else if (confirm.kind === "close") {
        const result = await jobService.closeJob(confirm.job.id);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Job closed.");
      } else if (confirm.kind === "delete") {
        if (confirm.job.status !== "Draft") return;
        const result = await jobService.deleteDraftJob(confirm.job.id);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Draft deleted.");
        if (pathname.includes(`/jobs/${confirm.job.id}`)) {
          router.push(EMPLOYER_JOB_ROUTES.list);
        }
      }
      setConfirm({ kind: null, job: null });
      onChanged?.();
    } finally {
      setConfirmLoading(false);
    }
  }, [confirm, onChanged, pathname, router]);

  const confirmCopy =
    confirm.kind === "pause"
      ? {
          title: "Pause this job?",
          description:
            "Candidates will no longer see this posting as open. You can resume it later.",
          confirmLabel: "Pause Job",
          tone: "default" as const,
        }
      : confirm.kind === "close"
        ? {
            title: "Close this job?",
            description:
              "Closed jobs cannot accept new applications. You can still duplicate the posting later.",
            confirmLabel: "Close Job",
            tone: "danger" as const,
          }
        : confirm.kind === "delete"
          ? {
              title: "Delete this draft?",
              description:
                "This draft will be removed from your workspace. This action cannot be undone.",
              confirmLabel: "Delete Draft",
              tone: "danger" as const,
            }
          : null;

  return {
    confirmOpen: confirm.kind !== null,
    confirmCopy,
    confirmLoading,
    closeConfirm,
    confirmAction,
    handleAction,
  };
}
