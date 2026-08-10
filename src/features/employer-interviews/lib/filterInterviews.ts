import { todayDateString } from "./format";
import { isUpcomingStatus } from "./status";
import type {
  EmployerInterview,
  InterviewSummaryStats,
  InterviewTabFilter,
} from "../types/interview.types";

function interviewDateTimeValue(date: string, time: string): number {
  return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`).getTime();
}

function isUpcomingInterview(
  interview: EmployerInterview,
  now = new Date(),
): boolean {
  if (!isUpcomingStatus(interview.status)) return false;
  const when = interviewDateTimeValue(
    interview.scheduledDate,
    interview.endTime,
  );
  if (Number.isNaN(when)) {
    return interview.scheduledDate >= todayDateString(now);
  }
  return when >= now.getTime();
}

export function computeInterviewStats(
  interviews: EmployerInterview[],
  now = new Date(),
): InterviewSummaryStats {
  const today = todayDateString(now);
  let upcoming = 0;
  let todayCount = 0;
  let completed = 0;
  let cancelled = 0;

  for (const interview of interviews) {
    if (interview.status === "completed" || interview.status === "no_show") {
      completed += 1;
      continue;
    }
    if (interview.status === "cancelled") {
      cancelled += 1;
      continue;
    }
    if (isUpcomingInterview(interview, now)) {
      upcoming += 1;
      if (interview.scheduledDate === today) {
        todayCount += 1;
      }
    }
  }

  return {
    upcoming,
    today: todayCount,
    completed,
    cancelled,
  };
}

export function filterInterviewsByTab(
  interviews: EmployerInterview[],
  tab: InterviewTabFilter,
  now = new Date(),
): EmployerInterview[] {
  const today = todayDateString(now);

  const sorted = [...interviews].sort((a, b) => {
    const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
    if (dateCmp !== 0) return dateCmp;
    return a.startTime.localeCompare(b.startTime);
  });

  switch (tab) {
    case "upcoming":
      return sorted.filter((interview) => isUpcomingInterview(interview, now));
    case "today":
      return sorted.filter(
        (interview) =>
          interview.status === "scheduled" && interview.scheduledDate === today,
      );
    case "completed":
      return sorted.filter(
        (interview) =>
          interview.status === "completed" || interview.status === "no_show",
      );
    case "cancelled":
      return sorted.filter((interview) => interview.status === "cancelled");
    case "all":
    default:
      return sorted;
  }
}

export function getUpcomingInterviews(
  interviews: EmployerInterview[],
  limit = 3,
  now = new Date(),
): EmployerInterview[] {
  return filterInterviewsByTab(interviews, "upcoming", now).slice(0, limit);
}

export function getInterviewForApplication(
  interviews: EmployerInterview[],
  applicationId: string,
  now = new Date(),
): EmployerInterview | null {
  const upcoming = interviews
    .filter(
      (interview) =>
        interview.applicationId === applicationId &&
        isUpcomingInterview(interview, now),
    )
    .sort((a, b) => {
      const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });

  if (upcoming[0]) return upcoming[0];

  const any = interviews
    .filter((interview) => interview.applicationId === applicationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return any[0] ?? null;
}
