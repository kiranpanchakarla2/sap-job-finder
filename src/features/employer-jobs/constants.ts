import type {
  BenefitOption,
  Currency,
  EmploymentType,
  ExperienceLevel,
  JobSortOption,
  JobStatusFilter,
  JobType,
  ProjectType,
  SalaryType,
  WorkArrangement,
} from "./types/job.types";

export const EMPLOYER_JOB_ROUTES = {
  list: "/employer/jobs",
  create: "/employer/jobs/new",
  createPreview: "/employer/jobs/new/preview",
  bulkUpload: "/employer/jobs/bulk-upload",
  bulkUploadHistory: "/employer/jobs/bulk-upload/history",
  bulkUploadDetails: (id: string) => `/employer/jobs/bulk-upload/history/${id}`,
  details: (id: string) => `/employer/jobs/${id}`,
  edit: (id: string) => `/employer/jobs/${id}/edit`,
  preview: (id: string) => `/employer/jobs/${id}/preview`,
} as const;

export const BULK_UPLOAD_CONFIG = {
  templateVersion: "1.0",
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxFileSizeLabel: "10 MB",
  maxRows: 1000,
  allowedExtensions: [".xlsx"] as const,
  allowedMimeTypes: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ] as const,
  fieldLimits: {
    title: 200,
    description: 10000,
    location: 200,
    education: 200,
    noticePeriod: 100,
    contactEmail: 255,
    maxSkillsTotalLength: 1000,
    maxExperience: 50,
    maxSalary: 1_000_000_000,
    maxOpenings: 10_000,
  },
} as const;

export const BULK_UPLOAD_MAX_FILE_SIZE_BYTES = BULK_UPLOAD_CONFIG.maxFileSizeBytes;
export const BULK_UPLOAD_MAX_FILE_SIZE_LABEL = BULK_UPLOAD_CONFIG.maxFileSizeLabel;
export const BULK_UPLOAD_MAX_ROWS = BULK_UPLOAD_CONFIG.maxRows;
export const ALLOWED_EXCEL_EXTENSIONS = BULK_UPLOAD_CONFIG.allowedExtensions;
export const ALLOWED_EXCEL_MIME_TYPES = BULK_UPLOAD_CONFIG.allowedMimeTypes;


export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
];

export const JOB_TYPE_OPTIONS: { value: JobType; label: string }[] = [
  { value: "Permanent", label: "Permanent" },
  { value: "Contract", label: "Contract" },
  { value: "Contract-to-Hire", label: "Contract-to-Hire" },
  { value: "Freelance", label: "Freelance" },
];

export const EXPERIENCE_LEVEL_OPTIONS: {
  value: ExperienceLevel;
  label: string;
}[] = [
  { value: "Entry Level", label: "Entry Level" },
  { value: "Mid Level", label: "Mid Level" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead" },
  { value: "Architect", label: "Architect" },
];

export const WORK_ARRANGEMENT_OPTIONS: {
  value: WorkArrangement;
  label: string;
}[] = [
  { value: "On-site", label: "On-site" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "Remote", label: "Remote" },
];

export const SAP_MODULE_OPTIONS: { value: string; label: string }[] = [
  { value: "SAP S/4HANA", label: "SAP S/4HANA" },
  { value: "SAP FICO", label: "SAP FICO" },
  { value: "SAP MM", label: "SAP MM" },
  { value: "SAP SD", label: "SAP SD" },
  { value: "SAP PP", label: "SAP PP" },
  { value: "SAP WM", label: "SAP WM" },
  { value: "SAP EWM", label: "SAP EWM" },
  { value: "SAP QM", label: "SAP QM" },
  { value: "SAP PM", label: "SAP PM" },
  { value: "SAP HCM", label: "SAP HCM" },
  { value: "SAP SuccessFactors", label: "SAP SuccessFactors" },
  { value: "SAP Ariba", label: "SAP Ariba" },
  { value: "SAP IBP", label: "SAP IBP" },
  { value: "SAP BW/4HANA", label: "SAP BW/4HANA" },
  { value: "SAP BTP", label: "SAP BTP" },
  { value: "SAP Basis", label: "SAP Basis" },
  { value: "SAP Security", label: "SAP Security" },
  { value: "SAP ABAP", label: "SAP ABAP" },
  { value: "SAP CPI", label: "SAP CPI" },
  { value: "SAP Analytics Cloud", label: "SAP Analytics Cloud" },
];

export const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "Implementation", label: "Implementation" },
  { value: "Support", label: "Support" },
  { value: "Rollout", label: "Rollout" },
  { value: "Migration", label: "Migration" },
  { value: "Upgrade", label: "Upgrade" },
  { value: "Managed Services", label: "Managed Services" },
];

export const SALARY_TYPE_OPTIONS: { value: SalaryType; label: string }[] = [
  { value: "Range", label: "Range" },
  { value: "Fixed", label: "Fixed" },
  { value: "Negotiable", label: "Negotiable" },
  { value: "Not specified", label: "Not specified" },
];

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "INR", label: "INR" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "SGD", label: "SGD" },
];

export const BENEFIT_OPTIONS: BenefitOption[] = [
  "Health Insurance",
  "Retirement",
  "Paid Time Off",
  "Remote Work",
  "Training",
  "Certification Support",
  "Other",
];

export const JOB_STATUS_FILTERS: JobStatusFilter[] = [
  "All",
  "Active",
  "Draft",
  "Paused",
  "Closed",
];

export const JOB_SORT_OPTIONS: { value: JobSortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_applications", label: "Most Applications" },
  { value: "deadline", label: "Deadline" },
];

export const COUNTRY_OPTIONS = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "Singapore", label: "Singapore" },
  { value: "Australia", label: "Australia" },
  { value: "Canada", label: "Canada" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Other", label: "Other" },
] as const;
