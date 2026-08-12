"use client";

import { APPLICATION_STATUS_CONFIG } from "../constants";
import type { ApplicationStatus } from "../types/application.types";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config = APPLICATION_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.badgeClass}`}
      title={config.description}
    >
      {config.label}
    </span>
  );
}
