import ExcelJS from "exceljs";
import {
  BULK_UPLOAD_CONFIG,
  CURRENCY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  JOB_TYPE_OPTIONS,
  SAP_MODULE_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
} from "../constants";

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

/**
 * Builds the standard Excel template workbook with:
 * - Sheet 1: "Job Openings" (19 ordered columns, styled header, frozen rows, realistic example)
 * - Sheet 2: "Instructions" (guidelines, required/optional fields, accepted values, template version 1.0)
 * - Custom template version metadata
 */
export function createBulkJobTemplateWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SAP Jobs Finder";
  workbook.lastModifiedBy = "SAP Jobs Finder";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = `Template Version: ${BULK_JOB_TEMPLATE_VERSION}`;
  workbook.description = `SAP Jobs Finder Bulk Job Upload Template Version ${BULK_JOB_TEMPLATE_VERSION}`;

  // =========================================================================
  // SHEET 1: Job Openings (Primary Data Entry Sheet)
  // =========================================================================
  const worksheet = workbook.addWorksheet("Job Openings", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, showGridLines: true }],
    properties: { defaultRowHeight: 22 },
  });

  // Define columns
  worksheet.columns = BULK_JOB_TEMPLATE_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style Header Row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070F2" }, // SAP Brand Blue
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: false,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0056B3" } },
      bottom: { style: "medium", color: { argb: "FF003F80" } },
      left: { style: "thin", color: { argb: "FF0056B3" } },
      right: { style: "thin", color: { argb: "FF0056B3" } },
    };
  });

  // Build Example Row Data (Row 2)
  const exampleRowData: Record<string, string | number> = {};
  BULK_JOB_TEMPLATE_COLUMNS.forEach((col) => {
    exampleRowData[col.key] = col.example;
  });

  const exampleRow = worksheet.addRow(exampleRowData);
  exampleRow.height = 36;
  exampleRow.eachCell((cell, colNumber) => {
    const colDef = BULK_JOB_TEMPLATE_COLUMNS[colNumber - 1];
    cell.font = {
      name: "Calibri",
      size: 10,
      color: { argb: "FF0F172A" },
    };
    cell.alignment = {
      vertical: "top",
      horizontal: colDef.align ?? "left",
      wrapText: colDef.wrapText ?? false,
    };
    if (colDef.format) {
      cell.numFmt = colDef.format;
    }
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });

  // =========================================================================
  // SHEET 2: Instructions (Guidelines & Accepted Values)
  // =========================================================================
  const instructionsSheet = workbook.addWorksheet("Instructions", {
    views: [{ showGridLines: true }],
  });

  instructionsSheet.columns = [
    { header: "Section", key: "section", width: 24 },
    { header: "Field / Topic", key: "field", width: 28 },
    { header: "Required / Optional", key: "required", width: 20 },
    { header: "Accepted Values / Guidelines", key: "details", width: 70 },
  ];

  const instHeader = instructionsSheet.getRow(1);
  instHeader.height = 28;
  instHeader.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  const instructionsData = [
    {
      section: "Template Information",
      field: "Template Version",
      required: `Version ${BULK_JOB_TEMPLATE_VERSION}`,
      details: "Official SAP Jobs Finder Bulk Job Upload Template. Do not rename or alter column headers.",
    },
    {
      section: "Upload Limits",
      field: "File & Row Limits",
      required: "System Limit",
      details: `Maximum file size: ${BULK_UPLOAD_CONFIG.maxFileSizeLabel}. Maximum rows per upload: ${BULK_UPLOAD_CONFIG.maxRows.toLocaleString()} job rows.`,
    },
    {
      section: "Required Fields",
      field: "Job Title",
      required: "Required",
      details: `Position title. Maximum ${BULK_UPLOAD_CONFIG.fieldLimits.title} characters. Example: "SAP MM Consultant"`,
    },
    {
      section: "Required Fields",
      field: "Job Description",
      required: "Required",
      details: `Detailed role overview and responsibilities. Maximum ${BULK_UPLOAD_CONFIG.fieldLimits.description.toLocaleString()} characters.`,
    },
    {
      section: "Required Fields",
      field: "SAP Module",
      required: "Required",
      details: `Supported: ${SAP_MODULE_OPTIONS.map((m) => m.value.replace(/^SAP\s+/i, "")).join(", ")} (or with "SAP " prefix).`,
    },
    {
      section: "Required Fields",
      field: "Job Type",
      required: "Required",
      details: `Supported values: ${JOB_TYPE_OPTIONS.map((j) => j.value).join(", ")}.`,
    },
    {
      section: "Required Fields",
      field: "Employment Type",
      required: "Required",
      details: `Supported values: ${EMPLOYMENT_TYPE_OPTIONS.map((e) => e.value).join(", ")}.`,
    },
    {
      section: "Required Fields",
      field: "Work Mode",
      required: "Required",
      details: `Supported values: ${WORK_ARRANGEMENT_OPTIONS.map((w) => w.value).join(", ")}.`,
    },
    {
      section: "Required Fields",
      field: "Experience Min & Max",
      required: "Required",
      details: "Whole numbers >= 0. Experience Max must be greater than or equal to Experience Min (e.g. Min: 4, Max: 8).",
    },
    {
      section: "Required Fields",
      field: "Location & Country",
      required: "Required",
      details: "City name in Location (e.g. Hyderabad, London, Dallas) and Country name in Country (e.g. India, United States, Germany).",
    },
    {
      section: "Required Fields",
      field: "Skills",
      required: "Required",
      details: "Comma-separated key skills (e.g. SAP MM, S/4HANA, Purchasing, Inventory).",
    },
    {
      section: "Required Fields",
      field: "Number of Openings",
      required: "Required",
      details: "Positive whole integer greater than 0 (e.g. 1, 2, 5).",
    },
    {
      section: "Optional Fields",
      field: "Salary Min & Max",
      required: "Optional",
      details: "Numeric salary values without currency symbols (e.g. 1200000 and 1800000).",
    },
    {
      section: "Optional Fields",
      field: "Currency",
      required: "Required if salary provided",
      details: `Supported 3-letter currency codes: ${CURRENCY_OPTIONS.map((c) => c.value).join(", ")}.`,
    },
    {
      section: "Optional Fields",
      field: "Application Deadline",
      required: "Optional",
      details: "Must be a current or future calendar date in YYYY-MM-DD format (e.g. 2026-09-30).",
    },
    {
      section: "Optional Fields",
      field: "Contact Email",
      required: "Optional",
      details: "Valid recruiter email address for candidate queries.",
    },
    {
      section: "Security & Ownership",
      field: "Company Ownership",
      required: "Automatic",
      details: "All jobs will be created under your authenticated company profile as 'Draft' for review.",
    },
  ];

  for (const rowItem of instructionsData) {
    const instRow = instructionsSheet.addRow(rowItem);
    instRow.height = 24;
    instRow.eachCell((cell, colNumber) => {
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF0F172A" } };
      cell.alignment = { vertical: "middle", horizontal: colNumber === 3 ? "center" : "left", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  }

  return workbook;
}

/**
 * Generates the Excel template binary buffer.
 */
export async function generateBulkJobTemplateBuffer(): Promise<Uint8Array> {
  const workbook = createBulkJobTemplateWorkbook();
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

/**
 * Triggers a client-side browser download of the standard Excel template.
 */
export async function downloadBulkJobTemplate(): Promise<void> {
  try {
    const buffer = await generateBulkJobTemplateBuffer();
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = BULK_JOB_TEMPLATE_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    // Fallback to static pre-generated file if available
    const link = document.createElement("a");
    link.href = `/templates/${BULK_JOB_TEMPLATE_FILENAME}`;
    link.download = BULK_JOB_TEMPLATE_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
