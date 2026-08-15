import {
  BULK_UPLOAD_CONFIG,
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  JOB_TYPE_OPTIONS,
  SAP_MODULE_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
} from "../constants";
import type {
  BulkJobFileValidationResult,
  BulkJobValidationRow,
  NormalizedJobData,
  RawParsedRow,
  ValidationIssue,
} from "../types/bulkUpload.types";

import type { Currency, EmploymentType, JobType, WorkArrangement } from "../types/job.types";

/**
 * Normalization helpers
 */
function cleanString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Canonical SAP module matching
 */
const CANONICAL_SAP_MODULES: { canonical: string; matchKeys: string[] }[] =
  SAP_MODULE_OPTIONS.map((opt) => {
    const rawVal = opt.value;
    const withoutSap = rawVal.replace(/^SAP\s+/i, "").trim();
    return {
      canonical: rawVal,
      matchKeys: [
        rawVal.toLowerCase(),
        withoutSap.toLowerCase(),
        withoutSap.toLowerCase().replace(/[^a-z0-9]/g, ""),
      ],
    };
  });

export function normalizeSapModule(val: string): string | null {
  const cleaned = cleanString(val).toLowerCase();
  if (!cleaned) return null;

  const stripped = cleaned.replace(/^sap\s+/i, "").trim();
  const strippedAlphanum = stripped.replace(/[^a-z0-9]/g, "");

  for (const entry of CANONICAL_SAP_MODULES) {
    if (
      entry.matchKeys.includes(cleaned) ||
      entry.matchKeys.includes(stripped) ||
      entry.matchKeys.includes(strippedAlphanum)
    ) {
      return entry.canonical;
    }
  }
  return null;
}

/**
 * Canonical Job Type matching
 */
export function normalizeJobType(val: string): JobType | null {
  const cleaned = cleanString(val).toLowerCase().replace(/[\s_-]+/g, "");
  for (const opt of JOB_TYPE_OPTIONS) {
    const optCleaned = opt.value.toLowerCase().replace(/[\s_-]+/g, "");
    if (cleaned === optCleaned) {
      return opt.value;
    }
  }
  return null;
}

/**
 * Canonical Employment Type matching
 */
export function normalizeEmploymentType(val: string): EmploymentType | null {
  const cleaned = cleanString(val).toLowerCase().replace(/[\s_-]+/g, "");
  for (const opt of EMPLOYMENT_TYPE_OPTIONS) {
    const optCleaned = opt.value.toLowerCase().replace(/[\s_-]+/g, "");
    if (cleaned === optCleaned) {
      return opt.value;
    }
  }
  return null;
}

/**
 * Canonical Work Arrangement / Mode matching
 */
export function normalizeWorkMode(val: string): WorkArrangement | null {
  const cleaned = cleanString(val).toLowerCase().replace(/[\s_-]+/g, "");
  for (const opt of WORK_ARRANGEMENT_OPTIONS) {
    const optCleaned = opt.value.toLowerCase().replace(/[\s_-]+/g, "");
    if (cleaned === optCleaned) {
      return opt.value;
    }
  }
  return null;
}

/**
 * Canonical Country matching
 */
const COUNTRY_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  uk: "United Kingdom",
  uae: "United Arab Emirates",
  in: "India",
  ind: "India",
  de: "Germany",
  sg: "Singapore",
  au: "Australia",
  ca: "Canada",
  nl: "Netherlands",
};

export function normalizeCountry(val: string): string | null {
  const cleaned = cleanString(val).toLowerCase();
  if (!cleaned) return null;

  if (COUNTRY_ALIASES[cleaned]) {
    return COUNTRY_ALIASES[cleaned];
  }

  for (const opt of COUNTRY_OPTIONS) {
    if (opt.value.toLowerCase() === cleaned) {
      return opt.value;
    }
  }

  if (cleaned === "netherlands") {
    return "Netherlands";
  }

  return null;
}

