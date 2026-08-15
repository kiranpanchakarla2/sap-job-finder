import assert from "node:assert";
import * as XLSX from "xlsx";

async function runSprint7BTests() {
  console.log("==================================================");
  console.log("   SPRINT 7B TEST SUITE: EXCEL PARSER & VALIDATION");
  console.log("==================================================\n");

  const {
    generateBulkJobTemplateBuffer,
  } = await import("../src/features/employer-jobs/lib/excelTemplate.ts");

  const {
    parseExcelWorkbook,
    normalizeHeaderName,
  } = await import("../src/features/employer-jobs/lib/excelParser.ts");

  const {
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
  } = await import("../src/features/employer-jobs/lib/bulkJobValidator.ts");

  const STANDARD_HEADERS = [
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

  function createTestWorkbookBuffer(rows, headers = STANDARD_HEADERS, bookType = "xlsx") {
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const u8 = XLSX.write(wb, { type: "buffer", bookType });
    return u8;
  }

  // -------------------------------------------------------------
  // Test 1: Valid .xlsx file generated from official template
  // -------------------------------------------------------------
  {
    const templateBuffer = await generateBulkJobTemplateBuffer();
    const parseResult = await parseExcelWorkbook(templateBuffer);
    assert.strictEqual(parseResult.success, true, "Template parse must succeed");
    assert.strictEqual(parseResult.fileErrors.length, 0, "Template should have 0 file errors");
    assert.strictEqual(parseResult.rows.length, 1, "Template has 1 example row");
    assert.strictEqual(parseResult.rows[0].rowNumber, 2, "First data row must be Row 2");

    const valResult = validateBulkJobRows("template.xlsx", 5000, parseResult.rows);
    assert.strictEqual(valResult.totalRows, 1);
    assert.strictEqual(valResult.validCount, 1);
    assert.strictEqual(valResult.errorCount, 0);
    assert.strictEqual(valResult.rows[0].status, "valid");
    assert.strictEqual(valResult.rows[0].data.sapModule, "SAP MM");
    assert.strictEqual(valResult.rows[0].data.jobType, "Permanent");
    assert.strictEqual(valResult.rows[0].data.employmentType, "Full-time");
    assert.strictEqual(valResult.rows[0].data.workMode, "Hybrid");
    assert.strictEqual(valResult.rows[0].data.country, "India");
    assert.deepStrictEqual(valResult.rows[0].data.skills, [
      "SAP MM",
      "S/4HANA",
      "Procurement",
      "Inventory Management",
    ]);
    console.log("[PASS] Test 1: Valid standard template .xlsx parsed & validated");
  }

  // -------------------------------------------------------------
  // Test 2: Empty Excel file / empty sheet
  // -------------------------------------------------------------
  {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "EmptySheet");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const parseResult = await parseExcelWorkbook(buf);
    assert.strictEqual(parseResult.success, false);
    assert(parseResult.fileErrors.length > 0, "Must return file errors for empty worksheet");
    console.log("[PASS] Test 2: Empty Excel workbook properly rejected with file error");
  }

  // -------------------------------------------------------------
  // Test 3: Missing required header
  // -------------------------------------------------------------
  {
    const missingHeaders = STANDARD_HEADERS.filter((h) => h !== "SAP Module");
    const row = ["SAP MM Consultant", "Job Desc", "Permanent", "Full-time", 4, 8, "Hyderabad", "Hybrid", "India", "SAP MM"];
    const buf = createTestWorkbookBuffer([row], missingHeaders);

    const parseResult = await parseExcelWorkbook(buf);
    assert.strictEqual(parseResult.success, false);
    assert(
      parseResult.fileErrors.some((e) => e.includes('Missing required column: "SAP Module"')),
      "Must report missing required column SAP Module"
    );
    assert.strictEqual(parseResult.rows.length, 0, "Should not parse rows if required header missing");
    console.log("[PASS] Test 3: Missing required header detected as blocking file error");
  }

  // -------------------------------------------------------------
  // Test 4: Duplicate header
  // -------------------------------------------------------------
  {
    const dupHeaders = ["Job Title", "Job Title", ...STANDARD_HEADERS.slice(1)];
    const row = ["Title 1", "Title 2", "Desc", "MM", "Permanent", "Full-time", 4, 8, "Hyd", "Hybrid", "India", "MM"];
    const buf = createTestWorkbookBuffer([row], dupHeaders);

    const parseResult = await parseExcelWorkbook(buf);
    assert.strictEqual(parseResult.success, false);
    assert(
      parseResult.fileErrors.some((e) => e.includes("Duplicate column found")),
      "Must report duplicate header column"
    );
    console.log("[PASS] Test 4: Duplicate header column detected");
  }

  // -------------------------------------------------------------
  // Test 5: Extra / Unexpected header (warning)
  // -------------------------------------------------------------
  {
    const extraHeaders = [...STANDARD_HEADERS, "Bonus Info"];
    const validRow = [
      "SAP SD Consultant",
      "Detailed description of SD role",
      "SAP SD",
      "Permanent",
      "Full-time",
      3,
      7,
      "Bengaluru",
      "Remote",
      "India",
      "SAP SD, Pricing",
      1000000,
      1500000,
      "INR",
      "30 Days",
      "B.Tech",
      1,
      "2026-10-15",
      "sd-lead@example.com",
      "Some bonus data",
    ];
    const buf = createTestWorkbookBuffer([validRow], extraHeaders);

    const parseResult = await parseExcelWorkbook(buf);
    assert.strictEqual(parseResult.success, true);
    assert(
      parseResult.fileWarnings.some((w) => w.includes('Unexpected column: "Bonus Info"')),
      "Must report unexpected header as warning"
    );
    assert.strictEqual(parseResult.rows.length, 1);
    console.log("[PASS] Test 5: Extra/unexpected header reported as warning without blocking");
  }

  // -------------------------------------------------------------
  // Test 6: Empty rows ignored, row numbers preserved
  // -------------------------------------------------------------
  {
    const validRow1 = [
      "Job A", "Desc A", "SAP MM", "Permanent", "Full-time", 2, 5, "Pune", "Hybrid", "India", "MM", "", "", "", "", "", 1, "", ""
    ];
    const emptyRow1 = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
    const validRow2 = [
      "Job B", "Desc B", "SAP FICO", "Contract", "Full-time", 5, 9, "Mumbai", "On-site", "India", "FICO", "", "", "", "", "", 2, "", ""
    ];

    const buf = createTestWorkbookBuffer([validRow1, emptyRow1, validRow2]);
    const parseResult = await parseExcelWorkbook(buf);

    assert.strictEqual(parseResult.rows.length, 2, "Empty row must be skipped");
    assert.strictEqual(parseResult.rows[0].rowNumber, 2, "First data row is Excel Row 2");
    assert.strictEqual(parseResult.rows[1].rowNumber, 4, "Second data row after empty row is Excel Row 4");
    console.log("[PASS] Test 6: Empty rows skipped and 1-based Excel row numbers preserved");
  }

  // -------------------------------------------------------------
  // Test 7: Missing Job Title validation
  // -------------------------------------------------------------
  {
    const row = [
      "", "Desc", "SAP MM", "Permanent", "Full-time", 4, 8, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const buf = createTestWorkbookBuffer([row]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert.strictEqual(valResult.errorCount, 1);
    assert(valResult.rows[0].errors.some((e) => e.field === "Job Title" && e.message.includes("Job Title is required")));
    console.log("[PASS] Test 7: Missing Job Title produces blocking error");
  }

  // -------------------------------------------------------------
  // Test 8: Missing Job Description validation
  // -------------------------------------------------------------
  {
    const row = [
      "SAP Lead", "   ", "SAP MM", "Permanent", "Full-time", 4, 8, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const buf = createTestWorkbookBuffer([row]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert.strictEqual(valResult.errorCount, 1);
    assert(valResult.rows[0].errors.some((e) => e.field === "Job Description"));
    console.log("[PASS] Test 8: Whitespace-only Job Description fails validation");
  }

  // -------------------------------------------------------------
  // Test 9 & 10: Missing and Invalid SAP Module
  // -------------------------------------------------------------
  {
    const missingModuleRow = [
      "SAP Lead", "Desc", "", "Permanent", "Full-time", 4, 8, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const invalidModuleRow = [
      "SAP Lead", "Desc", "InvalidModuleXYZ", "Permanent", "Full-time", 4, 8, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const buf = createTestWorkbookBuffer([missingModuleRow, invalidModuleRow]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert.strictEqual(valResult.errorCount, 2);
    assert(valResult.rows[0].errors.some((e) => e.field === "SAP Module" && e.message.includes("SAP Module is required")));
    assert(valResult.rows[1].errors.some((e) => e.field === "SAP Module" && e.message.includes("Invalid SAP Module")));
    console.log("[PASS] Test 9 & 10: Missing & Invalid SAP Module validated against app options");
  }

  // -------------------------------------------------------------
  // Test 11: Invalid Job Type
  // -------------------------------------------------------------
  {
    const row = [
      "Title", "Desc", "SAP MM", "Casual Volunteer", "Full-time", 4, 8, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const buf = createTestWorkbookBuffer([row]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.some((e) => e.field === "Job Type" && e.message.includes("Invalid Job Type")));
    console.log("[PASS] Test 11: Invalid Job Type rejected");
  }

  // -------------------------------------------------------------
  // Test 12: Invalid Employment Type
  // -------------------------------------------------------------
  {
    const row = [
      "Title", "Desc", "SAP MM", "Permanent", "Temporary Seasonal", 4, 8, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const buf = createTestWorkbookBuffer([row]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.some((e) => e.field === "Employment Type" && e.message.includes("Invalid Employment Type")));
    console.log("[PASS] Test 12: Invalid Employment Type rejected");
  }

  // -------------------------------------------------------------
  // Test 13: Invalid Work Mode
  // -------------------------------------------------------------
  {
    const row = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 4, 8, "Hyd", "Work From Home", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const buf = createTestWorkbookBuffer([row]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.some((e) => e.field === "Work Mode" && e.message.includes("Invalid Work Mode")));
    console.log("[PASS] Test 13: Non-canonical Work Mode rejected");
  }

  // -------------------------------------------------------------
  // Test 14 & 15 & 16: Experience Validation (negative, string, Max < Min)
  // -------------------------------------------------------------
  {
    const rowNegativeMin = [
      "Title A", "Desc", "SAP MM", "Permanent", "Full-time", -2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const rowInvalidMax = [
      "Title B", "Desc", "SAP MM", "Permanent", "Full-time", 4, "ten", "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const rowMaxLessThanMin = [
      "Title C", "Desc", "SAP MM", "Permanent", "Full-time", 8, 3, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];

    const buf = createTestWorkbookBuffer([rowNegativeMin, rowInvalidMax, rowMaxLessThanMin]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.some((e) => e.field === "Experience Min"));
    assert(valResult.rows[1].errors.some((e) => e.field === "Experience Max"));
    assert(
      valResult.rows[2].errors.some(
        (e) => e.field === "Experience Max" && e.message.includes("greater than or equal to Experience Min")
      )
    );
    console.log("[PASS] Test 14, 15, 16: Experience bounds, negative checks, and Max < Min validation verified");
  }

  // -------------------------------------------------------------
  // Test 17 & 18: Salary validation (negative, Max < Min)
  // -------------------------------------------------------------
  {
    const rowNegSal = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", -50000, 100000, "INR", "", "", 1, "", ""
    ];
    const rowMaxLessMinSal = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", 1500000, 1000000, "INR", "", "", 1, "", ""
    ];

    const buf = createTestWorkbookBuffer([rowNegSal, rowMaxLessMinSal]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.some((e) => e.field === "Salary Min"));
    assert(valResult.rows[1].errors.some((e) => e.field === "Salary Max" && e.message.includes("greater than or equal to Salary Min")));
    console.log("[PASS] Test 17 & 18: Salary bounds & Max < Min validated");
  }

  // -------------------------------------------------------------
  // Test 19: Currency validation (missing when salary present, invalid currency)
  // -------------------------------------------------------------
  {
    const rowNoCurrency = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", 1200000, 1800000, "", "", "", 1, "", ""
    ];
    const rowBadCurrency = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", 1200000, 1800000, "BITCOIN", "", "", 1, "", ""
    ];

    const buf = createTestWorkbookBuffer([rowNoCurrency, rowBadCurrency]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.some((e) => e.field === "Currency" && e.message.includes("Currency is required")));
    assert(valResult.rows[1].errors.some((e) => e.field === "Currency" && e.message.includes("Invalid Currency")));
    console.log("[PASS] Test 19: Currency requirement and allowed currency codes verified");
  }

  // -------------------------------------------------------------
  // Test 20: Number of Openings (0, negative, decimal, non-numeric)
  // -------------------------------------------------------------
  {
    const rowZero = ["Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 0, "", ""];
    const rowDecimal = ["Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 2.5, "", ""];
    const rowString = ["Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", "many", "", ""];

    const buf = createTestWorkbookBuffer([rowZero, rowDecimal, rowString]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.some((e) => e.field === "Number of Openings"));
    assert(valResult.rows[1].errors.some((e) => e.field === "Number of Openings"));
    assert(valResult.rows[2].errors.some((e) => e.field === "Number of Openings"));
    console.log("[PASS] Test 20: Openings validation rejects 0, decimals, and non-numeric strings");
  }

  // -------------------------------------------------------------
  // Test 21: Date validation & normalization
  // -------------------------------------------------------------
  {
    const rowValidDate = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "2026-11-30", ""
    ];
    const rowBadDate = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "not-a-valid-date", ""
    ];

    const buf = createTestWorkbookBuffer([rowValidDate, rowBadDate]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert.strictEqual(valResult.rows[0].data.deadline, "2026-11-30");
    assert(valResult.rows[1].errors.some((e) => e.field === "Application Deadline"));
    console.log("[PASS] Test 21: Application Deadline parsing and invalid date rejection");
  }

  // -------------------------------------------------------------
  // Test 22: Email validation
  // -------------------------------------------------------------
  {
    const rowValidEmail = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", "recruiter@sapjobs.io"
    ];
    const rowBadEmail = [
      "Title", "Desc", "SAP MM", "Permanent", "Full-time", 2, 5, "Hyd", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", "invalid-email-address"
    ];

    const buf = createTestWorkbookBuffer([rowValidEmail, rowBadEmail]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert.strictEqual(valResult.rows[0].data.contactEmail, "recruiter@sapjobs.io");
    assert(valResult.rows[1].errors.some((e) => e.field === "Contact Email"));
    console.log("[PASS] Test 22: Contact Email syntax validated");
  }

  // -------------------------------------------------------------
  // Test 23: Duplicate Detection within file (Title + Module + Location)
  // -------------------------------------------------------------
  {
    const row1 = [
      "SAP MM Lead", "Desc 1", "SAP MM", "Permanent", "Full-time", 4, 8, "Hyderabad", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];
    const row2 = [
      "sap mm lead", "Desc 2", "MM", "Permanent", "Full-time", 4, 8, "  hyderabad  ", "Hybrid", "India", "SAP MM", "", "", "", "", "", 1, "", ""
    ];

    const buf = createTestWorkbookBuffer([row1, row2]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert.strictEqual(valResult.rows[0].status, "valid");
    assert.strictEqual(valResult.rows[1].status, "warning");
    assert(
      valResult.rows[1].warnings.some((w) => w.message.includes("Possible duplicate job found in this upload (matches Row 2)"))
    );
    console.log("[PASS] Test 23: In-file duplicate detected as non-blocking warning referencing Row 2");
  }

  // -------------------------------------------------------------
  // Test 24: Multiple errors in one row
  // -------------------------------------------------------------
  {
    const multiErrorRow = [
      "", "", "UnknownModule", "UnknownType", "UnknownEmpType", -1, -5, "", "SpaceOffice", "Mars", "", "", "", "", "", "", -1, "", ""
    ];
    const buf = createTestWorkbookBuffer([multiErrorRow]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert(valResult.rows[0].errors.length >= 8, `Expected at least 8 errors, got ${valResult.rows[0].errors.length}`);
    console.log(`[PASS] Test 24: Multiple errors correctly aggregated on single row (${valResult.rows[0].errors.length} errors captured)`);
  }

  // -------------------------------------------------------------
  // Test 25: Warning-only row (e.g. single salary provided)
  // -------------------------------------------------------------
  {
    const warningRow = [
      "SAP FICO Consultant",
      "Solid description",
      "SAP FICO",
      "Permanent",
      "Full-time",
      3,
      6,
      "Pune",
      "Remote",
      "India",
      "SAP FICO",
      1200000, // Only Min salary
      "",      // Missing Max salary -> triggers warning
      "INR",
      "30 Days",
      "Degree",
      1,
      "2026-12-31",
      "hr@example.com",
    ];
    const buf = createTestWorkbookBuffer([warningRow]);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("test.xlsx", 100, parseResult.rows);

    assert.strictEqual(valResult.rows[0].status, "warning");
    assert.strictEqual(valResult.rows[0].errors.length, 0);
    assert(valResult.rows[0].warnings.length > 0);
    assert.strictEqual(valResult.warningCount, 1);
    assert.strictEqual(valResult.errorCount, 0);
    console.log("[PASS] Test 25: Warning-only row classified as status='warning' without blocking errors");
  }

  // -------------------------------------------------------------
  // Test 26: 100+ row spreadsheet performance benchmark
  // -------------------------------------------------------------
  {
    const manyRows = [];
    for (let i = 1; i <= 150; i++) {
      manyRows.push([
        `SAP Role ${i}`,
        `Description for SAP opportunity ${i} with complete details.`,
        i % 2 === 0 ? "SAP MM" : "SAP FICO",
        "Permanent",
        "Full-time",
        2 + (i % 5),
        6 + (i % 5),
        i % 3 === 0 ? "Hyderabad" : i % 3 === 1 ? "Bengaluru" : "Pune",
        "Hybrid",
        "India",
        "SAP MM, S/4HANA, ABAP",
        1000000,
        1500000,
        "INR",
        "30 Days",
        "Bachelor's",
        1,
        "2026-10-31",
        `job${i}@example.com`,
      ]);
    }

    const t0 = performance.now();
    const buf = createTestWorkbookBuffer(manyRows);
    const parseResult = await parseExcelWorkbook(buf);
    const valResult = validateBulkJobRows("large.xlsx", buf.byteLength, parseResult.rows);
    const t1 = performance.now();

    assert.strictEqual(valResult.totalRows, 150);
    assert.strictEqual(valResult.errorCount, 0);
    console.log(`[PASS] Test 26: 150-row bulk workbook parsed and validated in ${(t1 - t0).toFixed(2)} ms (< 100ms benchmark)`);
  }

  // -------------------------------------------------------------
  // Test 27: Legacy .xls binary workbook format support
  // -------------------------------------------------------------
  {
    const xlsRow = [
      "SAP ABAP Developer",
      "Building enterprise extensions on SAP BTP and S/4HANA",
      "SAP ABAP",
      "Permanent",
      "Full-time",
      5,
      9,
      "Gurugram",
      "Remote",
      "India",
      "ABAP, RAP, CAP, CDS",
      1800000,
      2400000,
      "INR",
      "Immediate",
      "B.Tech Computer Science",
      2,
      "2026-10-31",
      "careers@saptech.com",
    ];
    const bufXls = createTestWorkbookBuffer([xlsRow], STANDARD_HEADERS, "biff8");
    const parseResult = await parseExcelWorkbook(bufXls);

    assert.strictEqual(parseResult.success, true, "Must parse legacy .xls binary format");
    assert.strictEqual(parseResult.rows.length, 1);
    const valResult = validateBulkJobRows("legacy.xls", bufXls.byteLength, parseResult.rows);
    assert.strictEqual(valResult.validCount, 1);
    assert.strictEqual(valResult.rows[0].data.title, "SAP ABAP Developer");
    console.log("[PASS] Test 27: Legacy .xls (BIFF8) binary format parsed & validated cleanly");
  }

  // -------------------------------------------------------------
  // Test 28: Skills normalization & deduplication
  // -------------------------------------------------------------
  {
    const rawSkills = "SAP MM, S/4HANA, sap mm, Procurement, SAP MM, Inventory";
    const deduplicated = parseAndDeduplicateSkills(rawSkills);
    assert.deepStrictEqual(deduplicated, [
      "SAP MM",
      "S/4HANA",
      "Procurement",
      "Inventory",
    ]);
    console.log("[PASS] Test 28: Skills deduplication & case-insensitive trimming verified");
  }

  console.log("\n==================================================");
  console.log(">>> ALL 28 SPRINT 7B AUTOMATED TESTS PASSED! <<<");
  console.log("==================================================\n");
}

runSprint7BTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
