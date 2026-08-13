/**
 * SAP Jobs Finder mock dashboard data.
 * Auth uses Supabase — these fixtures are UI placeholders only.
 */

import type {
  CandidateApplication,
  CandidateInterview,
  LearningCourse,
} from "@/types/candidate";
import type {
  CandidateDashboardStats,
  RecommendedJob,
} from "@/types/job";

export const candidateDashboardStats: CandidateDashboardStats = {
  appliedJobs: 12,
  savedJobs: 8,
  interviewCalls: 3,
  profileViews: 146,
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

