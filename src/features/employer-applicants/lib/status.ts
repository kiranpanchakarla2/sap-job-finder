import type { ApplicationStatus } from "../types/application.types";

export function getApplicationStatusTone(
  status: ApplicationStatus,
): "default" | "success" | "warning" | "info" | "danger" | "muted" {
  switch (status) {
    case "new":
      return "info";
    case "reviewing":
      return "warning";
    case "shortlisted":
      return "success";
    case "interview":
      return "default";
    case "hired":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}

export function canMarkReviewing(status: ApplicationStatus): boolean {
  return status === "new";
}

export function canShortlist(status: ApplicationStatus): boolean {
  return status === "new" || status === "reviewing";
}

export function canReject(status: ApplicationStatus): boolean {
  return status !== "rejected" && status !== "hired";
}

export function getAllowedNextStatuses(
  current: ApplicationStatus,
): ApplicationStatus[] {
  const all: ApplicationStatus[] = [
    "new",
    "reviewing",
    "shortlisted",
    "interview",
    "hired",
    "rejected",
  ];
  return all.filter((status) => status !== current);
}

export function timelineLabelForStatus(status: ApplicationStatus): string {
  switch (status) {
    case "new":
      return "Marked as new";
    case "reviewing":
      return "Application reviewed";
    case "shortlisted":
      return "Shortlisted";
    case "interview":
      return "Interview scheduled";
    case "hired":
      return "Hired";
    case "rejected":
      return "Rejected";
    default:
      return "Status updated";
  }
}
