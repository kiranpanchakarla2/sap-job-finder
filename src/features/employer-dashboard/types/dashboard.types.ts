import type { EmployerJobStatus } from "@/types/employer";

export type EmployerDashboardStats = {
  activeJobs: number;
  draftJobs: number;
  totalApplications: number;
  upcomingInterviews: number;
  activeJobsDelta: string;
  draftJobsDelta: string;
  applicationsDelta: string;
  interviewsDelta: string;
};

export type EmployerJobSummary = {
  id: string;
  title: string;
  sapModule: string;
  applications: number;
  status: EmployerJobStatus;
  postedAt: string;
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

export type EmployerDashboardData = {
  companyName: string;
  stats: EmployerDashboardStats;
  recentJobs: EmployerJobSummary[];
  recentApplicants: EmployerApplicantSummary[];
  upcomingInterviews: EmployerInterviewSummary[];
};

export type DashboardServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
