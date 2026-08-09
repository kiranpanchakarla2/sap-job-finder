/**
 * SAP Jobs Finder mock data for dashboards and demo authentication.
 * Replace with REST API responses later.
 */

import type { AuthUser } from "@/types/auth";
import type {
  CandidateApplication,
  CandidateInterview,
  LearningCourse,
} from "@/types/candidate";
import type { EmployerApplicant, EmployerJob } from "@/types/employer";
import type {
  CandidateDashboardStats,
  EmployerDashboardStats,
  RecommendedJob,
} from "@/types/job";

/** Demo credentials (password checked in authService) */
export const DEMO_CREDENTIALS = {
  candidate: {
    email: "candidate@sapjobsfinder.com",
    password: "Candidate@123",
  },
  employer: {
    email: "employer@sapjobsfinder.com",
    password: "Employer@123",
  },
};

export const mockCandidateUser: AuthUser = {
  id: "user_candidate_demo",
  name: "Priya Sharma",
  email: DEMO_CREDENTIALS.candidate.email,
  role: "candidate",
  avatarInitials: "PS",
  phone: "+91 98765 43210",
};

export const mockEmployerUser: AuthUser = {
  id: "user_employer_demo",
  name: "Rahul Mehta",
  email: DEMO_CREDENTIALS.employer.email,
  role: "employer",
  avatarInitials: "RM",
  companyName: "Nexus SAP Solutions",
  phone: "+91 99887 66554",
};

export const candidateDashboardStats: CandidateDashboardStats = {
  appliedJobs: 12,
  savedJobs: 8,
  interviewCalls: 3,
  profileViews: 146,
};

export const employerDashboardStats: EmployerDashboardStats = {
  activeJobs: 6,
  totalApplications: 84,
  shortlisted: 18,
  interviews: 7,
  hired: 2,
};

export const recommendedJobs: RecommendedJob[] = [
  {
    id: "job_rec_1",
    title: "SAP FICO Consultant",
    company: "Infosys",
    location: "Bengaluru, India",
    experience: "5-8 years",
    sapModule: "SAP FICO",
    salary: "₹18–28 LPA",
    postedAt: "2 days ago",
    workMode: "Hybrid",
  },
  {
    id: "job_rec_2",
    title: "SAP ABAP Developer",
    company: "TCS",
    location: "Hyderabad, India",
    experience: "3-6 years",
    sapModule: "SAP ABAP",
    salary: "₹14–22 LPA",
    postedAt: "1 day ago",
    workMode: "Remote",
  },
  {
    id: "job_rec_3",
    title: "SAP MM Functional Lead",
    company: "Accenture",
    location: "Pune, India",
    experience: "8-12 years",
    sapModule: "SAP MM",
    salary: "₹24–36 LPA",
    postedAt: "4 days ago",
    workMode: "Onsite",
  },
  {
    id: "job_rec_4",
    title: "SAP BTP Integration Specialist",
    company: "Capgemini",
    location: "Remote",
    experience: "4-7 years",
    sapModule: "SAP BTP",
    salary: "₹20–30 LPA",
    postedAt: "3 days ago",
    workMode: "Remote",
  },
];

export const candidateApplications: CandidateApplication[] = [
  {
    id: "app_1",
    jobId: "job_rec_1",
    jobTitle: "SAP FICO Consultant",
    company: "Infosys",
    location: "Bengaluru",
    sapModule: "SAP FICO",
    appliedAt: "2026-08-01",
    status: "Interview",
  },
  {
    id: "app_2",
    jobId: "job_rec_2",
    jobTitle: "SAP ABAP Developer",
    company: "TCS",
    location: "Hyderabad",
    sapModule: "SAP ABAP",
    appliedAt: "2026-07-28",
    status: "Under Review",
  },
  {
    id: "app_3",
    jobId: "job_rec_3",
    jobTitle: "SAP MM Functional Lead",
    company: "Accenture",
    location: "Pune",
    sapModule: "SAP MM",
    appliedAt: "2026-07-20",
    status: "Shortlisted",
  },
];

