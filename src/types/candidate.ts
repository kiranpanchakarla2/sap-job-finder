/**
 * Candidate domain models for future entities:
 * candidate_profiles, candidate_skills, candidate_education,
 * candidate_experience, candidate_certifications, candidate_resumes,
 * job_applications, saved_jobs, job_alerts, mock_interviews, courses
 */

export type ExperienceBand =
  | "Fresher"
  | "0-2 years"
  | "2-5 years"
  | "5-8 years"
  | "8-12 years"
  | "12+ years";

export type SapModuleOption =
  | "SAP ABAP"
  | "SAP FICO"
  | "SAP MM"
  | "SAP SD"
  | "SAP PP"
  | "SAP HCM"
  | "SAP SuccessFactors"
  | "SAP Basis"
  | "SAP BW"
  | "SAP BTP"
  | "SAP EWM"
  | "SAP TM"
  | "SAP Ariba"
  | "Other";

export type CandidateProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  experience: ExperienceBand;
  sapModule: SapModuleOption;
  profileCompletion: number;
  resumeScore: number;
};

export type CandidateApplicationStatus =
  | "Applied"
  | "Under Review"
  | "Shortlisted"
  | "Interview"
  | "Offer"
  | "Rejected";

export type CandidateApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  sapModule: string;
  appliedAt: string;
  status: CandidateApplicationStatus;
};

export type CandidateInterview = {
  id: string;
  jobTitle: string;
  company: string;
  scheduledAt: string;
  mode: "Virtual" | "Onsite";
  status: "Scheduled" | "Completed" | "Cancelled";
};

export type LearningCourse = {
  id: string;
  title: string;
  module: string;
  progress: number;
  level: "Beginner" | "Intermediate" | "Advanced";
};

export type CandidateRegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  location: string;
  experience: ExperienceBand;
  sapModule: SapModuleOption;
  terms: boolean;
};

export const SAP_MODULE_OPTIONS: { value: SapModuleOption; label: string }[] = [
  { value: "SAP ABAP", label: "SAP ABAP" },
  { value: "SAP FICO", label: "SAP FICO" },
  { value: "SAP MM", label: "SAP MM" },
  { value: "SAP SD", label: "SAP SD" },
  { value: "SAP PP", label: "SAP PP" },
  { value: "SAP HCM", label: "SAP HCM" },
  { value: "SAP SuccessFactors", label: "SAP SuccessFactors" },
  { value: "SAP Basis", label: "SAP Basis" },
  { value: "SAP BW", label: "SAP BW" },
  { value: "SAP BTP", label: "SAP BTP" },
  { value: "SAP EWM", label: "SAP EWM" },
  { value: "SAP TM", label: "SAP TM" },
  { value: "SAP Ariba", label: "SAP Ariba" },
  { value: "Other", label: "Other" },
];

export const EXPERIENCE_OPTIONS: { value: ExperienceBand; label: string }[] = [
  { value: "Fresher", label: "Fresher" },
  { value: "0-2 years", label: "0-2 years" },
  { value: "2-5 years", label: "2-5 years" },
  { value: "5-8 years", label: "5-8 years" },
  { value: "8-12 years", label: "8-12 years" },
  { value: "12+ years", label: "12+ years" },
];
