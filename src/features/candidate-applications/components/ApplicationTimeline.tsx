"use client";

import { formatApplicationDate } from "../lib/applicationUtils";
import type { ApplicationTimelineEvent } from "../types/application.types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

export function ApplicationTimeline({ events }: { events: ApplicationTimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted">No timeline events yet.</p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {events.map((event, index) => (
        <li key={`${event.status}-${event.timestamp}-${index}`} className="relative">
          <span
            className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <ApplicationStatusBadge status={event.status} />
            <span className="text-xs text-muted">
              {formatApplicationDate(event.timestamp)}
            </span>
          </div>
          <p className="mt-1 text-sm text-text">{event.label}</p>
        </li>
      ))}
    </ol>
  );
}
