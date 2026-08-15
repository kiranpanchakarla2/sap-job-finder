import * as XLSX from "xlsx";
import { BULK_JOB_TEMPLATE_COLUMNS } from "./excelTemplate";
import { BULK_UPLOAD_CONFIG } from "../constants";
import type { ExcelParseResult, RawParsedRow } from "../types/bulkUpload.types";


/**
 * Normalizes header string for comparison: trims whitespace, lowercases.
 */
export function normalizeHeaderName(header: string): string {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Maps known canonical headers to their canonical column definition keys.
 */
const EXPECTED_HEADER_MAP = new Map<string, (typeof BULK_JOB_TEMPLATE_COLUMNS)[number]>();
BULK_JOB_TEMPLATE_COLUMNS.forEach((col) => {
  EXPECTED_HEADER_MAP.set(normalizeHeaderName(col.header), col);
});

export const REQUIRED_HEADER_KEYS = BULK_JOB_TEMPLATE_COLUMNS.filter(
  (col) => col.required
).map((col) => col.header);

/**
 * Parses an Excel file (ArrayBuffer, Uint8Array, or Blob/File) using SheetJS (xlsx).
 * Validates template structure, headers, row limits, and ignores completely blank rows.
 */
export async function parseExcelWorkbook(
  input: ArrayBuffer | Uint8Array | Blob
): Promise<ExcelParseResult> {
  const fileErrors: string[] = [];
  const fileWarnings: string[] = [];
  const rows: RawParsedRow[] = [];
  const headersFound: string[] = [];

  let arrayBuffer: ArrayBuffer;
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    try {
      arrayBuffer = await input.arrayBuffer();
    } catch {
      return {
        success: false,
        fileErrors: ["We couldn't read this Excel file. Please check that it is a valid .xlsx file."],
        fileWarnings: [],
        rows: [],
        headersFound: [],
      };
    }
  } else if (input instanceof Uint8Array) {
    const uint = input as Uint8Array;
    arrayBuffer = uint.buffer.slice(
      uint.byteOffset,
      uint.byteOffset + uint.byteLength
    ) as ArrayBuffer;
  } else {
    arrayBuffer = input as ArrayBuffer;
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(arrayBuffer), {
      type: "array",
      cellDates: true,
      cellText: false,
      raw: true,
    });
  } catch {
    return {
      success: false,
      fileErrors: ["We couldn't read this Excel file. Please check that it is a valid .xlsx file."],
      fileWarnings: [],
      rows: [],
      headersFound: [],
    };
  }

  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    return {
      success: false,
      isEmptyFile: true,
      fileErrors: ["The uploaded spreadsheet is empty or has no readable sheets."],
      fileWarnings: [],
      rows: [],
      headersFound: [],
    };
  }

  // 1. Identify primary data worksheet (prefer "Job Openings" if present, else first sheet)
  const targetSheetName =
    workbook.SheetNames.find((s) => s.trim().toLowerCase() === "job openings") ||
    workbook.SheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet || !worksheet["!ref"]) {
    return {
      success: false,
      isEmptyFile: true,
      fileErrors: ["The uploaded Excel file does not contain any job records."],
      fileWarnings: [],
      rows: [],
      headersFound: [],
    };
  }

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  if (range.e.r < range.s.r) {
    return {
      success: false,
      isEmptyFile: true,
      fileErrors: ["The uploaded Excel file does not contain any job records."],
      fileWarnings: [],
      rows: [],
      headersFound: [],
    };
  }

  // 2. Extract & Validate Headers from Row 1 (range.s.r)
  const headerRowIndex = range.s.r; // 0-based index
  const headerColMap = new Map<number, { original: string; canonicalHeader: string; key: string }>();
  const seenHeaderNames = new Set<string>();
  const detectedCanonicalHeaders = new Set<string>();

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    const cell = worksheet[cellAddress];
    const rawVal = cell ? String(cell.v ?? "").trim() : "";

    if (!rawVal) {
      // Check if data exists below an empty header
      let hasDataBelow = false;
      for (let r = headerRowIndex + 1; r <= Math.min(range.e.r, headerRowIndex + 10); r++) {
        const subCell = worksheet[XLSX.utils.encode_cell({ r, c })];
        if (subCell?.v !== undefined && subCell?.v !== null && String(subCell.v).trim() !== "") {
          hasDataBelow = true;
          break;
        }
      }
      if (hasDataBelow) {
        fileErrors.push(`Empty column header found at column position ${c + 1}. Each column must have a header name.`);
      }
      continue;
    }

    headersFound.push(rawVal);
    const normalized = normalizeHeaderName(rawVal);

    if (seenHeaderNames.has(normalized)) {
      fileErrors.push(`Duplicate column found: "${rawVal}". Each column header must be unique.`);
      continue;
    }
    seenHeaderNames.add(normalized);

    const match = EXPECTED_HEADER_MAP.get(normalized);
    if (match) {
      headerColMap.set(c, {
        original: rawVal,
        canonicalHeader: match.header,
        key: match.key,
      });
      detectedCanonicalHeaders.add(match.header);
    } else {
      fileWarnings.push(`Unexpected column: "${rawVal}". This column is not part of the standard template.`);
      headerColMap.set(c, {
        original: rawVal,
        canonicalHeader: rawVal,
        key: rawVal,
      });
    }
  }

  if (headersFound.length === 0) {
    return {
      success: false,
      isEmptyFile: true,
      fileErrors: ["The uploaded Excel file does not contain any job records."],
      fileWarnings,
      rows: [],
      headersFound: [],
    };
  }

  // Check if template structure is fundamentally incompatible
  // If fewer than 3 canonical headers matched out of 19, or missing core headers (Job Title & SAP Module), it's unsupported
  const matchedCanonicalCount = detectedCanonicalHeaders.size;
  const isFundamentalMismatch =
    matchedCanonicalCount < 3 ||
    (!detectedCanonicalHeaders.has("Job Title") && !detectedCanonicalHeaders.has("SAP Module"));

  if (isFundamentalMismatch) {
    return {
      success: false,
      isUnsupportedTemplate: true,
      fileErrors: [
        "This file does not match the current SAP Jobs Finder bulk upload template. Please download the latest template and try again.",
      ],
      fileWarnings,
      rows: [],
      headersFound,
    };
  }

  // Check required headers
  for (const requiredHeader of REQUIRED_HEADER_KEYS) {
    if (!detectedCanonicalHeaders.has(requiredHeader)) {
      fileErrors.push(`Missing required column: "${requiredHeader}".`);
    }
  }

  // If there are blocking header errors, return early without processing rows
  if (fileErrors.length > 0) {
    return {
      success: false,
      fileErrors,
      fileWarnings,
      rows: [],
      headersFound,
    };
  }

  // 3. Process Data Rows (preserving 1-based Excel row numbers)
  for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
    const excelRowNumber = r + 1; // 1-based index (e.g. 2 for second row in Excel)
    const rawValues: Record<string, unknown> = {};
    let isRowCompletelyEmpty = true;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const colInfo = headerColMap.get(c);
      if (!colInfo) continue;

      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      const val = cell?.v;

      if (val !== undefined && val !== null && String(val).trim() !== "") {
        isRowCompletelyEmpty = false;
        rawValues[colInfo.canonicalHeader] = val;
        // Also map by column key for flexible programmatic lookup
        rawValues[colInfo.key] = val;
      } else {
        rawValues[colInfo.canonicalHeader] = "";
        rawValues[colInfo.key] = "";
      }
    }

    // Ignore completely empty rows (blank trailing rows or blank gap rows)
    if (isRowCompletelyEmpty) {
      continue;
    }

    rows.push({
      rowNumber: excelRowNumber,
      rawValues,
    });
  }

  // 4. Validate Row Counts & Limits
  if (rows.length === 0) {
    return {
      success: false,
      isEmptyFile: true,
      fileErrors: ["The uploaded Excel file does not contain any job records."],
      fileWarnings,
      rows: [],
      headersFound,
    };
  }

  if (rows.length > BULK_UPLOAD_CONFIG.maxRows) {
    return {
      success: false,
      isExceedsMaxRows: true,
      fileErrors: [
        `This file contains ${rows.length.toLocaleString()} job rows. The maximum allowed is ${BULK_UPLOAD_CONFIG.maxRows.toLocaleString()}.`,
      ],
      fileWarnings,
      rows: [],
      headersFound,
    };
  }

  return {
    success: true,
    fileErrors: [],
    fileWarnings,
    rows,
    headersFound,
  };
}
