import type { JobAction, JobStatus } from "../types/job.types";

const ACTIONS_BY_STATUS: Record<JobStatus, JobAction[]> = {
  Draft: ["edit", "preview", "publish", "delete"],
  Active: ["view", "edit", "duplicate", "pause", "close"],
  Paused: ["view", "edit", "duplicate", "resume", "close"],
  Closed: ["view", "duplicate"],
};

export function getAllowedJobActions(status: JobStatus): JobAction[] {
  return ACTIONS_BY_STATUS[status];
}

export function canPerformJobAction(status: JobStatus, action: JobAction): boolean {
  return getAllowedJobActions(status).includes(action);
}

export function jobActionLabel(action: JobAction): string {
  switch (action) {
    case "view":
      return "View Job";
    case "edit":
      return "Edit";
    case "preview":
      return "Preview";
    case "publish":
      return "Publish";
    case "duplicate":
      return "Duplicate";
    case "pause":
      return "Pause";
    case "resume":
      return "Resume";
    case "close":
      return "Close";
    case "delete":
      return "Delete";
    default:
      return action;
  }
}
