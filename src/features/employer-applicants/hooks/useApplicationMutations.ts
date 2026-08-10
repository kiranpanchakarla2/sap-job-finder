"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EMPLOYER_APPLICANT_ROUTES } from "../constants";
import { getStatusLabel } from "../lib/format";
import { applicationService } from "../services/applicationService";
import type {
  ApplicationAction,
  ApplicationStatus,
  EmployerApplication,
} from "../types/application.types";

type ConfirmKind = "reject" | null;

type StatusDialogState = {
  open: boolean;
  application: EmployerApplication | null;
};

function successMessageForStatus(status: ApplicationStatus): string {
  switch (status) {
    case "reviewing":
      return "Application moved to Reviewing.";
    case "shortlisted":
      return "Candidate shortlisted.";
    case "interview":
      return "Application moved to Interview.";
    case "hired":
      return "Candidate marked as Hired.";
    case "rejected":
      return "Candidate rejected.";
    default:
      return `Status updated to ${getStatusLabel(status)}.`;
  }
}

export function useApplicationMutations(onChanged?: () => void) {
  const router = useRouter();
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [confirmTarget, setConfirmTarget] = useState<EmployerApplication | null>(
    null,
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    application: null,
  });
  const [statusLoading, setStatusLoading] = useState(false);

  const closeConfirm = useCallback(() => {
    if (confirmLoading) return;
    setConfirmKind(null);
    setConfirmTarget(null);
    setRejectReason("");
  }, [confirmLoading]);

  const closeStatusDialog = useCallback(() => {
    if (statusLoading) return;
    setStatusDialog({ open: false, application: null });
  }, [statusLoading]);

  const applyStatus = useCallback(
    async (
      application: EmployerApplication,
      status: ApplicationStatus,
      notes?: string | null,
      successMessage?: string,
    ) => {
      const result = await applicationService.updateStatus(
        application.id,
        status,
        notes,
      );
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      toast.success(successMessage ?? successMessageForStatus(status));
      onChanged?.();
      return true;
    },
    [onChanged],
  );

  const handleAction = useCallback(
    (action: ApplicationAction, application: EmployerApplication) => {
      switch (action) {
        case "view":
          router.push(EMPLOYER_APPLICANT_ROUTES.details(application.id));
          break;
        case "review":
          void applyStatus(
            application,
            "reviewing",
            undefined,
            "Application moved to Reviewing.",
          );
          break;
        case "shortlist":
          void applyStatus(
            application,
            "shortlisted",
            undefined,
            "Candidate shortlisted.",
          );
          break;
        case "reject":
          setConfirmTarget(application);
          setConfirmKind("reject");
          setRejectReason("");
          break;
        case "change_status":
          setStatusDialog({ open: true, application });
          break;
        default:
          break;
      }
    },
    [applyStatus, router],
  );

  const confirmReject = useCallback(async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const ok = await applyStatus(
      confirmTarget,
      "rejected",
      rejectReason.trim() || null,
      "Candidate rejected.",
    );
    setConfirmLoading(false);
    if (ok) closeConfirm();
  }, [applyStatus, closeConfirm, confirmTarget, rejectReason]);

  const updateStatusFromDialog = useCallback(
    async (status: ApplicationStatus, notes?: string) => {
      if (!statusDialog.application) return;
      setStatusLoading(true);
      const ok = await applyStatus(
        statusDialog.application,
        status,
        notes?.trim() || null,
      );
      setStatusLoading(false);
      if (ok) closeStatusDialog();
    },
    [applyStatus, closeStatusDialog, statusDialog.application],
  );

  return {
    confirmOpen: confirmKind === "reject",
    confirmTarget,
    confirmLoading,
    rejectReason,
    setRejectReason,
    closeConfirm,
    confirmReject,
    statusDialog,
    statusLoading,
    closeStatusDialog,
    openStatusDialog: (application: EmployerApplication) =>
      setStatusDialog({ open: true, application }),
    updateStatusFromDialog,
    handleAction,
    applyStatus,
  };
}
