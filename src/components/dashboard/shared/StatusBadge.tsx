import type { ReactNode } from "react";

type StatusTone = "default" | "success" | "warning" | "info" | "danger" | "muted";

const toneClasses: Record<StatusTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-sky-500/10 text-sky-600",
  danger: "bg-error/10 text-error",
  muted: "bg-surface text-muted",
};

export function StatusBadge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

export function jobStatusTone(
  status: "Active" | "Draft" | "Paused" | "Closed" | string,
): StatusTone {
  switch (status) {
    case "Active":
      return "success";
    case "Draft":
      return "muted";
    case "Paused":
      return "warning";
    case "Closed":
      return "danger";
    default:
      return "default";
  }
}

export function applicantStatusTone(
  status:
    | "New"
    | "Reviewing"
    | "Shortlisted"
    | "Under Review"
    | "Interview"
    | "Hired"
    | "Rejected"
    | "new"
    | "reviewing"
    | "shortlisted"
    | "interview"
    | "hired"
    | "rejected"
    | string,
): StatusTone {
  switch (status) {
    case "New":
    case "new":
      return "info";
    case "Reviewing":
    case "Under Review":
    case "reviewing":
      return "warning";
    case "Shortlisted":
    case "shortlisted":
      return "success";
    case "Interview":
    case "interview":
      return "default";
    case "Hired":
    case "hired":
      return "success";
    case "Rejected":
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}