/**
 * Canonical Currency matching
 */
export function normalizeCurrency(val: string): Currency | null {
  const cleaned = cleanString(val).toUpperCase();
  for (const opt of CURRENCY_OPTIONS) {
    if (opt.value === cleaned) {
      return opt.value;
    }
  }
  return null;
}

/**
 * Skills parser & deduplicator
 */
export function parseAndDeduplicateSkills(val: unknown): string[] {
  const rawStr = cleanString(val);
  if (!rawStr) return [];

  const rawList = rawStr
    .split(/[,;\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const uniqueSkills: string[] = [];

  for (const skill of rawList) {
    const lower = skill.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueSkills.push(skill);
    }
  }

  return uniqueSkills;
}

/**
 * Excel Date parser: handles JS Date, Excel serial numbers, and ISO strings
 */
export function parseExcelDate(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // If number (Excel date serial e.g. 46295 for 2026-09-30)
  if (typeof val === "number") {
    if (val < 1 || val > 2958465) return null; // Excel epoch valid range
    // Excel epoch begins Dec 30 1899 due to 1900 leap year bug
    const epochMs = Date.UTC(1899, 11, 30);
    const dateMs = epochMs + Math.round(val * 86400000);
    const date = new Date(dateMs);
    if (isNaN(date.getTime())) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Check YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    ) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return null;
  }

  // Check DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY
  const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(str);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const y = parseInt(slashMatch[3], 10);

    let m = p1;
    let d = p2;
    if (p1 > 12 && p2 <= 12) {
      d = p1;
      m = p2;
    }
    const date = new Date(Date.UTC(y, m - 1, d));
    if (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    ) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a single parsed row from the Excel sheet.
 */
export function validateBulkJobRow(
  row: RawParsedRow,
  seenJobKeys: Map<string, number>
): BulkJobValidationRow {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const raw = row.rawValues;
  const limits = BULK_UPLOAD_CONFIG.fieldLimits;

  // Helper to extract value by either header name or camelCase key
  const getRaw = (header: string, key: string): unknown => {
    return raw[header] !== undefined && raw[header] !== ""
      ? raw[header]
      : raw[key] !== undefined && raw[key] !== ""
      ? raw[key]
      : "";
  };

  // 1. Job Title
  const rawTitle = cleanString(getRaw("Job Title", "jobTitle"));
  if (!rawTitle) {
    errors.push({ field: "Job Title", message: "Job Title is required." });
  } else if (rawTitle.length > limits.title) {
    errors.push({
      field: "Job Title",
      message: `Job Title exceeds the maximum allowed length (${limits.title} characters).`,
    });
  }

  // 2. Job Description
  const rawDesc = cleanString(getRaw("Job Description", "jobDescription"));
  if (!rawDesc) {
    errors.push({
      field: "Job Description",
      message: "Job Description is required.",
    });
  } else if (rawDesc.length > limits.description) {
    errors.push({
      field: "Job Description",
      message: `Job Description exceeds the maximum allowed length (${limits.description.toLocaleString()} characters).`,
    });
  }

  // 3. SAP Module
  const rawModule = cleanString(getRaw("SAP Module", "sapModule"));
  const normalizedModule = normalizeSapModule(rawModule);
  if (!rawModule) {
    errors.push({ field: "SAP Module", message: "SAP Module is required." });
  } else if (!normalizedModule) {
    errors.push({
      field: "SAP Module",
      message: `SAP module "${rawModule}" is not currently available.`,
    });
  }

  // 4. Job Type
  const rawJobType = cleanString(getRaw("Job Type", "jobType"));
  const normalizedJobType = normalizeJobType(rawJobType);
  if (!rawJobType) {
    errors.push({ field: "Job Type", message: "Job Type is required." });
  } else if (!normalizedJobType) {
    errors.push({
      field: "Job Type",
      message:
        "Invalid Job Type. Please use Permanent, Contract, Contract-to-Hire, or Freelance.",
    });
  }

  // 5. Employment Type
  const rawEmpType = cleanString(getRaw("Employment Type", "employmentType"));
  const normalizedEmpType = normalizeEmploymentType(rawEmpType);
  if (!rawEmpType) {
    errors.push({
      field: "Employment Type",
      message: "Employment Type is required.",
    });
  } else if (!normalizedEmpType) {
    errors.push({
      field: "Employment Type",
      message: "Invalid Employment Type. Please use Full-time or Part-time.",
    });
  }

  // 6. Experience Min & Max
  const rawExpMin = getRaw("Experience Min", "experienceMin");
  const rawExpMax = getRaw("Experience Max", "experienceMax");

  let minExpNum = 0;
  let maxExpNum = 0;
  let hasValidMinExp = false;
  let hasValidMaxExp = false;

  if (rawExpMin === "" || rawExpMin === null || rawExpMin === undefined) {
    errors.push({
      field: "Experience Min",
      message: "Experience Min is required.",
    });
  } else {
    const num = Number(rawExpMin);
    if (isNaN(num) || !isFinite(num) || num < 0 || num > limits.maxExperience) {
      errors.push({
        field: "Experience Min",
        message: `Experience Min must be a valid number between 0 and ${limits.maxExperience}.`,
      });
    } else {
      minExpNum = num;
      hasValidMinExp = true;
    }
  }

  if (rawExpMax === "" || rawExpMax === null || rawExpMax === undefined) {
    errors.push({
      field: "Experience Max",
      message: "Experience Max is required.",
    });
  } else {
    const num = Number(rawExpMax);
    if (isNaN(num) || !isFinite(num) || num < 0 || num > limits.maxExperience) {
      errors.push({
        field: "Experience Max",
        message: `Experience Max must be a valid number between 0 and ${limits.maxExperience}.`,
      });
    } else {
      maxExpNum = num;
      hasValidMaxExp = true;
    }
  }

  if (hasValidMinExp && hasValidMaxExp && maxExpNum < minExpNum) {
    errors.push({
      field: "Experience Max",
      message: "Experience Max must be greater than or equal to Experience Min.",
    });
  }

  // 7. Location
  const rawLoc = cleanString(getRaw("Location", "location"));
  if (!rawLoc) {
    errors.push({ field: "Location", message: "Location is required." });
  } else if (rawLoc.length > limits.location) {
    errors.push({
      field: "Location",
      message: `Location exceeds the maximum allowed length (${limits.location} characters).`,
    });
  }

  // 8. Work Mode
  const rawWorkMode = cleanString(getRaw("Work Mode", "workMode"));
  const normalizedWorkMode = normalizeWorkMode(rawWorkMode);
  if (!rawWorkMode) {
    errors.push({ field: "Work Mode", message: "Work Mode is required." });
  } else if (!normalizedWorkMode) {
    errors.push({
      field: "Work Mode",
      message: "Invalid Work Mode. Please use On-site, Hybrid, or Remote.",
    });
  }

  // 9. Country
  const rawCountry = cleanString(getRaw("Country", "country"));
  const normalizedCountry = normalizeCountry(rawCountry);
  if (!rawCountry) {
    errors.push({ field: "Country", message: "Country is required." });
  } else if (!normalizedCountry) {
    errors.push({
      field: "Country",
      message: `Invalid Country: "${rawCountry}". Please use a supported country (e.g. India, United States, Germany, United Kingdom).`,
    });
  }

  // 10. Skills
  const rawSkills = getRaw("Skills", "skills");
  const skillsList = parseAndDeduplicateSkills(rawSkills);
  if (skillsList.length === 0) {
    errors.push({ field: "Skills", message: "Skills are required." });
  } else if (skillsList.join(", ").length > limits.maxSkillsTotalLength) {
    errors.push({
      field: "Skills",
      message: `Skills list exceeds maximum allowed length (${limits.maxSkillsTotalLength} characters).`,
    });
  }

  // 11. Salary Min & Max (Optional)
  const rawSalMin = getRaw("Salary Min", "salaryMin");
  const rawSalMax = getRaw("Salary Max", "salaryMax");
  let salMinNum: number | null = null;
  let salMaxNum: number | null = null;

  if (rawSalMin !== "" && rawSalMin !== null && rawSalMin !== undefined) {
    const num = Number(rawSalMin);
    if (isNaN(num) || !isFinite(num) || num < 0 || num > limits.maxSalary) {
      errors.push({
        field: "Salary Min",
        message: `Salary Min must be a valid positive number up to ${limits.maxSalary.toLocaleString()}.`,
      });
    } else {
      salMinNum = num;
    }
  }

  if (rawSalMax !== "" && rawSalMax !== null && rawSalMax !== undefined) {
    const num = Number(rawSalMax);
    if (isNaN(num) || !isFinite(num) || num < 0 || num > limits.maxSalary) {
      errors.push({
        field: "Salary Max",
        message: `Salary Max must be a valid positive number up to ${limits.maxSalary.toLocaleString()}.`,
      });
    } else {
      salMaxNum = num;
    }
  }

  if (salMinNum !== null && salMaxNum !== null && salMaxNum < salMinNum) {
    errors.push({
      field: "Salary Max",
      message: "Salary Max must be greater than or equal to Salary Min.",
    });
  } else if (
    (salMinNum !== null && salMaxNum === null) ||
    (salMinNum === null && salMaxNum !== null)
  ) {
    warnings.push({
      field: "Salary",
      message:
        "Only one salary value provided. Specifying both minimum and maximum salary is recommended.",
    });
  }

  // 12. Currency (Required if salary is specified)
  const rawCurrency = cleanString(getRaw("Currency", "currency"));
  const normalizedCurrency = normalizeCurrency(rawCurrency);
  const hasSalary = salMinNum !== null || salMaxNum !== null;

  if (hasSalary && !rawCurrency) {
    errors.push({
      field: "Currency",
      message: "Currency is required when salary is provided (e.g. INR, USD, EUR, GBP).",
    });
  } else if (rawCurrency && !normalizedCurrency) {
    errors.push({
      field: "Currency",
      message: `Invalid Currency: "${rawCurrency}". Please use USD, EUR, GBP, INR, AUD, CAD, or SGD.`,
    });
  }

  // 13. Notice Period (Optional)
  const noticePeriod = cleanString(getRaw("Notice Period", "noticePeriod"));
  if (noticePeriod && noticePeriod.length > limits.noticePeriod) {
    errors.push({
      field: "Notice Period",
      message: `Notice Period exceeds maximum allowed length (${limits.noticePeriod} characters).`,
    });
  }

  // 14. Education (Optional)
  const education = cleanString(getRaw("Education", "education"));
  if (education && education.length > limits.education) {
    errors.push({
      field: "Education",
      message: `Education exceeds maximum allowed length (${limits.education} characters).`,
    });
  }

  // 15. Number of Openings (Optional, default 1)
  const rawOpenings = getRaw("Number of Openings", "numberOfOpenings");
  let openings = 1;
  if (rawOpenings !== "" && rawOpenings !== null && rawOpenings !== undefined) {
    const num = Number(rawOpenings);
    if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > limits.maxOpenings) {
      errors.push({
        field: "Number of Openings",
        message: "Number of openings must be a whole number greater than zero.",
      });
    } else {
      openings = num;
    }
  }

  // 16. Application Deadline (Optional)
  const rawDeadline = getRaw("Application Deadline", "applicationDeadline");
  let deadline: string | null = null;
  if (rawDeadline !== "" && rawDeadline !== null && rawDeadline !== undefined) {
    const parsedDate = parseExcelDate(rawDeadline);
    if (!parsedDate) {
      errors.push({
        field: "Application Deadline",
        message: "Invalid Application Deadline format. Please use YYYY-MM-DD.",
      });
    } else {
      // Validate deadline is not in the past
      const todayIso = new Date().toISOString().split("T")[0];
      if (parsedDate < todayIso) {
        errors.push({
          field: "Application Deadline",
          message: "Application deadline cannot be in the past.",
        });
      } else {
        deadline = parsedDate;
      }
    }
  }

  // 17. Contact Email (Optional)
  const rawEmail = cleanString(getRaw("Contact Email", "contactEmail"));
  let contactEmail = "";
  if (rawEmail) {
    if (rawEmail.length > limits.contactEmail) {
      errors.push({
        field: "Contact Email",
        message: `Contact Email exceeds maximum allowed length (${limits.contactEmail} characters).`,
      });
    } else if (!EMAIL_REGEX.test(rawEmail)) {
      errors.push({
        field: "Contact Email",
        message: "Please enter a valid email address.",
      });
    } else {
      contactEmail = rawEmail.toLowerCase();
    }
  }

  // 18. Duplicate detection within file
  if (rawTitle && normalizedModule && rawLoc) {
    const duplicateKey = `${rawTitle.toLowerCase()}|${normalizedModule.toLowerCase()}|${rawLoc.toLowerCase()}`;
    const previousRowNumber = seenJobKeys.get(duplicateKey);
    if (previousRowNumber !== undefined) {
      warnings.push({
        field: "Job Title",
        message: `Possible duplicate job found in this upload (matches Row ${previousRowNumber}).`,
      });
    } else {
      seenJobKeys.set(duplicateKey, row.rowNumber);
    }
  }

  // Determine status
  const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";

  const normalizedData: NormalizedJobData = {
    title: rawTitle,
    description: rawDesc,
    sapModule: normalizedModule ?? rawModule,
    jobType: normalizedJobType ?? rawJobType,
    employmentType: normalizedEmpType ?? rawEmpType,
    minExperience: minExpNum,
    maxExperience: maxExpNum,
    location: rawLoc,
    workMode: normalizedWorkMode ?? rawWorkMode,
    country: normalizedCountry ?? rawCountry,
    skills: skillsList,
    minSalary: salMinNum,
    maxSalary: salMaxNum,
    currency: normalizedCurrency ?? "",
    noticePeriod,
    education,
    openings,
    deadline,
    contactEmail,
  };

  return {
    rowNumber: row.rowNumber,
    status,
    data: normalizedData,
    raw,
    errors,
    warnings,
  };
}

