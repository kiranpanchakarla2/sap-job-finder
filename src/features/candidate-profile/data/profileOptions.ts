import type {
  CareerLevel,
  EmploymentStatus,
  EmploymentType,
  GenderOption,
  WorkMode,
} from "../types/profile.types";

export const SAP_MODULE_CHIP_OPTIONS = [
  "SAP ABAP",
  "SAP Fiori",
  "SAP UI5",
  "SAP BTP",
  "SAP MM",
  "SAP SD",
  "SAP FICO",
  "SAP SuccessFactors",
  "SAP Integration Suite",
  "SAP HCM",
  "SAP Basis",
  "SAP BW",
] as const;

export const TECHNICAL_SKILL_SUGGESTIONS = [
  "React",
  "Angular",
  "TypeScript",
  "JavaScript",
  "SAP UI5",
  "Fiori",
  "OData",
  "REST APIs",
  "HTML",
  "CSS",
  "Git",
  "Node.js",
  "Java",
  "Python",
] as const;

export const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

export const EMPLOYMENT_STATUS_OPTIONS: {
  value: EmploymentStatus;
  label: string;
}[] = [
  { value: "Currently Employed", label: "Currently Employed" },
  { value: "Notice Period", label: "Notice Period" },
  { value: "Immediately Available", label: "Immediately Available" },
  { value: "Freelancer", label: "Freelancer" },
];

export const EXPERIENCE_SELECT_OPTIONS = [
  { value: "Fresher", label: "Fresher" },
  { value: "1 year", label: "1 year" },
  { value: "2 years", label: "2 years" },
  { value: "3 years", label: "3 years" },
  { value: "4 years", label: "4 years" },
  { value: "5 years", label: "5 years" },
  { value: "6–8 years", label: "6–8 years" },
  { value: "8–12 years", label: "8–12 years" },
  { value: "12+ years", label: "12+ years" },
];

export const NOTICE_PERIOD_OPTIONS = [
  { value: "Immediate", label: "Immediate" },
  { value: "15 Days", label: "15 Days" },
  { value: "30 Days", label: "30 Days" },
  { value: "45 Days", label: "45 Days" },
  { value: "60 Days", label: "60 Days" },
  { value: "90 Days", label: "90 Days" },
];

export const WORK_MODE_OPTIONS: WorkMode[] = ["Remote", "Hybrid", "On-site"];

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentType[] = [
  "Full-time",
  "Contract",
  "Part-time",
];

export const CAREER_LEVEL_OPTIONS: { value: CareerLevel; label: string }[] = [
  { value: "Entry Level", label: "Entry Level" },
  { value: "Mid Level", label: "Mid Level" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead" },
  { value: "Manager", label: "Manager" },
];

export const JOB_ROLE_SUGGESTIONS = [
  "SAP UI5 Developer",
  "SAP Fiori Consultant",
  "SAP ABAP Developer",
  "SAP BTP Developer",
  "SAP Functional Consultant",
  "Frontend Developer",
  "Full Stack Developer",
] as const;

export const LOCATION_SUGGESTIONS = [
  "Hyderabad",
  "Bangalore",
  "Pune",
  "Mumbai",
  "Chennai",
  "Delhi NCR",
  "Remote",
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "Immediately available", label: "Immediately available" },
  { value: "Available in 15 days", label: "Available in 15 days" },
  { value: "Available in 30 days", label: "Available in 30 days" },
  { value: "Available in 60 days", label: "Available in 60 days" },
  { value: "Not actively looking", label: "Not actively looking" },
];

export const SUMMARY_MAX_CHARS = 500;
