import type { InterviewStatus } from "../types/interview.types";

export function getInterviewStatusTone(
  status: InterviewStatus,
): "default" | "success" | "warning" | "info" | "danger" | "muted" {
  switch (status) {
    case "scheduled":
      return "info";
    case "completed":
      return "success";
    case "cancelled":
      return "muted";
    case "no_show":
      return "danger";
    default:
      return "muted";
  }
}

export function isUpcomingStatus(status: InterviewStatus): boolean {
  return status === "scheduled";
}
