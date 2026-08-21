import * as XLSX from "xlsx";
import type {
  BulkJobErrorReportRow,
  BulkJobValidationRow,
} from "../types/bulkUpload.types";

export const ERROR_REPORT_COLUMNS = [
  { header: "Excel Row", key: "rowNumber", width: 14, align: "center" as const },
  { header: "Job Title", key: "jobTitle", width: 30, align: "left" as const },
  { header: "SAP Module", key: "sapModule", width: 16, align: "center" as const },
  { header: "Location", key: "location", width: 22, align: "left" as const },
  { header: "Severity", key: "issueType", width: 14, align: "center" as const },
  { header: "Field Name", key: "field", width: 24, align: "left" as const },
  { header: "Issue Description", key: "message", width: 55, align: "left" as const },
] as const;

/**
 * Sanitizes user-controlled text strings to prevent Excel/CSV formula injection.
 * Prefixes strings starting with =, +, -, @, \t, \r with a single apostrophe.
 */
export function sanitizeFormulaText(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (!str) return "";
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Extracts flattened error and warning rows from validation result.
 */
export function extractErrorReportRows(
  rows: BulkJobValidationRow[]
): BulkJobErrorReportRow[] {
  const reportRows: BulkJobErrorReportRow[] = [];

  for (const row of rows) {
    const rawTitle =
      row.data.title ||
      String(row.raw["Job Title"] || row.raw["jobTitle"] || "(Empty Title)");
    const rawModule =
      row.data.sapModule ||
      String(row.raw["SAP Module"] || row.raw["sapModule"] || "(Empty Module)");
    const rawLoc =
      row.data.location ||
      String(row.raw["Location"] || row.raw["location"] || "(Empty Location)");

    const jobTitle = sanitizeFormulaText(rawTitle);
    const sapModule = sanitizeFormulaText(rawModule);
    const location = sanitizeFormulaText(rawLoc);

    // Add blocking errors
    for (const err of row.errors) {
      reportRows.push({
        rowNumber: row.rowNumber,
        jobTitle,
        sapModule,
        location,
        issueType: "Error",
        field: sanitizeFormulaText(err.field),
        message: sanitizeFormulaText(err.message),
      });
    }

    // Add warnings
    for (const warn of row.warnings) {
      reportRows.push({
        rowNumber: row.rowNumber,
        jobTitle,
        sapModule,
        location,
        issueType: "Warning",
        field: sanitizeFormulaText(warn.field),
        message: sanitizeFormulaText(warn.message),
      });
    }
  }

  return reportRows;
}

/**
 * Generates an Excel workbook containing all validation errors and warnings.
 */
export function createBulkJobErrorReportWorkbook(
  rows: BulkJobValidationRow[],
  originalFileName = "Spreadsheet"
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const reportItems = extractErrorReportRows(rows);

  const wsData =
    reportItems.length > 0
      ? reportItems.map((item) => ({
          "Excel Row": item.rowNumber,
          "Job Title": item.jobTitle,
          "SAP Module": item.sapModule,
          "Location": item.location,
          "Severity": item.issueType,
          "Field Name": item.field,
          "Issue Description": item.message,
        }))
      : [
          {
            "Excel Row": "-",
            "Job Title": "No errors or warnings found",
            "SAP Module": "-",
            "Location": "-",
            "Severity": "Info",
            "Field Name": "None",
            "Issue Description": `All rows in ${originalFileName} passed validation successfully with no errors or warnings.`,
          },
        ];

  const worksheet = XLSX.utils.json_to_sheet(wsData);
  worksheet["!cols"] = ERROR_REPORT_COLUMNS.map((col) => ({ wch: col.width }));
  XLSX.utils.book_append_sheet(workbook, worksheet, "Validation Issues");

  return workbook;
}

/**
 * Generates an Excel error report binary buffer.
 */
export async function generateBulkJobErrorReportBuffer(
  rows: BulkJobValidationRow[],
  originalFileName?: string
): Promise<Uint8Array> {
  const workbook = createBulkJobErrorReportWorkbook(rows, originalFileName);
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Uint8Array(buffer);
}

/**
 * Triggers a client-side browser download of the error report.
 */
export async function downloadBulkJobErrorReport(
  rows: BulkJobValidationRow[],
  originalFileName = "job_upload"
): Promise<void> {
  const baseName = originalFileName.replace(/\.[^/.]+$/, "");
  const reportFileName = `Import_Errors_${baseName}.xlsx`;

  try {
    const buffer = await generateBulkJobErrorReportBuffer(rows, originalFileName);
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate Excel error report:", error);
  }
}

export const IMPORT_RESULT_REPORT_COLUMNS = [
  { header: "Excel Row", key: "rowNumber", width: 14, align: "center" as const },
  { header: "Job Title", key: "jobTitle", width: 32, align: "left" as const },
  { header: "Import Status", key: "status", width: 16, align: "center" as const },
  { header: "Result Details / Reason", key: "reason", width: 55, align: "left" as const },
  { header: "Job ID", key: "jobId", width: 38, align: "center" as const },
] as const;

/**
 * Creates an Excel workbook summarizing the bulk import outcome (Created, Skipped, Failed).
 */
export function createBulkImportResultWorkbook(
  result: {
    created: { rowNumber: number; jobTitle: string; jobId?: string }[];
    skipped: { rowNumber: number; jobTitle: string; reason?: string; jobId?: string }[];
    failed: { rowNumber: number; jobTitle: string; reason?: string }[];
  },
  _originalFileName = "Bulk_Job_Upload"
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const allRows: {
    "Excel Row": number;
    "Job Title": string;
    "Import Status": "Created" | "Skipped" | "Failed";
    "Result Details / Reason": string;
    "Job ID": string;
  }[] = [];

  for (const item of result.created) {
    allRows.push({
      "Excel Row": item.rowNumber,
      "Job Title": sanitizeFormulaText(item.jobTitle),
      "Import Status": "Created",
      "Result Details / Reason": "Job created successfully as Draft.",
      "Job ID": item.jobId || "—",
    });
  }

  for (const item of result.skipped) {
    allRows.push({
      "Excel Row": item.rowNumber,
      "Job Title": sanitizeFormulaText(item.jobTitle),
      "Import Status": "Skipped",
      "Result Details / Reason": sanitizeFormulaText(item.reason || "Skipped."),
      "Job ID": item.jobId || "—",
    });
  }

  for (const item of result.failed) {
    allRows.push({
      "Excel Row": item.rowNumber,
      "Job Title": sanitizeFormulaText(item.jobTitle),
      "Import Status": "Failed",
      "Result Details / Reason": sanitizeFormulaText(item.reason || "Unable to import job."),
      "Job ID": "—",
    });
  }

  allRows.sort((a, b) => a["Excel Row"] - b["Excel Row"]);

  const worksheet = XLSX.utils.json_to_sheet(allRows);
  worksheet["!cols"] = IMPORT_RESULT_REPORT_COLUMNS.map((col) => ({ wch: col.width }));
  XLSX.utils.book_append_sheet(workbook, worksheet, "Import Results");

  return workbook;
}

/**
 * Generates an Excel import result report binary buffer.
 */
export async function generateBulkImportResultReportBuffer(
  result: {
    created: { rowNumber: number; jobTitle: string; jobId?: string }[];
    skipped: { rowNumber: number; jobTitle: string; reason?: string; jobId?: string }[];
    failed: { rowNumber: number; jobTitle: string; reason?: string }[];
  },
  originalFileName?: string
): Promise<Uint8Array> {
  const workbook = createBulkImportResultWorkbook(result, originalFileName);
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Uint8Array(buffer);
}

/**
 * Triggers a client-side download of the import result summary report.
 */
export async function downloadBulkImportResultReport(
  result: {
    created: { rowNumber: number; jobTitle: string; jobId?: string }[];
    skipped: { rowNumber: number; jobTitle: string; reason?: string; jobId?: string }[];
    failed: { rowNumber: number; jobTitle: string; reason?: string }[];
  },
  originalFileName = "job_import_summary"
): Promise<void> {
  const baseName = originalFileName.replace(/\.[^/.]+$/, "");
  const reportFileName = `Import_Results_${baseName}.xlsx`;

  try {
    const buffer = await generateBulkImportResultReportBuffer(result, originalFileName);
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate Excel import result report:", error);
  }
}

/**
 * Creates an Excel workbook from persistent BulkImportRowRecord array.
 */
export function createBulkImportSessionWorkbook(
  rows: Array<{
    rowNumber: number;
    jobTitle: string;
    status: "created" | "skipped" | "failed";
    reason?: string | null;
    jobId?: string | null;
  }>,
  fileName = "Import_Report"
): XLSX.WorkBook {
  const created = rows
    .filter((r) => r.status === "created")
    .map((r) => ({
      rowNumber: r.rowNumber,
      jobTitle: r.jobTitle,
      jobId: r.jobId ?? undefined,
    }));
  const skipped = rows
    .filter((r) => r.status === "skipped")
    .map((r) => ({
      rowNumber: r.rowNumber,
      jobTitle: r.jobTitle,
      reason: r.reason ?? undefined,
      jobId: r.jobId ?? undefined,
    }));
  const failed = rows
    .filter((r) => r.status === "failed")
    .map((r) => ({
      rowNumber: r.rowNumber,
      jobTitle: r.jobTitle,
      reason: r.reason ?? undefined,
    }));

  return createBulkImportResultWorkbook({ created, skipped, failed }, fileName);
}

/**
 * Generates an Excel buffer for persistent BulkImportRowRecord array.
 */
export async function generateBulkImportSessionReportBuffer(
  rows: Array<{
    rowNumber: number;
    jobTitle: string;
    status: "created" | "skipped" | "failed";
    reason?: string | null;
    jobId?: string | null;
  }>,
  fileName?: string
): Promise<Uint8Array> {
  const workbook = createBulkImportSessionWorkbook(rows, fileName);
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Uint8Array(buffer);
}

/**
 * Triggers browser download for historical import session report.
 */
export async function downloadBulkImportSessionReport(
  session: {
    id: string;
    fileName: string;
    createdAt: string;
  },
  rows: Array<{
    rowNumber: number;
    jobTitle: string;
    status: "created" | "skipped" | "failed";
    reason?: string | null;
    jobId?: string | null;
  }>
): Promise<void> {
  const shortId = session.id.slice(0, 8);
  const safeDate = session.createdAt
    ? new Date(session.createdAt).toISOString().split("T")[0]
    : "report";
  const reportFileName = `SAP_Jobs_Finder_Bulk_Import_${safeDate}_${shortId}_Report.xlsx`;

  try {
    const buffer = await generateBulkImportSessionReportBuffer(rows, session.fileName);
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download bulk import session report:", error);
  }
}
