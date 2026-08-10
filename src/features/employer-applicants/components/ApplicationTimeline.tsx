import { formatApplicationDate } from "../lib/format";
import type { ApplicationTimelineEvent } from "../types/application.types";

export function ApplicationTimeline({
  events,
}: {
  events: ApplicationTimelineEvent[];
}) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted">No timeline events yet.</p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border pl-5">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className={isLast ? "pb-0" : "pb-5"}>
            <span
              className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                event.completed ? "bg-primary" : "bg-muted"
              }`}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-text">{event.label}</p>
            <p className="mt-0.5 text-xs text-muted">
              {event.date
                ? formatApplicationDate(event.date, "long")
                : "Pending"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
