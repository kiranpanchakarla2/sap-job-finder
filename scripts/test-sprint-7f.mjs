/**
 * Sprint 7F Comprehensive Production Hardening & QA Test Suite
 * Validates all 70 items: configuration, template versioning, instructions sheet,
 * parser edge cases, row & size limits, field length & numeric bounds, future deadline checks,
 * formula injection sanitization, database RPC hardening, company isolation,
 * recruiter permissions, count invariants, history immutability, performance, and full E2E flow.
 */

import dns from "node:dns";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

import {
  BULK_UPLOAD_CONFIG,
  BULK_UPLOAD_MAX_FILE_SIZE_BYTES,
  BULK_UPLOAD_MAX_FILE_SIZE_LABEL,
  BULK_UPLOAD_MAX_ROWS,
  ALLOWED_EXCEL_EXTENSIONS,
  SAP_MODULE_OPTIONS,
  JOB_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
  CURRENCY_OPTIONS,
} from "../src/features/employer-jobs/constants.ts";

import {
  createBulkJobTemplateWorkbook,
  BULK_JOB_TEMPLATE_VERSION,
  BULK_JOB_TEMPLATE_COLUMNS,
} from "../src/features/employer-jobs/lib/excelTemplate.ts";

import {
  parseExcelWorkbook,
  normalizeHeaderName,
} from "../src/features/employer-jobs/lib/excelParser.ts";

import {
  validateBulkJobRow,
  validateBulkJobRows,
  normalizeSapModule,
  normalizeJobType,
  normalizeEmploymentType,
  normalizeWorkMode,
  normalizeCountry,
  normalizeCurrency,
  parseAndDeduplicateSkills,
  parseExcelDate,
} from "../src/features/employer-jobs/lib/bulkJobValidator.ts";

import {
  sanitizeFormulaText,
  extractErrorReportRows,
  createBulkJobErrorReportWorkbook,
  createBulkImportResultWorkbook,
} from "../src/features/employer-jobs/lib/bulkErrorReport.ts";

dns.setDefaultResultOrder("ipv4first");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function projectRefFromPublicUrl() {
  const publicUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "https://jhoaaijrwigvuxhtoadx.supabase.co";
  return new URL(publicUrl).hostname.split(".")[0];
}

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = projectRefFromPublicUrl();
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

let passed = 0;
let failed = 0;

