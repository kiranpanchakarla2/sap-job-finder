import ExcelJS from "exceljs";
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
    const rawTitle = row.data.title || String(row.raw["Job Title"] || row.raw["jobTitle"] || "(Empty Title)");
    const rawModule = row.data.sapModule || String(row.raw["SAP Module"] || row.raw["sapModule"] || "(Empty Module)");
    const rawLoc = row.data.location || String(row.raw["Location"] || row.raw["location"] || "(Empty Location)");

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
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SAP Jobs Finder";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Validation Issues", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, showGridLines: true }],
    properties: { defaultRowHeight: 22 },
  });

  worksheet.columns = ERROR_REPORT_COLUMNS.map((col) => ({
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
      fgColor: { argb: "FFDC2626" }, // Crimson Red for error report
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF991B1B" } },
      bottom: { style: "medium", color: { argb: "FF7F1D1D" } },
      left: { style: "thin", color: { argb: "FF991B1B" } },
      right: { style: "thin", color: { argb: "FF991B1B" } },
    };
  });

  const reportItems = extractErrorReportRows(rows);

  if (reportItems.length === 0) {
    const emptyRow = worksheet.addRow({
      rowNumber: "-",
      jobTitle: "No errors or warnings found",
      sapModule: "-",
      location: "-",
      issueType: "Info",
      field: "None",
      message: `All rows in ${originalFileName} passed validation successfully with no errors or warnings.`,
    });
    emptyRow.height = 24;
    return workbook;
  }

  for (const item of reportItems) {
    const isError = item.issueType === "Error";
    const row = worksheet.addRow(item);
    row.height = 26;

    row.eachCell((cell, colNumber) => {
      const colDef = ERROR_REPORT_COLUMNS[colNumber - 1];
      cell.font = {
        name: "Calibri",
        size: 10,
        color: isError ? { argb: "FF991B1B" } : { argb: "FF92400E" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: colDef?.align ?? "left",
        wrapText: colDef?.key === "message",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: isError ? { argb: "FFFEE2E2" } : { argb: "FFFEF3C7" },
      };
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
 * Generates an Excel error report binary buffer.
 */
export async function generateBulkJobErrorReportBuffer(
  rows: BulkJobValidationRow[],
  originalFileName?: string
): Promise<Uint8Array> {
  const workbook = createBulkJobErrorReportWorkbook(rows, originalFileName);
  const buffer = await workbook.xlsx.writeBuffer();
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
    // Fallback: Generate CSV if ExcelJS fails
    downloadCsvErrorReport(rows, originalFileName);
  }
}

/**
 * Fallback CSV error report downloader
 */
function downloadCsvErrorReport(
  rows: BulkJobValidationRow[],
  originalFileName: string
): void {
  const reportItems = extractErrorReportRows(rows);
  const headers = [
    "Excel Row",
    "Job Title",
    "SAP Module",
    "Location",
    "Severity",
    "Field Name",
    "Issue Description",
  ];

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? "").replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines = [
    headers.map(escapeCsv).join(","),
    ...reportItems.map((item) =>
      [
        item.rowNumber,
        item.jobTitle,
        item.sapModule,
        item.location,
        item.issueType,
        item.field,
        item.message,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const baseName = originalFileName.replace(/\.[^/.]+$/, "");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Import_Errors_${baseName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  originalFileName = "Bulk_Job_Upload"
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SAP Jobs Finder";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Import Results", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, showGridLines: true }],
    properties: { defaultRowHeight: 22 },
  });

  worksheet.columns = IMPORT_RESULT_REPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style Header Row
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
      fgColor: { argb: "FF1E293B" }, // Slate 800
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0F172A" } },
      bottom: { style: "medium", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FF0F172A" } },
      right: { style: "thin", color: { argb: "FF0F172A" } },
    };
  });

  // Combine rows sorted by row number
  const allRows: {
    rowNumber: number;
    jobTitle: string;
    status: "Created" | "Skipped" | "Failed";
    reason: string;
    jobId: string;
  }[] = [];

  for (const item of result.created) {
    allRows.push({
      rowNumber: item.rowNumber,
      jobTitle: sanitizeFormulaText(item.jobTitle),
      status: "Created",
      reason: "Job created successfully as Draft.",
      jobId: item.jobId || "—",
    });
  }

  for (const item of result.skipped) {
    allRows.push({
      rowNumber: item.rowNumber,
      jobTitle: sanitizeFormulaText(item.jobTitle),
      status: "Skipped",
      reason: sanitizeFormulaText(item.reason || "Skipped."),
      jobId: item.jobId || "—",
    });
  }

  for (const item of result.failed) {
    allRows.push({
      rowNumber: item.rowNumber,
      jobTitle: sanitizeFormulaText(item.jobTitle),
      status: "Failed",
      reason: sanitizeFormulaText(item.reason || "Unable to import job."),
      jobId: "—",
    });
  }

  allRows.sort((a, b) => a.rowNumber - b.rowNumber);

  for (const item of allRows) {
    const row = worksheet.addRow(item);
    row.height = 24;

    const isCreated = item.status === "Created";
    const isSkipped = item.status === "Skipped";
    const isFailed = item.status === "Failed";

    row.eachCell((cell, colNumber) => {
      const colDef = IMPORT_RESULT_REPORT_COLUMNS[colNumber - 1];
      cell.font = {
        name: "Calibri",
        size: 10,
        color: isCreated
          ? { argb: "FF166534" }
          : isSkipped
          ? { argb: "FF92400E" }
          : { argb: "FF991B1B" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: colDef?.align ?? "left",
        wrapText: colDef?.key === "reason",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: isCreated
          ? { argb: "FFF0FDF4" }
          : isSkipped
          ? { argb: "FFFEF3C7" }
          : { argb: "FFFEE2E2" },
      };
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
  const buffer = await workbook.xlsx.writeBuffer();
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
): ExcelJS.Workbook {
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
  const buffer = await workbook.xlsx.writeBuffer();
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

