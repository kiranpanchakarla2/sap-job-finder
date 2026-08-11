import type { EmployerJobStatus } from "@/types/employer";

export type EmployerDashboardStats = {
  activeJobs: number;
  totalApplications: number;
  upcomingInterviews: number;
  hires: number;
  activeJobsDelta: string;
  applicationsDelta: string;
  interviewsDelta: string;
  hiresDelta: string;
};

export type EmployerJobSummary = {
  id: string;
  title: string;
  sapModule: string;
  applications: number;
  status: EmployerJobStatus;
  postedAt: string;
};

export type EmployerJobPerformanceSummary = {
  jobId: string;
  title: string;
  applications: number;
  interviews: number;
  hires: number;
};

export type EmployerApplicantSummary = {
  id: string;
  candidate: string;
  position: string;
  sapModule: string;
  experience: string;
  appliedAt: string;
  status:
    | "New"
    | "Reviewing"
    | "Shortlisted"
    | "Interview"
    | "Hired"
    | "Rejected";
};

export type EmployerInterviewSummary = {
  id: string;
  candidate: string;
  job: string;
  date: string;
  time: string;
  type: "Video" | "Phone" | "Onsite" | "In-person";
};

export type EmployerMessageSummary = {
  id: string;
  candidate: string;
  job: string;
  preview: string;
  unreadCount: number;
  lastMessageAt: string;
};

export type EmployerDashboardData = {
  companyName: string;
  stats: EmployerDashboardStats;
  recentJobs: EmployerJobSummary[];
  jobPerformance: EmployerJobPerformanceSummary[];
  recentApplicants: EmployerApplicantSummary[];
  upcomingInterviews: EmployerInterviewSummary[];
  recentMessages: EmployerMessageSummary[];
};

export type DashboardServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