function report(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function main() {
  console.log("==================================================================");
  console.log("   SPRINT 7F: BULK JOB UPLOAD PRODUCTION HARDENING & QA SUITE     ");
  console.log("==================================================================\n");

  // =========================================================================
  // SECTION 1: CENTRALIZED CONFIGURATION & CONSTANTS
  // =========================================================================
  console.log("--- 1. Centralized Configuration (BULK_UPLOAD_CONFIG) ---");
  report(BULK_UPLOAD_CONFIG.templateVersion === "1.0", "Template version is '1.0'");
  report(BULK_UPLOAD_CONFIG.maxFileSizeBytes === 10 * 1024 * 1024, "Max file size is exactly 10 MB (10,485,760 bytes)");
  report(BULK_UPLOAD_CONFIG.maxFileSizeLabel === "10 MB", "Max file size label is '10 MB'");
  report(BULK_UPLOAD_CONFIG.maxRows === 1000, "Max rows per import is exactly 1,000");
  report(BULK_UPLOAD_CONFIG.allowedExtensions.includes(".xlsx"), "Allowed extensions includes .xlsx");
  report(BULK_UPLOAD_CONFIG.fieldLimits.title === 200, "Title length limit is 200 chars");
  report(BULK_UPLOAD_CONFIG.fieldLimits.description === 10000, "Description length limit is 10,000 chars");
  report(BULK_UPLOAD_CONFIG.fieldLimits.location === 200, "Location length limit is 200 chars");
  report(BULK_UPLOAD_CONFIG.fieldLimits.maxExperience === 50, "Max experience bound is 50 years");

  // =========================================================================
  // SECTION 2: TEMPLATE GENERATOR & INSTRUCTIONS SHEET
  // =========================================================================
  console.log("\n--- 2. Template Generator & Instructions Worksheet ---");
  const templateWorkbook = createBulkJobTemplateWorkbook();
  report(templateWorkbook.worksheets.length === 2, "Template workbook contains exactly 2 worksheets");
  
  const sheet1 = templateWorkbook.getWorksheet("Job Openings");
  const sheet2 = templateWorkbook.getWorksheet("Instructions");
  report(sheet1 !== undefined, "Sheet 1 'Job Openings' is present");
  report(sheet2 !== undefined, "Sheet 2 'Instructions' is present");
  report(sheet1.columns.length === 19, "Job Openings sheet contains 19 standard columns");
  report(templateWorkbook.subject?.includes("1.0"), "Template workbook subject contains version 1.0 metadata");

  const instRows = [];
  sheet2.eachRow((r, num) => {
    if (num > 1) instRows.push(r.values);
  });
  report(instRows.length >= 10, `Instructions sheet contains ${instRows.length} guideline rows`);

  // =========================================================================
  // SECTION 3: EXCEL PARSER EDGE CASES & HARDENING
  // =========================================================================
  console.log("\n--- 3. Excel Parser Hardening & Structural Validation ---");
  
  // 3A. Parse official template workbook buffer
  const templateBuffer = await templateWorkbook.xlsx.writeBuffer();
  const parsedTemplate = await parseExcelWorkbook(templateBuffer);
  report(parsedTemplate.success === true, "Parser successfully reads generated 2-sheet template");
  report(parsedTemplate.rows.length === 1, "Template example row parsed successfully as row 1");
  report(parsedTemplate.rows[0].rowNumber === 2, "Example data row correctly assigned Excel row 2");

  // 3B. Unsupported Template Detection (Completely incompatible headers)
  const invalidWb = XLSX.utils.book_new();
  const invalidWs = XLSX.utils.aoa_to_sheet([
    ["First Name", "Last Name", "Email Address", "Department"],
    ["John", "Doe", "john@example.com", "Sales"],
  ]);
  XLSX.utils.book_append_sheet(invalidWb, invalidWs, "Employees");
  const invalidBuffer = XLSX.write(invalidWb, { type: "array", bookType: "xlsx" });
  const parsedInvalid = await parseExcelWorkbook(invalidBuffer);
  report(parsedInvalid.success === false, "Incompatible spreadsheet rejected");
  report(parsedInvalid.isUnsupportedTemplate === true, "Parser flags isUnsupportedTemplate: true");
  report(
    parsedInvalid.fileErrors[0].includes("This file does not match the current SAP Jobs Finder bulk upload template"),
    "Returns exact unsupported template error message"
  );

  // 3C. Empty File Detection
  const emptyWb = XLSX.utils.book_new();
  const emptyWs = XLSX.utils.aoa_to_sheet([
    BULK_JOB_TEMPLATE_COLUMNS.map((c) => c.header),
  ]);
  XLSX.utils.book_append_sheet(emptyWb, emptyWs, "Job Openings");
  const emptyBuffer = XLSX.write(emptyWb, { type: "array", bookType: "xlsx" });
  const parsedEmpty = await parseExcelWorkbook(emptyBuffer);
  report(parsedEmpty.success === false, "Empty spreadsheet (headers only) rejected");
  report(parsedEmpty.isEmptyFile === true, "Parser flags isEmptyFile: true");
  report(parsedEmpty.fileErrors[0] === "The uploaded Excel file does not contain any job records.", "Returns exact 'No jobs found' file error message");

  // 3D. 1,000 Row Limit Enforcement
  const largeRows = [BULK_JOB_TEMPLATE_COLUMNS.map((c) => c.header)];
  for (let i = 1; i <= 1001; i++) {
    largeRows.push([
      `SAP Job ${i}`, "Description", "MM", "Permanent", "Full-time",
      4, 8, "Hyderabad", "Hybrid", "India", "SAP MM", 1000000, 1500000, "INR",
      "30 Days", "Bachelors", 1, "2026-12-31", "careers@example.com"
    ]);
  }
  const largeWb = XLSX.utils.book_new();
  const largeWs = XLSX.utils.aoa_to_sheet(largeRows);
  XLSX.utils.book_append_sheet(largeWb, largeWs, "Job Openings");
  const largeBuffer = XLSX.write(largeWb, { type: "array", bookType: "xlsx" });
  const parsedLarge = await parseExcelWorkbook(largeBuffer);
  report(parsedLarge.success === false, "Spreadsheet with 1,001 rows rejected");
  report(parsedLarge.isExceedsMaxRows === true, "Parser flags isExceedsMaxRows: true");
  report(
    parsedLarge.fileErrors[0].includes("This file contains 1,001 job rows. The maximum allowed is 1,000."),
    "Returns exact max row limit exceeded message"
  );

  // 3E. Blank Row Skipping
  const gapRows = [
    BULK_JOB_TEMPLATE_COLUMNS.map((c) => c.header),
    ["Job 1", "Desc 1", "MM", "Permanent", "Full-time", 3, 6, "Mumbai", "On-site", "India", "SAP MM", "", "", "", "", "", 1, "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], // Blank row 3
    ["Job 2", "Desc 2", "FICO", "Permanent", "Full-time", 5, 10, "Bengaluru", "Remote", "India", "SAP FICO", "", "", "", "", "", 2, "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], // Trailing blank row 5
  ];
  const gapWb = XLSX.utils.book_new();
  const gapWs = XLSX.utils.aoa_to_sheet(gapRows);
  XLSX.utils.book_append_sheet(gapWb, gapWs, "Job Openings");
  const gapBuffer = XLSX.write(gapWb, { type: "array", bookType: "xlsx" });
  const parsedGap = await parseExcelWorkbook(gapBuffer);
  report(parsedGap.success === true && parsedGap.rows.length === 2, "Genuinely blank rows are skipped (2 valid rows found)");
  report(parsedGap.rows[0].rowNumber === 2 && parsedGap.rows[1].rowNumber === 4, "Accurate 1-based Excel row numbers preserved (row 2 and row 4)");

  // =========================================================================
  // SECTION 4: FIELD VALIDATION & LOGIC HARDENING
  // =========================================================================
  console.log("\n--- 4. Comprehensive Field Validation & Constraint Checks ---");

  // 4A. Field Length Bounds
  const longTitleRow = {
    rowNumber: 2,
    rawValues: {
      "Job Title": "A".repeat(201),
      "Job Description": "Valid Description",
      "SAP Module": "MM",
      "Job Type": "Permanent",
      "Employment Type": "Full-time",
      "Experience Min": 3,
      "Experience Max": 6,
      "Location": "Hyderabad",
      "Work Mode": "Hybrid",
      "Country": "India",
      "Skills": "SAP MM",
      "Number of Openings": 1,
    }
  };
  const valLongTitle = validateBulkJobRow(longTitleRow, new Map());
  report(valLongTitle.status === "error" && valLongTitle.errors.some((e) => e.message.includes("200 characters")), "Rejects Job Title exceeding 200 characters");

  const longDescRow = {
    rowNumber: 3,
    rawValues: {
      ...longTitleRow.rawValues,
      "Job Title": "Valid Title",
      "Job Description": "D".repeat(10001),
    }
  };
  const valLongDesc = validateBulkJobRow(longDescRow, new Map());
  report(valLongDesc.status === "error" && valLongDesc.errors.some((e) => e.message.includes("10,000 characters")), "Rejects Job Description exceeding 10,000 characters");

  // 4B. Numeric & Experience Bounds
  const invalidExpRow = {
    rowNumber: 4,
    rawValues: {
      ...longTitleRow.rawValues,
      "Job Title": "Senior Consultant",
      "Job Description": "Valid Description",
      "Experience Min": 10,
      "Experience Max": 5, // Max < Min
    }
  };
  const valInvalidExp = validateBulkJobRow(invalidExpRow, new Map());
  report(valInvalidExp.status === "error" && valInvalidExp.errors.some((e) => e.message.includes("greater than or equal to Experience Min")), "Rejects Experience Max < Experience Min");

  const excessiveExpRow = {
    rowNumber: 5,
    rawValues: {
      ...longTitleRow.rawValues,
      "Job Title": "Veteran Architect",
      "Experience Min": 60, // > 50
      "Experience Max": 70,
    }
  };
  const valExcessiveExp = validateBulkJobRow(excessiveExpRow, new Map());
  report(valExcessiveExp.status === "error" && valExcessiveExp.errors.some((e) => e.message.includes("between 0 and 50")), "Rejects Experience exceeding 50 years");

  // 4C. Past Application Deadline Rejection
  const pastDeadlineRow = {
    rowNumber: 6,
    rawValues: {
      ...longTitleRow.rawValues,
      "Job Title": "Expired Job",
      "Application Deadline": "2020-01-01",
    }
  };
  const valPastDeadline = validateBulkJobRow(pastDeadlineRow, new Map());
  report(valPastDeadline.status === "error" && valPastDeadline.errors.some((e) => e.message.includes("cannot be in the past")), "Rejects Application Deadline in the past");

  // 4D. Future Application Deadline Acceptance
  const futureDeadlineRow = {
    rowNumber: 7,
    rawValues: {
      ...longTitleRow.rawValues,
      "Job Title": "Active Job",
      "Application Deadline": "2026-12-31",
    }
  };
  const valFutureDeadline = validateBulkJobRow(futureDeadlineRow, new Map());
  report(valFutureDeadline.status === "valid" && valFutureDeadline.data.deadline === "2026-12-31", "Accepts valid future Application Deadline (2026-12-31)");

  // 4E. Openings Integer Validation
  const invalidOpeningsRow = {
    rowNumber: 8,
    rawValues: {
      ...longTitleRow.rawValues,
      "Job Title": "Openings Test",
      "Number of Openings": 0,
    }
  };
  const valInvalidOpenings = validateBulkJobRow(invalidOpeningsRow, new Map());
  report(valInvalidOpenings.status === "error" && valInvalidOpenings.errors.some((e) => e.message.includes("greater than zero")), "Rejects non-positive Number of Openings");

  // 4F. SAP Module Canonical Matching
  report(normalizeSapModule("MM") === "SAP MM", "Normalizes 'MM' to 'SAP MM'");
  report(normalizeSapModule("SAP FICO") === "SAP FICO", "Normalizes 'SAP FICO' to 'SAP FICO'");
  report(normalizeSapModule("s4hana") === "SAP S/4HANA", "Normalizes 's4hana' to 'SAP S/4HANA'");
  report(normalizeSapModule("abap") === "SAP ABAP", "Normalizes 'abap' to 'SAP ABAP'");
  report(normalizeSapModule("INVALID_NON_SAP_MODULE") === null, "Rejects unlisted SAP module");

  // =========================================================================
  // SECTION 5: FORMULA INJECTION PREVENTION (CSV/XLSX)
  // =========================================================================
  console.log("\n--- 5. Formula Injection Sanitization ---");
  report(sanitizeFormulaText("=SUM(A1:A10)") === "'=SUM(A1:A10)", "Sanitizes formula starting with '='");
  report(sanitizeFormulaText("+1234567890") === "'+1234567890", "Sanitizes string starting with '+'");
  report(sanitizeFormulaText("-cmd|' /C calc'!A0") === "'-cmd|' /C calc'!A0", "Sanitizes command string starting with '-'");
  report(sanitizeFormulaText("@SUM(1,2)") === "'@SUM(1,2)", "Sanitizes formula starting with '@'");
  report(sanitizeFormulaText("Normal Job Title") === "Normal Job Title", "Leaves benign text untouched");

  const maliciousRow = {
    rowNumber: 9,
    status: "error",
    data: {
      title: "=CMD|' /C calc'!A0",
      sapModule: "=1+1",
      location: "+New York",
      skills: ["SAP MM"],
      minExperience: 3,
      maxExperience: 6,
      openings: 1,
    },
    raw: {
      "Job Title": "=CMD|' /C calc'!A0",
      "SAP Module": "=1+1",
      "Location": "+New York",
    },
    errors: [{ field: "=TitleField", message: "+ErrorMessage" }],
    warnings: [],
  };
  const extracted = extractErrorReportRows([maliciousRow]);
  report(extracted[0].jobTitle === "'=CMD|' /C calc'!A0", "ErrorReport sanitizes jobTitle cell value");
  report(extracted[0].field === "'=TitleField", "ErrorReport sanitizes field name cell value");
  report(extracted[0].message === "'+ErrorMessage", "ErrorReport sanitizes message cell value");

  // =========================================================================
  // SECTION 6: DATABASE RPC & SECURITY INTEGRATION TESTS
  // =========================================================================
  console.log("\n--- 6. Database RPC & Security Verification ---");
  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  try {
    // 6A. Apply Sprint 7F Hardening Migration
    const migrationSql = fs.readFileSync(
      path.join(rootDir, "supabase", "migrations", "20260816140000_bulk_upload_hardening.sql"),
      "utf8"
    );
    await pgClient.query(migrationSql);
    report(true, "Applied migration 20260816140000_bulk_upload_hardening.sql successfully");

    // Setup Test Companies and Employers
    const suffix = Date.now().toString().slice(-6);
    const ownerUserId = crypto.randomUUID();
    const recruiterUserId = crypto.randomUUID();
    const otherCompanyOwnerId = crypto.randomUUID();

    // Ensure Auth Users Exist
    for (const uid of [ownerUserId, recruiterUserId, otherCompanyOwnerId]) {
      await pgClient.query(`
        insert into auth.users (id, email, raw_user_meta_data, role, aud)
        values ($1, $2, '{"role":"employer"}'::jsonb, 'authenticated', 'authenticated')
        on conflict (id) do nothing;
      `, [uid, `test-${uid}@example.com`]);
    }

    // Clean old accounts for test users
    await pgClient.query(
      `delete from public.employer_accounts where user_id = any($1::uuid[]);`,
      [[ownerUserId, recruiterUserId, otherCompanyOwnerId]]
    );

    // Company A
    const compARes = await pgClient.query(`
      insert into public.company_profiles (company_name, user_id, setup_complete)
      values ($1, $2, true)
      on conflict (user_id) do update set company_name = EXCLUDED.company_name
      returning id;
    `, [`Company 7F-A ${suffix}`, ownerUserId]);
    const companyAId = compARes.rows[0].id;

    await pgClient.query(`
      insert into public.employer_profiles (user_id, company_name)
      values ($1, $2)
      on conflict (user_id) do update set company_name = EXCLUDED.company_name;
    `, [ownerUserId, `Company 7F-A ${suffix}`]);

    await pgClient.query(`
      insert into public.employer_accounts (user_id, company_id, role, can_bulk_upload, status)
      values ($1, $2, 'owner', true, 'active');
    `, [ownerUserId, companyAId]);

    // Recruiter in Company A
    await pgClient.query(`
      insert into public.employer_profiles (user_id, company_name)
      values ($1, $2)
      on conflict (user_id) do update set company_name = EXCLUDED.company_name;
    `, [recruiterUserId, `Company 7F-A ${suffix}`]);

    await pgClient.query(`
      insert into public.employer_accounts (user_id, company_id, role, can_bulk_upload, status)
      values ($1, $2, 'recruiter', true, 'active');
    `, [recruiterUserId, companyAId]);

    // Company B (for isolation testing)
    const compBRes = await pgClient.query(`
      insert into public.company_profiles (company_name, user_id, setup_complete)
      values ($1, $2, true)
      on conflict (user_id) do update set company_name = EXCLUDED.company_name
      returning id;
    `, [`Company 7F-B ${suffix}`, otherCompanyOwnerId]);
    const companyBId = compBRes.rows[0].id;

    await pgClient.query(`
      insert into public.employer_profiles (user_id, company_name)
      values ($1, $2)
      on conflict (user_id) do update set company_name = EXCLUDED.company_name;
    `, [otherCompanyOwnerId, `Company 7F-B ${suffix}`]);

    await pgClient.query(`
      insert into public.employer_accounts (user_id, company_id, role, can_bulk_upload, status)
      values ($1, $2, 'owner', true, 'active');
    `, [otherCompanyOwnerId, companyBId]);

    async function asUser(userId) {
      await pgClient.query(`set role authenticated;`);
      await pgClient.query(`set request.jwt.claims to '{"sub": "${userId}", "role": "authenticated", "user_metadata": {"role": "employer"}}';`);
    }

    async function asAdmin() {
      await pgClient.query(`set role postgres;`);
      await pgClient.query(`reset request.jwt.claims;`);
    }

    // 6B. Test Bulk Import Execution as Company A Owner
    await asUser(ownerUserId);
    const validBatchJobs = [
      {
        rowNumber: 2,
        title: `SAP MM Lead ${suffix}`,
        description: "Leading SAP MM implementations across client landscapes.",
        sapModule: "SAP MM",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 6,
        maxExperience: 10,
        location: "Hyderabad",
        workMode: "Hybrid",
        country: "India",
        skills: ["SAP MM", "S/4HANA", "Purchasing"],
        minSalary: 1800000,
        maxSalary: 2400000,
        currency: "INR",
        noticePeriod: "30 Days",
        education: "B.Tech",
        openings: 2,
        deadline: "2026-11-30",
        contactEmail: "careers@comp-a.com"
      },
      {
        rowNumber: 3,
        title: `SAP FICO Specialist ${suffix}`,
        description: "Financial accounting and controlling integration expert.",
        sapModule: "SAP FICO",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 4,
        maxExperience: 8,
        location: "Bengaluru",
        workMode: "Remote",
        country: "India",
        skills: ["SAP FICO", "General Ledger", "Asset Accounting"],
        minSalary: 1400000,
        maxSalary: 2000000,
        currency: "INR",
        openings: 1,
        deadline: "2026-12-15",
      }
    ];

    const importResA = await pgClient.query(`
      select public.bulk_import_jobs($1, $2) as result;
    `, [JSON.stringify(validBatchJobs), JSON.stringify({ fileName: "BatchA.xlsx", fileSize: 50000, totalRows: 2 })]);

    const resA = importResA.rows[0].result;
    report(resA.created.length === 2, "Bulk import created exactly 2 draft jobs for Company A");
    report(resA.status === "completed", "Import session status resolved to 'completed'");
    report(resA.importId !== null, "Created bulk_imports history record with UUID");

    // 6C. Verify Database Count Invariant
    const countCheck = await pgClient.query(`
      select total_rows, selected_rows, created_count, skipped_count, failed_count, status
      from public.bulk_imports
      where id = $1;
    `, [resA.importId]);
    const rowStats = countCheck.rows[0];
    report(
      rowStats.created_count + rowStats.skipped_count + rowStats.failed_count === rowStats.selected_rows,
      `Count Invariant holds: created (${rowStats.created_count}) + skipped (${rowStats.skipped_count}) + failed (${rowStats.failed_count}) = selected (${rowStats.selected_rows})`
    );

    // 6D. Verify Idempotency & Database Duplicate Detection
    const duplicateRes = await pgClient.query(`
      select public.bulk_import_jobs($1, $2) as result;
    `, [JSON.stringify(validBatchJobs), JSON.stringify({ fileName: "BatchA_Retry.xlsx", totalRows: 2 })]);
    const resDup = duplicateRes.rows[0].result;
    report(resDup.created.length === 0, "Repeated submission did not create duplicate jobs");
    report(resDup.skipped.length === 2, "Repeated jobs were skipped as existing database duplicates");
    report(resDup.skipped[0].reason.includes("duplicate"), "Skip reason indicates duplicate of existing job");

    // 6E. Recruiter Permission Check (Forbidden when can_bulk_upload = false)
    await asAdmin();
    await pgClient.query(`
      update public.employer_accounts
      set can_bulk_upload = false
      where user_id = $1 and company_id = $2;
    `, [recruiterUserId, companyAId]);

    await asUser(recruiterUserId);
    let recruiterBlocked = false;
    try {
      await pgClient.query(`
        select public.bulk_import_jobs($1, $2);
      `, [JSON.stringify(validBatchJobs), JSON.stringify({ fileName: "RecruiterTest.xlsx" })]);
    } catch (err) {
      recruiterBlocked = err.message.includes("FORBIDDEN_BULK_UPLOAD_PERMISSION_DENIED");
    }
    report(recruiterBlocked, "Recruiter blocked when can_bulk_upload is false");

    // Re-enable recruiter bulk upload permission
    await asAdmin();
    await pgClient.query(`
      update public.employer_accounts
      set can_bulk_upload = true
      where user_id = $1 and company_id = $2;
    `, [recruiterUserId, companyAId]);

    await asUser(recruiterUserId);
    let recruiterAllowed = false;
    try {
      const recImport = await pgClient.query(`
        select public.bulk_import_jobs($1, $2) as result;
      `, [JSON.stringify([
        {
          rowNumber: 2,
          title: `SAP SD Consultant ${suffix}`,
          description: "Order-to-cash process consulting and implementation.",
          sapModule: "SAP SD",
          jobType: "Contract",
          employmentType: "Full-time",
          minExperience: 5,
          maxExperience: 9,
          location: "Hyderabad",
          workMode: "Hybrid",
          country: "India",
          skills: ["SAP SD", "Pricing"],
          openings: 1,
        }
      ]), JSON.stringify({ fileName: "RecruiterAllowed.xlsx" })]);
      recruiterAllowed = recImport.rows[0].result.created.length === 1;
    } catch (e) {
      console.error(e);
    }
    report(recruiterAllowed, "Recruiter successfully imports jobs when can_bulk_upload is true");

    // 6F. Company Isolation Check: Company B cannot see Company A's history or rows
    await asUser(otherCompanyOwnerId);
    const companyBHistory = await pgClient.query(`
      select * from public.bulk_imports where company_id = $1;
    `, [companyAId]);
    report(companyBHistory.rows.length === 0, "Company B cannot access Company A's bulk_imports via RLS");

    const companyBRows = await pgClient.query(`
      select * from public.bulk_import_rows where bulk_import_id = $1;
    `, [resA.importId]);
    report(companyBRows.rows.length === 0, "Company B cannot access Company A's bulk_import_rows via RLS");

    // 6G. History Immutability Check: Direct client INSERT/UPDATE on bulk_imports is blocked
    await asUser(ownerUserId);
    let updateBlocked = false;
    try {
      await pgClient.query(`
        update public.bulk_imports set created_count = 999 where id = $1;
      `, [resA.importId]);
    } catch {
      updateBlocked = true;
    }
    const checkImmutable = await pgClient.query(`
      select created_count from public.bulk_imports where id = $1;
    `, [resA.importId]);
    report(
      updateBlocked || checkImmutable.rows[0]?.created_count !== 999,
      "Direct client modification of bulk_imports table is prevented (managed via RPC only)"
    );

    // =========================================================================
    // SECTION 7: THROUGHPUT & PERFORMANCE BENCHMARK
    // =========================================================================
    console.log("\n--- 7. Throughput & Scalability Benchmark ---");
    
    // Benchmark 100 rows parsing & validation
    const t0 = performance.now();
    const test100Rows = [];
    for (let i = 1; i <= 100; i++) {
      test100Rows.push({
        rowNumber: i + 1,
        rawValues: {
          "Job Title": `SAP Performance Job ${i}`,
          "Job Description": "High performance automated validation test job description.",
          "SAP Module": "MM",
          "Job Type": "Permanent",
          "Employment Type": "Full-time",
          "Experience Min": 3,
          "Experience Max": 7,
          "Location": "Bengaluru",
          "Work Mode": "Hybrid",
          "Country": "India",
          "Skills": "SAP MM, S/4HANA",
          "Number of Openings": 1,
        }
      });
    }
    const valResult100 = validateBulkJobRows("Benchmark100.xlsx", 50000, test100Rows);
    const t1 = performance.now();
    const durationMs = Math.round(t1 - t0);
    report(valResult100.validCount === 100 && durationMs < 200, `Validated 100 rows in ${durationMs}ms (Well under 200ms budget)`);

    // =========================================================================
    // SECTION 8: CLEANUP
    // =========================================================================
    await asAdmin();
    await pgClient.query(`delete from public.bulk_import_rows where bulk_import_id in (select id from public.bulk_imports where company_id in ($1, $2));`, [companyAId, companyBId]);
    await pgClient.query(`delete from public.bulk_imports where company_id in ($1, $2);`, [companyAId, companyBId]);
    await pgClient.query(`delete from public.jobs where company_id in ($1, $2);`, [companyAId, companyBId]);
    await pgClient.query(`delete from public.employer_accounts where company_id in ($1, $2);`, [companyAId, companyBId]);
    await pgClient.query(`delete from public.employer_profiles where user_id in ($1, $2, $3);`, [ownerUserId, recruiterUserId, otherCompanyOwnerId]);
    await pgClient.query(`delete from public.company_profiles where id in ($1, $2);`, [companyAId, companyBId]);
    await pgClient.query(`delete from auth.users where id in ($1, $2, $3);`, [ownerUserId, recruiterUserId, otherCompanyOwnerId]);

  } finally {
    await pgClient.end();
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n==================================================================");
  console.log(`   SPRINT 7F QA TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED `);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
