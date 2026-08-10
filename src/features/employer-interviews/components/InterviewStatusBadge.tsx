import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { getInterviewStatusLabel } from "../lib/format";
import { getInterviewStatusTone } from "../lib/status";
import type { InterviewStatus } from "../types/interview.types";

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  return (
    <StatusBadge tone={getInterviewStatusTone(status)}>
      {getInterviewStatusLabel(status)}
    </StatusBadge>
  );
}
