/**
 * Job models for future entities: jobs, job_skills, job_applications, saved_jobs
 */

export type RecommendedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  experience: string;
  sapModule: string;
  salary: string;
  postedAt: string;
  workMode?: "Remote" | "Hybrid" | "Onsite";
};

export type CandidateDashboardStats = {
  appliedJobs: number;
  savedJobs: number;
  interviewCalls: number;
  profileViews: number;
};

export type EmployerDashboardStats = {
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
};