/**
 * Validates all parsed rows from an Excel file and returns aggregated statistics.
 */
export function validateBulkJobRows(
  fileName: string,
  fileSize: number,
  rawRows: RawParsedRow[],
  fileErrors: string[] = [],
  fileWarnings: string[] = [],
  options?: {
    isUnsupportedTemplate?: boolean;
    isExceedsMaxRows?: boolean;
    isEmptyFile?: boolean;
  }
): BulkJobFileValidationResult {
  const seenJobKeys = new Map<string, number>();
  const validationRows: BulkJobValidationRow[] = [];

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const rawRow of rawRows) {
    const validatedRow = validateBulkJobRow(rawRow, seenJobKeys);
    validationRows.push(validatedRow);

    if (validatedRow.status === "valid") {
      validCount++;
    } else if (validatedRow.status === "warning") {
      warningCount++;
    } else {
      errorCount++;
    }
  }

  return {
    fileName,
    fileSize,
    totalRows: rawRows.length,
    validCount,
    warningCount,
    errorCount,
    fileErrors,
    fileWarnings,
    rows: validationRows,
    isUnsupportedTemplate: options?.isUnsupportedTemplate,
    isExceedsMaxRows: options?.isExceedsMaxRows,
    isEmptyFile: options?.isEmptyFile,
  };
}
