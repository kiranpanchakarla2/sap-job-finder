import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { getInterviewTypeShortLabel } from "../lib/format";
import type { InterviewType } from "../types/interview.types";

export function InterviewTypeBadge({ type }: { type: InterviewType }) {
  return <StatusBadge tone="info">{getInterviewTypeShortLabel(type)}</StatusBadge>;
}
