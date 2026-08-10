import { formatSubmittedAt } from "../lib/format";
import type { EmployerInterview } from "../types/interview.types";
import { InterviewStatusBadge } from "./InterviewStatusBadge";

export function InterviewTimeline({ interview }: { interview: EmployerInterview }) {
  const events = [
    {
      id: "created",
      label: "Interview created",
      date: interview.createdAt,
      done: true,
    },
    {
      id: "status",
      label: `Status: ${interview.status.replace("_", "-")}`,
      date: interview.updatedAt,
      done: true,
    },
    {
      id: "feedback",
      label: interview.feedback
        ? "Feedback submitted"
        : "No interview feedback yet.",
      date: interview.feedback?.submittedAt ?? null,
      done: Boolean(interview.feedback),
    },
  ];

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text">Interview Timeline</h2>
        <InterviewStatusBadge status={interview.status} />
      </div>
      <ol className="mt-4 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                event.done ? "bg-primary" : "bg-border"
              }`}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-text">{event.label}</p>
              {event.date ? (
                <p className="mt-0.5 text-xs text-muted">
                  {formatSubmittedAt(event.date)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
