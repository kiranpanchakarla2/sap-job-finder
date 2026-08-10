import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import type { InterviewTabFilter } from "../types/interview.types";

export function InterviewEmptyState({
  tab,
}: {
  tab: InterviewTabFilter;
}) {
  const title =
    tab === "upcoming" || tab === "today"
      ? "No upcoming interviews."
      : tab === "completed"
        ? "No completed interviews."
        : tab === "cancelled"
          ? "No cancelled interviews."
          : "No interviews scheduled yet.";

  const description =
    tab === "all" || tab === "upcoming"
      ? "Schedule an interview with a shortlisted candidate to get started."
      : "Try another tab or schedule a new interview.";

  return (
    <EmptyState
      icon={CalendarDays}
      title={title}
      description={description}
      action={
        <Button href={EMPLOYER_INTERVIEW_ROUTES.new}>Schedule Interview</Button>
      }
    />
  );
}
