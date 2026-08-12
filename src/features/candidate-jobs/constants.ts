import type {
  ExperienceFilterOption,
  PostedDateFilter,
  SalaryFilterOption,
  WorkMode,
  EmploymentType,
} from "@/features/candidate-jobs/types/job.types";

export const EXPERIENCE_FILTER_OPTIONS: ExperienceFilterOption[] = [
  "Entry Level",
  "1–3 Years",
  "3–5 Years",
  "5–8 Years",
  "8–12 Years",
  "12+ Years",
];

export const SAP_MODULE_FILTER_OPTIONS = [
  "SAP ABAP",
  "SAP Fiori",
  "SAP UI5",
  "SAP BTP",
  "SAP S/4HANA",
  "SAP FICO",
  "SAP MM",
  "SAP SD",
  "SAP PP",
  "SAP EWM",
  "SAP SuccessFactors",
  "SAP Ariba",
  "SAP Integration Suite",
  "SAP BW/4HANA",
  "SAP Basis",
  "SAP Security",
] as const;

export const LOCATION_FILTER_OPTIONS = [
  "Hyderabad",
  "Bengaluru",
  "Pune",
  "Mumbai",
  "Chennai",
  "Delhi NCR",
  "Noida",
  "Gurugram",
  "Kolkata",
  "Remote",
  "Other",
] as const;

export const WORK_MODE_OPTIONS: WorkMode[] = ["Remote", "Hybrid", "On-site"];

export const JOB_TYPE_OPTIONS: EmploymentType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

export const SALARY_FILTER_OPTIONS: SalaryFilterOption[] = [
  "Under ₹5 LPA",
  "₹5–10 LPA",
  "₹10–15 LPA",
  "₹15–25 LPA",
  "₹25–40 LPA",
  "₹40+ LPA",
];

export const POSTED_DATE_OPTIONS: { value: PostedDateFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "24h", label: "Past 24 hours" },
  { value: "3d", label: "Past 3 days" },
  { value: "7d", label: "Past 7 days" },
  { value: "14d", label: "Past 14 days" },
  { value: "30d", label: "Past 30 days" },
];

export const PAGE_SIZE = 10;
