import type {
  InterviewRecommendation,
  InterviewStatus,
  InterviewTabFilter,
  InterviewType,
} from "./types/interview.types";

export const EMPLOYER_INTERVIEW_ROUTES = {
  list: "/employer/interviews",
  new: "/employer/interviews/new",
  details: (id: string) => `/employer/interviews/${id}` as const,
  edit: (id: string) => `/employer/interviews/${id}/edit` as const,
  feedback: (id: string) => `/employer/interviews/${id}/feedback` as const,
  scheduleWithApplication: (applicationId: string) =>
    `/employer/interviews/new?application=${encodeURIComponent(applicationId)}` as const,
  messagesForCandidate: (candidateId: string) =>
    `/employer/messages?candidate=${encodeURIComponent(candidateId)}` as const,
  messagesForConversation: (conversationId: string) =>
    `/employer/messages?conversation=${encodeURIComponent(conversationId)}` as const,
} as const;

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  video: "Video Interview",
  phone: "Phone Interview",
  in_person: "In-person Interview",
};

export const INTERVIEW_TYPE_SHORT_LABELS: Record<InterviewType, string> = {
  video: "Video",
  phone: "Phone",
  in_person: "In-person",
};

export const INTERVIEW_TAB_FILTERS: InterviewTabFilter[] = [
  "all",
  "upcoming",
  "today",
  "completed",
  "cancelled",
];

export const INTERVIEW_TAB_LABELS: Record<InterviewTabFilter, string> = {
  all: "All",
  upcoming: "Upcoming",
  today: "Today",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const INTERVIEW_RECOMMENDATION_LABELS: Record<
  InterviewRecommendation,
  string
> = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  maybe: "Maybe",
  no_hire: "No Hire",
};

export const INTERVIEW_RECOMMENDATION_OPTIONS: InterviewRecommendation[] = [
  "strong_hire",
  "hire",
  "maybe",
  "no_hire",
];
