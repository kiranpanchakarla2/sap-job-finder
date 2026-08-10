import type {
  ApplicationSortOption,
  ApplicationStatus,
  ApplicationStatusFilter,
} from "./types/application.types";

export const EMPLOYER_APPLICANT_ROUTES = {
  list: "/employer/applicants",
  details: (id: string) => `/employer/applicants/${id}` as const,
  shortlisted: "/employer/shortlisted",
  talentSearch: "/employer/talent-search",
  manageJobs: "/employer/jobs",
  listWithJob: (jobId: string) =>
    `/employer/applicants?job=${encodeURIComponent(jobId)}` as const,
  listWithJobTitle: (jobTitle: string) =>
    `/employer/applicants?jobTitle=${encodeURIComponent(jobTitle)}` as const,
} as const;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export const APPLICATION_STATUS_FILTERS: ApplicationStatusFilter[] = [
  "all",
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "hired",
  "rejected",
];

export const APPLICATION_STATUS_FILTER_LABELS: Record<
  ApplicationStatusFilter,
  string
> = {
  all: "All",
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export const APPLICATION_SORT_OPTIONS: {
  value: ApplicationSortOption;
  label: string;
}[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_experience", label: "Most Experience" },
  { value: "recently_updated", label: "Recently Updated" },
];

export const APPLICATION_STATUS_OPTIONS: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "hired",
  "rejected",
];

export const EXPERIENCE_FILTER_OPTIONS = [
  { value: "all", label: "All experience" },
  { value: "0-3", label: "0–3 years" },
  { value: "4-6", label: "4–6 years" },
  { value: "7-10", label: "7–10 years" },
  { value: "10+", label: "10+ years" },
] as const;
