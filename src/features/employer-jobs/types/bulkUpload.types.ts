import type {
  Currency,
  EmploymentType,
  JobType,
  WorkArrangement,
} from "./job.types";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  field: string;
  message: string;
  severity?: ValidationSeverity;
};

export type RowValidationStatus = "valid" | "warning" | "error";

export type NormalizedJobData = {
  title: string;
  description: string;
  sapModule: string;
  jobType: JobType | string;
  employmentType: EmploymentType | string;
  minExperience: number;
  maxExperience: number;
  location: string;
  workMode: WorkArrangement | string;
  country: string;
  skills: string[];
  minSalary: number | null;
  maxSalary: number | null;
  currency: Currency | "";
  noticePeriod: string;
  education: string;
  openings: number;
  deadline: string | null; // YYYY-MM-DD
  contactEmail: string;
};

export type BulkJobValidationRow = {
  rowNumber: number; // 1-based Excel row number (e.g. 2 for first data row)
  status: RowValidationStatus;
  data: NormalizedJobData;
  raw: Record<string, unknown>;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export type BulkJobFileValidationResult = {
  fileName: string;
  fileSize: number;
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  fileErrors: string[];
  fileWarnings: string[];
  rows: BulkJobValidationRow[];
  isUnsupportedTemplate?: boolean;
  isExceedsMaxRows?: boolean;
  isEmptyFile?: boolean;
};

export type BulkImportFilterTab = "all" | "valid" | "warning" | "error";

export type BulkJobErrorReportRow = {
  rowNumber: number;
  jobTitle: string;
  sapModule: string;
  location: string;
  issueType: "Error" | "Warning";
  field: string;
  message: string;
};

export type BulkImportSessionSummary = {
  totalRows: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  selectedCount: number;
  selectedWarningsCount: number;
  excludedErrorsCount: number;
  canImport: boolean;
};

export type BulkImportHandoffPayload = {
  fileName: string;
  fileSize: number;
  totalParsedRows: number;
  approvedRows: BulkJobValidationRow[];
  timestamp: string;
};

export type RawParsedRow = {
  rowNumber: number;
  rawValues: Record<string, unknown>;
};

export type ExcelParseResult = {
  success: boolean;
  fileErrors: string[];
  fileWarnings: string[];
  rows: RawParsedRow[];
  headersFound: string[];
  isUnsupportedTemplate?: boolean;
  isExceedsMaxRows?: boolean;
  isEmptyFile?: boolean;
};

export type BulkImportJobPayloadItem = {
  rowNumber: number;
  title: string;
  description: string;
  sapModule: string;
  jobType: string;
  employmentType: string;
  minExperience: number;
  maxExperience: number | null;
  location: string;
  workMode: string;
  country: string;
  skills: string[];
  minSalary: number | null;
  maxSalary: number | null;
  currency: string;
  noticePeriod: string;
  education: string;
  openings: number;
  deadline: string | null;
  contactEmail: string;
};

export type ImportResultRow = {
  rowNumber: number;
  jobTitle: string;
  reason?: string;
  jobId?: string;
};

export type BulkImportStatus =
  | "processing"
  | "completed"
  | "completed_with_warnings"
  | "failed";

export type BulkImportRowStatus = "created" | "skipped" | "failed";

export type BulkImportResult = {
  importId?: string;
  status?: BulkImportStatus;
  totalSelected: number;
  created: ImportResultRow[];
  skipped: ImportResultRow[];
  failed: ImportResultRow[];
};

export type BulkImportResultFilterTab = "all" | "created" | "skipped" | "failed";

// =============================================================================
// Sprint 7E: Persistent History & Reporting Types
// =============================================================================

export type BulkImportSession = {
  id: string;
  companyId: string;
  uploadedBy: string;
  uploaderName?: string | null;
  uploaderEmail?: string | null;
  fileName: string;
  fileSize: number | null;
  fileType: string;
  totalRows: number;
  selectedRows: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  status: BulkImportStatus;
  createdAt: string;
  completedAt: string | null;
};

export type BulkImportRowRecord = {
  id: string;
  bulkImportId: string;
  rowNumber: number;
  jobTitle: string;
  status: BulkImportRowStatus;
  reason: string | null;
  jobId: string | null;
  createdAt: string;
};

export type BulkImportDateFilter = "all" | "today" | "7days" | "30days";

export type BulkImportHistoryFilter = {
  search?: string;
  status?: "all" | BulkImportStatus;
  dateRange?: BulkImportDateFilter;
  page?: number;
  pageSize?: number;
};

export type BulkImportHistoryResponse = {
  items: BulkImportSession[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BulkImportRowsFilter = {
  search?: string;
  status?: "all" | BulkImportRowStatus;
  page?: number;
  pageSize?: number;
};

export type BulkImportRowsResponse = {
  items: BulkImportRowRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BulkImportSessionDetails = {
  session: BulkImportSession;
  rows: BulkImportRowRecord[];
  counts: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
};