export const savedJobs = [
  recommendedJobs[0],
  recommendedJobs[2],
  recommendedJobs[3],
];

export const upcomingInterviews: CandidateInterview[] = [
  {
    id: "int_1",
    jobTitle: "SAP FICO Consultant",
    company: "Infosys",
    scheduledAt: "Aug 12, 2026 · 11:00 AM IST",
    mode: "Virtual",
    status: "Scheduled",
  },
  {
    id: "int_2",
    jobTitle: "SAP MM Functional Lead",
    company: "Accenture",
    scheduledAt: "Aug 15, 2026 · 3:30 PM IST",
    mode: "Onsite",
    status: "Scheduled",
  },
];

export const learningCourses: LearningCourse[] = [
  {
    id: "course_1",
    title: "S/4HANA Finance Fundamentals",
    module: "SAP FICO",
    progress: 72,
    level: "Intermediate",
  },
  {
    id: "course_2",
    title: "ABAP RESTful Application Programming",
    module: "SAP ABAP",
    progress: 45,
    level: "Advanced",
  },
  {
    id: "course_3",
    title: "SAP BTP Integration Suite Essentials",
    module: "SAP BTP",
    progress: 20,
    level: "Beginner",
  },
];

export const employerJobs: EmployerJob[] = [
  {
    id: "ejob_1",
    title: "SAP FICO Senior Consultant",
    applications: 24,
    views: 312,
    status: "Active",
    postedAt: "Aug 2, 2026",
    location: "Bengaluru",
    sapModule: "SAP FICO",
  },
  {
    id: "ejob_2",
    title: "SAP SD Functional Consultant",
    applications: 18,
    views: 245,
    status: "Active",
    postedAt: "Jul 28, 2026",
    location: "Hyderabad",
    sapModule: "SAP SD",
  },
  {
    id: "ejob_3",
    title: "SAP Basis Administrator",
    applications: 11,
    views: 189,
    status: "Paused",
    postedAt: "Jul 15, 2026",
    location: "Remote",
    sapModule: "SAP Basis",
  },
  {
    id: "ejob_4",
    title: "SAP SuccessFactors Analyst",
    applications: 31,
    views: 401,
    status: "Active",
    postedAt: "Aug 5, 2026",
    location: "Pune",
    sapModule: "SAP SuccessFactors",
  },
];

export const employerApplicants: EmployerApplicant[] = [
  {
    id: "eapp_1",
    name: "Ananya Iyer",
    sapModule: "SAP FICO",
    experience: "6 years",
    location: "Bengaluru",
    appliedAt: "Aug 7, 2026",
    status: "New",
    jobTitle: "SAP FICO Senior Consultant",
  },
  {
    id: "eapp_2",
    name: "Vikram Singh",
    sapModule: "SAP SD",
    experience: "8 years",
    location: "Hyderabad",
    appliedAt: "Aug 6, 2026",
    status: "Shortlisted",
    jobTitle: "SAP SD Functional Consultant",
  },
  {
    id: "eapp_3",
    name: "Sneha Reddy",
    sapModule: "SAP SuccessFactors",
    experience: "5 years",
    location: "Pune",
    appliedAt: "Aug 5, 2026",
    status: "Interview",
    jobTitle: "SAP SuccessFactors Analyst",
  },
  {
    id: "eapp_4",
    name: "Arjun Mehta",
    sapModule: "SAP FICO",
    experience: "4 years",
    location: "Chennai",
    appliedAt: "Aug 4, 2026",
    status: "Under Review",
    jobTitle: "SAP FICO Senior Consultant",
  },
];

export const hiringOverview = [
  { label: "Mon", applications: 8 },
  { label: "Tue", applications: 12 },
  { label: "Wed", applications: 9 },
  { label: "Thu", applications: 15 },
  { label: "Fri", applications: 11 },
  { label: "Sat", applications: 4 },
  { label: "Sun", applications: 3 },
];
