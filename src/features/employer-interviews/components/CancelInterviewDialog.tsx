"use client";

import { JobConfirmationDialog } from "@/features/employer-jobs/components/JobConfirmationDialog";

export function CancelInterviewDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <JobConfirmationDialog
      open={open}
      title="Cancel Interview?"
      description="Are you sure you want to cancel this interview?"
      confirmLabel="Confirm Cancellation"
      cancelLabel="Cancel"
      tone="danger"
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export function CompleteInterviewDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <JobConfirmationDialog
      open={open}
      title="Mark Completed"
      description="Mark this interview as completed?"
      confirmLabel="Mark Completed"
      cancelLabel="Cancel"
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export function NoShowInterviewDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <JobConfirmationDialog
      open={open}
      title="Mark as No-show?"
      description="Mark this candidate as a no-show for the interview?"
      confirmLabel="Mark No-show"
      cancelLabel="Cancel"
      tone="danger"
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
