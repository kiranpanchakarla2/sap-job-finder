import {
  StatusBadge,
  jobStatusTone,
} from "@/components/dashboard/shared/StatusBadge";
import type { JobStatus } from "../types/job.types";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <StatusBadge tone={jobStatusTone(status)}>{status}</StatusBadge>;
}
