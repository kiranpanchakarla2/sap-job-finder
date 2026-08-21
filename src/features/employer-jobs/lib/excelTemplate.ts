import {
  BULK_JOB_TEMPLATE_URL,
  BULK_UPLOAD_CONFIG,
} from "../constants";

export { BULK_JOB_TEMPLATE_URL };
export const BULK_JOB_TEMPLATE_VERSION = BULK_UPLOAD_CONFIG.templateVersion;
export const BULK_JOB_TEMPLATE_FILENAME = "SAP_Jobs_Finder_Bulk_Job_Template.xlsx";

export type BulkJobColumnDefinition = {
  header: string;
  key: string;
  width: number;
  description: string;
  example: string | number;
  required: boolean;
  format?: string;
  align?: "left" | "center" | "right";
  wrapText?: boolean;
};

export const BULK_JOB_TEMPLATE_COLUMNS: readonly BulkJobColumnDefinition[] = [
  {
    header: "Job Title",
    key: "jobTitle",
    width: 28,
    description: "Title of the job posting (e.g. SAP MM Consultant)",
    example: "SAP MM Consultant",
    required: true,
    wrapText: false,
  },
  {
    header: "Job Description",
    key: "jobDescription",
    width: 48,
    description: "Detailed job description, responsibilities, and scope",
    example:
      "We are looking for an experienced SAP MM Consultant to support implementation and business process initiatives.",
    required: true,
    wrapText: true,
  },
  {
    header: "SAP Module",
    key: "sapModule",
    width: 18,
    description: "Primary SAP module (e.g. MM, FICO, SD, PP, S/4HANA, ABAP, BTP)",
    example: "MM",
    required: true,
    wrapText: false,
  },
  {
    header: "Job Type",
    key: "jobType",
    width: 18,
    description: "Permanent, Contract, Contract-to-Hire, or Freelance",
    example: "Permanent",
    required: true,
    wrapText: false,
  },
  {
    header: "Employment Type",
    key: "employmentType",
    width: 20,
    description: "Full-time or Part-time",
    example: "Full-time",
    required: true,
    wrapText: false,
  },
  {
    header: "Experience Min",
    key: "experienceMin",
    width: 18,
    description: "Minimum years of experience (numeric)",
    example: 4,
    required: true,
    align: "right",
    format: "0",
  },
  {
    header: "Experience Max",
    key: "experienceMax",
    width: 18,
    description: "Maximum years of experience (numeric)",
    example: 8,
    required: true,
    align: "right",
    format: "0",
  },
  {
    header: "Location",
    key: "location",
    width: 22,
    description: "City or primary work location (e.g. Hyderabad, Bengaluru, London)",
    example: "Hyderabad",
    required: true,
    wrapText: false,
  },
  {
    header: "Work Mode",
    key: "workMode",
    width: 16,
    description: "On-site, Hybrid, or Remote",
    example: "Hybrid",
    required: true,
    wrapText: false,
  },
  {
    header: "Country",
    key: "country",
    width: 18,
    description: "Country name or code (e.g. India, United States, Germany)",
    example: "India",
    required: true,
    wrapText: false,
  },
  {
    header: "Skills",
    key: "skills",
    width: 40,
    description: "Comma-separated key skills and certifications",
    example: "SAP MM, S/4HANA, Procurement, Inventory Management",
    required: true,
    wrapText: true,
  },
  {
    header: "Salary Min",
    key: "salaryMin",
    width: 18,
    description: "Minimum annual/base salary amount (numeric)",
    example: 1200000,
    required: false,
    align: "right",
    format: "#,##0",
  },
  {
    header: "Salary Max",
    key: "salaryMax",
    width: 18,
    description: "Maximum annual/base salary amount (numeric)",
    example: 1800000,
    required: false,
    align: "right",
    format: "#,##0",
  },
  {
    header: "Currency",
    key: "currency",
    width: 14,
    description: "3-letter currency code (e.g. INR, USD, EUR, GBP)",
    example: "INR",
    required: false,
    align: "center",
  },
  {
    header: "Notice Period",
    key: "noticePeriod",
    width: 18,
    description: "Preferred notice period (e.g. Immediate, 15 Days, 30 Days, 60 Days)",
    example: "30 Days",
    required: false,
  },
  {
    header: "Education",
    key: "education",
    width: 24,
    description: "Minimum educational requirement (e.g. Bachelor's Degree, Master's)",
    example: "Bachelor's Degree",
    required: false,
  },
  {
    header: "Number of Openings",
    key: "numberOfOpenings",
    width: 22,
    description: "Total vacancies for this position (numeric, e.g. 1, 2, 5)",
    example: 2,
    required: true,
    align: "right",
    format: "0",
  },
  {
    header: "Application Deadline",
    key: "applicationDeadline",
    width: 24,
    description: "Posting closing date in YYYY-MM-DD format (e.g. 2026-09-30)",
    example: "2026-09-30",
    required: false,
    align: "center",
  },
  {
    header: "Contact Email",
    key: "contactEmail",
    width: 28,
    description: "Recruiter or team contact email address for queries",
    example: "careers@example.com",
    required: false,
  },
] as const;
