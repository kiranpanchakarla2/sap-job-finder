import type { JobStatus } from "../types/job.types";

const ALLOWED: Record<JobStatus, JobStatus[]> = {
  Draft: ["Active"],
  Active: ["Paused", "Closed"],
  Paused: ["Active", "Closed"],
  Closed: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: JobStatus, to: JobStatus): string | null {
  if (from === to) return null;
  if (canTransition(from, to)) return null;
  if (from === "Closed") return "Closed jobs cannot be reopened.";
  return `Cannot change job status from ${from} to ${to}.`;
}
