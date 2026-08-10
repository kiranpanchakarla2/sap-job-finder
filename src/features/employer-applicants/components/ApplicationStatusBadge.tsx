import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { getStatusLabel } from "../lib/format";
import { getApplicationStatusTone } from "../lib/status";
import type { ApplicationStatus } from "../types/application.types";

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <StatusBadge tone={getApplicationStatusTone(status)}>
      {getStatusLabel(status)}
    </StatusBadge>
  );
}
