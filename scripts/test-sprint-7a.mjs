import assert from "node:assert";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log("=== Running Sprint 7A Test Suite ===\n");

  // 1. Check Routes
  const { EMPLOYER_JOB_ROUTES, BULK_UPLOAD_MAX_FILE_SIZE_BYTES, ALLOWED_EXCEL_EXTENSIONS } =
    await import("../src/features/employer-jobs/constants.ts");
  
  assert.strictEqual(
    EMPLOYER_JOB_ROUTES.bulkUpload,
    "/employer/jobs/bulk-upload",
    "EMPLOYER_JOB_ROUTES.bulkUpload must match '/employer/jobs/bulk-upload'"
  );
  assert.strictEqual(
    BULK_UPLOAD_MAX_FILE_SIZE_BYTES,
    10 * 1024 * 1024,
    "Max file size must be 10 MB (10485760 bytes)"
  );
  assert.deepStrictEqual(
    ALLOWED_EXCEL_EXTENSIONS,
    [".xlsx", ".xls"],
    "Allowed extensions must be ['.xlsx', '.xls']"
  );
  console.log("[PASS] Route & Constants Validation");

  // 2. Check Permissions
  const { canBulkUploadJobs } = await import(
    "../src/lib/auth/employerPermissions.ts"
  );
  assert.strictEqual(canBulkUploadJobs("owner"), true, "owner should be permitted");
  assert.strictEqual(canBulkUploadJobs("admin"), true, "admin should be permitted");
  assert.strictEqual(canBulkUploadJobs("recruiter"), true, "recruiter should be permitted");
  assert.strictEqual(canBulkUploadJobs("hiring_manager"), false, "hiring_manager should not be permitted by default");
  assert.strictEqual(canBulkUploadJobs(null), false, "null should not be permitted");
  assert.strictEqual(canBulkUploadJobs(undefined), false, "undefined should not be permitted");
  console.log("[PASS] Permission Helper Verification");

  // 3. Check Template Generation in Memory
  const {
    BULK_JOB_TEMPLATE_COLUMNS,
    BULK_JOB_TEMPLATE_FILENAME,
    createBulkJobTemplateWorkbook,
    generateBulkJobTemplateBuffer,
  } = await import("../src/features/employer-jobs/lib/excelTemplate.ts");

  assert.strictEqual(
    BULK_JOB_TEMPLATE_FILENAME,
    "SAP_Jobs_Finder_Bulk_Job_Template.xlsx"
  );
  assert.strictEqual(BULK_JOB_TEMPLATE_COLUMNS.length, 19, "Must have exactly 19 columns");

  const expectedHeaders = [
    "Job Title",
    "Job Description",
    "SAP Module",
    "Job Type",
    "Employment Type",
    "Experience Min",
    "Experience Max",
    "Location",
    "Work Mode",
    "Country",
    "Skills",
    "Salary Min",
    "Salary Max",
    "Currency",
    "Notice Period",
    "Education",
    "Number of Openings",
    "Application Deadline",
    "Contact Email",
  ];

  for (let i = 0; i < expectedHeaders.length; i++) {
    assert.strictEqual(
      BULK_JOB_TEMPLATE_COLUMNS[i].header,
      expectedHeaders[i],
      `Column ${i + 1} mismatch: expected ${expectedHeaders[i]}`
    );
  }

  const forbiddenHeaders = [
    "Company ID",
    "Employer ID",
    "User ID",
    "Created By",
    "Company Name",
    "Organization ID",
    "Owner ID",
  ];

  for (const forbidden of forbiddenHeaders) {
    const found = BULK_JOB_TEMPLATE_COLUMNS.some(
      (c) => c.header.toLowerCase() === forbidden.toLowerCase()
    );
    assert.strictEqual(found, false, `Forbidden header ${forbidden} found in columns!`);
  }

  const buffer = await generateBulkJobTemplateBuffer();
  assert(buffer.byteLength > 0, "Buffer must not be empty");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet("Job Openings");
  assert(worksheet, "Worksheet 'Job Openings' must exist");

  const row1Headers = [];
  worksheet.getRow(1).eachCell((cell) => row1Headers.push(String(cell.value).trim()));
  assert.deepStrictEqual(row1Headers, expectedHeaders, "Row 1 headers mismatch");

  // Check example row
  const row2 = worksheet.getRow(2);
  assert.strictEqual(row2.getCell(1).value, "SAP MM Consultant");
  assert.strictEqual(row2.getCell(3).value, "MM");
  assert.strictEqual(row2.getCell(4).value, "Permanent");
  assert.strictEqual(row2.getCell(5).value, "Full-time");
  assert.strictEqual(Number(row2.getCell(6).value), 4);
  assert.strictEqual(Number(row2.getCell(7).value), 8);
  assert.strictEqual(row2.getCell(8).value, "Hyderabad");
  assert.strictEqual(row2.getCell(9).value, "Hybrid");
  assert.strictEqual(row2.getCell(10).value, "India");
  assert.strictEqual(
    row2.getCell(11).value,
    "SAP MM, S/4HANA, Procurement, Inventory Management"
  );
  assert.strictEqual(Number(row2.getCell(12).value), 1200000);
  assert.strictEqual(Number(row2.getCell(13).value), 1800000);
  assert.strictEqual(row2.getCell(14).value, "INR");
  assert.strictEqual(row2.getCell(15).value, "30 Days");
  assert.strictEqual(row2.getCell(16).value, "Bachelor's Degree");
  assert.strictEqual(Number(row2.getCell(17).value), 2);
  assert.strictEqual(row2.getCell(18).value, "2026-09-30");
  assert.strictEqual(row2.getCell(19).value, "careers@example.com");

  console.log("[PASS] In-Memory Template Workbook & Buffer Generation");

  // 4. Client-side File Validation Logic Simulation
  function validateTestFile(fileName, fileSize) {
    const lower = fileName.toLowerCase();
    const validExt = ALLOWED_EXCEL_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!validExt) {
      return { valid: false, error: "Unsupported file format. Please upload an XLS or XLSX file." };
    }
    if (fileSize > BULK_UPLOAD_MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: "This file is larger than 10 MB. Please upload a smaller Excel file." };
    }
    return { valid: true };
  }

  // Accepted cases
  assert.strictEqual(validateTestFile("jobs.xlsx", 500000).valid, true);
  assert.strictEqual(validateTestFile("JOBS_2026.XLSX", 1024).valid, true);
  assert.strictEqual(validateTestFile("openings.xls", 2048000).valid, true);
  assert.strictEqual(validateTestFile("sap_positions.XLS", 10 * 1024 * 1024).valid, true);

  // Rejected cases
  assert.strictEqual(validateTestFile("data.csv", 1000).valid, false);
  assert.strictEqual(validateTestFile("document.pdf", 1000).valid, false);
  assert.strictEqual(validateTestFile("job_spec.docx", 1000).valid, false);
  assert.strictEqual(validateTestFile("job_spec.doc", 1000).valid, false);
  assert.strictEqual(validateTestFile("screenshot.png", 1000).valid, false);
  assert.strictEqual(validateTestFile("installer.exe", 1000).valid, false);
  assert.strictEqual(validateTestFile("unknown", 1000).valid, false);
  assert.strictEqual(validateTestFile("large_jobs.xlsx", 10 * 1024 * 1024 + 1).valid, false);
  assert.strictEqual(
    validateTestFile("large_jobs.xlsx", 15 * 1024 * 1024).error,
    "This file is larger than 10 MB. Please upload a smaller Excel file."
  );

  console.log("[PASS] File Extension & Size Validation Logic");

  console.log("\n>>> ALL SPRINT 7A TESTS PASSED SUCCESSFULLY! <<<\n");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
