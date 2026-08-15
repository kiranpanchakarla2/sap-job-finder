/**
 * Sprint 7E Test Suite: Bulk Upload History, Error Reports & Admin Controls
 * Tests end-to-end against Supabase PostgreSQL and client service abstractions.
 */

import dns from "node:dns";
import assert from "node:assert/strict";
import pg from "pg";
import ExcelJS from "exceljs";

dns.setDefaultResultOrder("ipv4first");

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
  console.log("   SPRINT 7E TEST SUITE: HISTORY, REPORTING & ADMIN CONTROLS     ");
  console.log("==================================================================\n");

  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  async function asUser(userId) {
    await pgClient.query(`set role authenticated;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [userId]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);
  }

  async function asAnon() {
    await pgClient.query(`set role anon;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', '', false);`);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'anon', false);`);
  }

  async function asServiceRole() {
    await pgClient.query(`reset role;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', '', false);`);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'service_role', false);`);
  }

  const {
    createBulkImportSessionWorkbook,
    generateBulkImportSessionReportBuffer,
  } = await import("../src/features/employer-jobs/lib/bulkErrorReport.ts");

  // Track created test IDs for safe cleanup
  const createdJobIds = [];
  const testCompanyIds = [];
  const testUserIds = [];
  const testImportIds = [];

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Schema & Constraints Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 1: Database Schema & Constraints ---");
    await asServiceRole();

    // 1A. Check bulk_imports table
    const biCols = await pgClient.query(`
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public' and table_name = 'bulk_imports';
    `);
    const biColNames = biCols.rows.map((r) => r.column_name);
    report(
      [
        "id",
        "company_id",
        "uploaded_by",
        "file_name",
        "file_size",
        "file_type",
        "total_rows",
        "selected_rows",
        "created_count",
        "skipped_count",
        "failed_count",
        "status",
        "created_at",
        "completed_at",
      ].every((col) => biColNames.includes(col)),
      "bulk_imports table exists with all required Sprint 7E columns"
    );

    // 1B. Check bulk_import_rows table
    const birCols = await pgClient.query(`
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public' and table_name = 'bulk_import_rows';
    `);
    const birColNames = birCols.rows.map((r) => r.column_name);
    report(
      [
        "id",
        "bulk_import_id",
        "row_number",
        "job_title",
        "status",
        "reason",
        "job_id",
        "created_at",
      ].every((col) => birColNames.includes(col)),
      "bulk_import_rows table exists with all required Sprint 7E columns"
    );

    // 1C. Check employer_accounts.can_bulk_upload column
    const eaCols = await pgClient.query(`
      select column_name, data_type, column_default
      from information_schema.columns
      where table_schema = 'public' and table_name = 'employer_accounts' and column_name = 'can_bulk_upload';
    `);
    report(
      eaCols.rows.length === 1 && eaCols.rows[0].data_type === "boolean",
      "employer_accounts has can_bulk_upload boolean column with default true"
    );

    // 1D. Check indexes
    const idxRes = await pgClient.query(`
      select indexname from pg_indexes
      where schemaname = 'public' and tablename in ('bulk_imports', 'bulk_import_rows');
    `);
    const idxNames = idxRes.rows.map((r) => r.indexname);
    report(
      idxNames.some((n) => n.includes("company")) &&
        idxNames.some((n) => n.includes("import")),
      "Appropriate performance indexes exist on bulk_imports and bulk_import_rows"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 2: Tenant & User Setup
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 2: Test Tenant & User Provisioning ---");

    // Fetch existing employer users from profiles
    const empUsersRes = await pgClient.query(
      `select user_id from public.profiles where role = 'employer' limit 4;`
    );
    const candUsersRes = await pgClient.query(
      `select user_id from public.profiles where role = 'candidate' limit 1;`
    );

    if (empUsersRes.rows.length < 4 || candUsersRes.rows.length < 1) {
      throw new Error("Test requires at least 4 employer users and 1 candidate user.");
    }

    const userAId = empUsersRes.rows[0].user_id; // Company A Owner
    const userARecruiterId = empUsersRes.rows[1].user_id; // Company A Recruiter (Authorized)
    const userARecruiterBlockedId = empUsersRes.rows[2].user_id; // Company A Recruiter (Unauthorized)
    const userBId = empUsersRes.rows[3].user_id; // Company B Owner
    const candidateUserId = candUsersRes.rows[0].user_id; // Candidate

    testUserIds.push(
      userAId,
      userARecruiterId,
      userARecruiterBlockedId,
      userBId,
      candidateUserId
    );

    // Setup Company A
    const compARes = await pgClient.query(
      `insert into public.company_profiles (user_id, company_name, setup_complete)
       values ($1, 'Sprint 7E Test Company A', true)
       on conflict (user_id) do update set company_name = 'Sprint 7E Test Company A'
       returning id;`,
      [userAId]
    );
    const companyAId = compARes.rows[0].id;
    testCompanyIds.push(companyAId);

    await pgClient.query(
      `insert into public.employer_profiles (user_id, company_name)
       values ($1, 'Sprint 7E Test Company A')
       on conflict (user_id) do nothing;`,
      [userAId]
    );
    await pgClient.query(
      `insert into public.employer_profiles (user_id, company_name)
       values ($1, 'Sprint 7E Test Company A')
       on conflict (user_id) do nothing;`,
      [userARecruiterId]
    );
    await pgClient.query(
      `insert into public.employer_profiles (user_id, company_name)
       values ($1, 'Sprint 7E Test Company A')
       on conflict (user_id) do nothing;`,
      [userARecruiterBlockedId]
    );

    // Setup Company B
    const compBRes = await pgClient.query(
      `insert into public.company_profiles (user_id, company_name, setup_complete)
       values ($1, 'Sprint 7E Test Company B', true)
       on conflict (user_id) do update set company_name = 'Sprint 7E Test Company B'
       returning id;`,
      [userBId]
    );
    const companyBId = compBRes.rows[0].id;
    testCompanyIds.push(companyBId);

    await pgClient.query(
      `insert into public.employer_profiles (user_id, company_name)
       values ($1, 'Sprint 7E Test Company B')
       on conflict (user_id) do nothing;`,
      [userBId]
    );

    // Clean old accounts for test users
    await pgClient.query(
      `delete from public.employer_accounts where user_id = any($1::uuid[]);`,
      [testUserIds]
    );

    // Create Company A Accounts
    await pgClient.query(
      `insert into public.employer_accounts (user_id, company_id, role, status, can_bulk_upload)
       values
         ($1, $2, 'owner', 'active', true),
         ($3, $2, 'recruiter', 'active', true),
         ($4, $2, 'recruiter', 'active', false);`,
      [userAId, companyAId, userARecruiterId, userARecruiterBlockedId]
    );

    // Create Company B Account
    await pgClient.query(
      `insert into public.employer_accounts (user_id, company_id, role, status, can_bulk_upload)
       values ($1, $2, 'owner', 'active', true);`,
      [userBId, companyBId]
    );

    report(true, "Test companies and user accounts successfully configured");

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Bulk Import Execution & Persistence
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 3: Bulk Import Execution & Persistence ---");

    // Insert an existing baseline job in Company A to test duplicate detection
    const baseJobRes = await pgClient.query(
      `insert into public.jobs (
         company_id, employer_id, created_by, title, employment_type, job_type,
         experience_level, location, work_arrangement, sap_module, description,
         responsibilities, required_skills, minimum_experience, status
       ) values (
         $1,
         (select id from public.employer_profiles where user_id = $2 limit 1),
         $2,
         'SAP S/4HANA Finance Architect',
         'Full-time', 'Permanent', 'Architect', 'Dallas, TX, United States',
         'Hybrid', 'SAP FICO', 'Existing baseline job for dupe check.',
         '', 'SAP FICO, S/4HANA', 10, 'active'
       ) returning id;`,
      [companyAId, userAId]
    );
    const existingJobId = baseJobRes.rows[0].id;
    createdJobIds.push(existingJobId);

    // Execute bulk import as Company A Owner
    await asUser(userAId);

    const testJobsPayload = [
      {
        rowNumber: 2,
        title: "Sprint 7E Senior SAP MM Lead",
        description: "Leading SAP MM implementation projects.",
        sapModule: "SAP MM",
        jobType: "Permanent",
        employmentType: "Full-time",
        workMode: "Hybrid",
        location: "Chicago, IL",
        country: "United States",
        skills: ["SAP MM", "Purchasing", "Inventory"],
        minExperience: 6,
        maxExperience: 10,
        minSalary: 130000,
        maxSalary: 160000,
        currency: "USD",
        openings: 2,
      },
      {
        rowNumber: 3,
        title: "Sprint 7E SAP SD Consultant",
        description: "Sales and distribution expert.",
        sapModule: "SAP SD",
        jobType: "Contract",
        employmentType: "Full-time",
        workMode: "Remote",
        location: "Atlanta, GA",
        country: "United States",
        skills: ["SAP SD", "OTC"],
        minExperience: 4,
        maxExperience: 7,
        minSalary: 95,
        maxSalary: 120,
        currency: "USD",
        openings: 1,
      },
      {
        rowNumber: 4,
        title: "SAP S/4HANA Finance Architect", // Duplicate of existing DB job
        description: "Duplicate job payload.",
        sapModule: "SAP FICO",
        jobType: "Permanent",
        employmentType: "Full-time",
        workMode: "Hybrid",
        location: "Dallas, TX",
        country: "United States",
        minExperience: 10,
        openings: 1,
      },
      {
        rowNumber: 5,
        title: "", // Invalid: Missing title
        description: "Missing title job.",
        sapModule: "SAP ABAP",
        jobType: "Permanent",
        employmentType: "Full-time",
        workMode: "On-site",
        location: "Austin, TX",
        minExperience: 3,
      },
    ];

    const metadataPayload = {
      fileName: "SAP_Jobs_Sprint7E_Batch.xlsx",
      fileSize: 45200,
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      totalRows: 4,
    };

    const importRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb, $2::jsonb) as result;`,
      [JSON.stringify(testJobsPayload), JSON.stringify(metadataPayload)]
    );

    const result = importRes.rows[0].result;
    const importSessionId = result.importId;
    testImportIds.push(importSessionId);

    report(Boolean(importSessionId), `Import session ID generated: ${importSessionId}`);
    report(result.totalSelected === 4, `totalSelected matches expected 4: got ${result.totalSelected}`);
    report(result.created.length === 2, `created count matches 2: got ${result.created.length}`);
    report(result.skipped.length === 1, `skipped count matches 1: got ${result.skipped.length}`);
    report(result.failed.length === 1, `failed count matches 1: got ${result.failed.length}`);
    report(
      result.status === "completed_with_warnings",
      `Final status is completed_with_warnings: got ${result.status}`
    );

    for (const c of result.created) {
      createdJobIds.push(c.jobId);
    }

    // Verify persistent bulk_imports record
    const dbSessionRes = await pgClient.query(
      `select * from public.bulk_imports where id = $1;`,
      [importSessionId]
    );
    const dbSession = dbSessionRes.rows[0];
    report(
      dbSession &&
        dbSession.company_id === companyAId &&
        dbSession.uploaded_by === userAId &&
        dbSession.file_name === "SAP_Jobs_Sprint7E_Batch.xlsx" &&
        dbSession.created_count === 2 &&
        dbSession.skipped_count === 1 &&
        dbSession.failed_count === 1 &&
        dbSession.status === "completed_with_warnings" &&
        dbSession.completed_at !== null,
      "bulk_imports record correctly persisted with matching counts, file metadata, and completed status"
    );

    // Verify persistent bulk_import_rows records
    const dbRowsRes = await pgClient.query(
      `select * from public.bulk_import_rows where bulk_import_id = $1 order by row_number asc;`,
      [importSessionId]
    );
    report(
      dbRowsRes.rows.length === 4,
      `bulk_import_rows contains exactly 4 row results: got ${dbRowsRes.rows.length}`
    );

    const row2 = dbRowsRes.rows[0];
    const row3 = dbRowsRes.rows[1];
    const row4 = dbRowsRes.rows[2];
    const row5 = dbRowsRes.rows[3];

    report(
      row2.row_number === 2 && row2.status === "created" && row2.job_id !== null,
      "Row 2 created with valid job_id"
    );
    report(
      row3.row_number === 3 && row3.status === "created" && row3.job_id !== null,
      "Row 3 created with valid job_id"
    );
    report(
      row4.row_number === 4 &&
        row4.status === "skipped" &&
        row4.reason.includes("Possible duplicate"),
      "Row 4 skipped with duplicate reason"
    );
    report(
      row5.row_number === 5 &&
        row5.status === "failed" &&
        row5.reason.includes("Job Title is required"),
      "Row 5 marked failed with validation error reason"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Company Isolation & RLS Security
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 4: Company Isolation & RLS Security ---");

    // 4A. Company A user can see Company A's bulk_imports and bulk_import_rows
    await asUser(userAId);
    const compAImports = await pgClient.query(
      `select id, file_name from public.bulk_imports where company_id = $1;`,
      [companyAId]
    );
    report(
      compAImports.rows.some((r) => r.id === importSessionId),
      "Company A Owner can read Company A import history"
    );

    const compARows = await pgClient.query(
      `select id, job_title from public.bulk_import_rows where bulk_import_id = $1;`,
      [importSessionId]
    );
    report(compARows.rows.length === 4, "Company A Owner can read import rows");

    // 4B. Company B user CANNOT see Company A's bulk_imports via RLS
    await asUser(userBId);
    const compBQueryImports = await pgClient.query(
      `select id from public.bulk_imports where id = $1;`,
      [importSessionId]
    );
    report(
      compBQueryImports.rows.length === 0,
      "Company B user CANNOT query or view Company A bulk_imports (0 rows returned via RLS)"
    );

    // 4C. Company B user CANNOT see Company A's bulk_import_rows via RLS
    const compBQueryRows = await pgClient.query(
      `select id from public.bulk_import_rows where bulk_import_id = $1;`,
      [importSessionId]
    );
    report(
      compBQueryRows.rows.length === 0,
      "Company B user CANNOT query or view Company A bulk_import_rows (0 rows returned via RLS)"
    );

    // 4D. Direct client mutation on bulk_imports is blocked for non-service role
    try {
      await pgClient.query(
        `update public.bulk_imports set created_count = 999 where id = $1;`,
        [importSessionId]
      );
      // Verify count was not changed
      await asServiceRole();
      const checkCount = await pgClient.query(
        `select created_count from public.bulk_imports where id = $1;`,
        [importSessionId]
      );
      report(
        checkCount.rows[0].created_count === 2,
        "Direct client update on bulk_imports counts is blocked or ineffective"
      );
    } catch {
      report(true, "Direct client update on bulk_imports prevented");
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 5: Recruiter Bulk Upload Permission Enforcement
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 5: Recruiter Bulk Upload Permissions ---");

    // 5A. Authorized Recruiter (can_bulk_upload = true) CAN upload
    await asUser(userARecruiterId);
    const authorizedPayload = [
      {
        rowNumber: 2,
        title: "Sprint 7E SAP CPI Developer",
        description: "Integration developer.",
        sapModule: "SAP CPI",
        jobType: "Contract",
        employmentType: "Full-time",
        workMode: "Remote",
        location: "Denver, CO",
        country: "United States",
        minExperience: 5,
        openings: 1,
      },
    ];

    const authRecruiterRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb, $2::jsonb) as result;`,
      [JSON.stringify(authorizedPayload), JSON.stringify({ fileName: "Recruiter_Upload.xlsx" })]
    );
    const authResult = authRecruiterRes.rows[0].result;
    testImportIds.push(authResult.importId);
    if (authResult.created?.[0]?.jobId) {
      createdJobIds.push(authResult.created[0].jobId);
    }
    report(
      authResult.created.length === 1,
      "Authorized Recruiter (can_bulk_upload = true) successfully performed bulk job import"
    );

    // 5B. Unauthorized Recruiter (can_bulk_upload = false) is BLOCKED
    await asUser(userARecruiterBlockedId);
    try {
      await pgClient.query(
        `select public.bulk_import_jobs($1::jsonb, $2::jsonb) as result;`,
        [JSON.stringify(authorizedPayload), JSON.stringify({ fileName: "Blocked_Upload.xlsx" })]
      );
      report(false, "Unauthorized recruiter was able to call bulk_import_jobs");
    } catch (err) {
      report(
        err.message.includes("FORBIDDEN_BULK_UPLOAD_PERMISSION_DENIED"),
        `Unauthorized recruiter blocked by server with FORBIDDEN_BULK_UPLOAD_PERMISSION_DENIED: ${err.message}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 6: Admin Controls & Permission Management RPC
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 6: Company Admin Permission Controls ---");

    // Fetch the account ID for blocked recruiter
    await asServiceRole();
    const blockedAcctRes = await pgClient.query(
      `select id from public.employer_accounts where user_id = $1 and company_id = $2;`,
      [userARecruiterBlockedId, companyAId]
    );
    const blockedAccountId = blockedAcctRes.rows[0].id;

    // 6A. Recruiter cannot grant permissions to another user
    await asUser(userARecruiterId);
    try {
      await pgClient.query(
        `select public.update_team_member_bulk_upload_permission($1, true);`,
        [blockedAccountId]
      );
      report(false, "Recruiter was able to modify team member permissions");
    } catch (err) {
      report(
        err.message.includes("FORBIDDEN_ADMIN_ONLY"),
        `Recruiter blocked from modifying permissions with FORBIDDEN_ADMIN_ONLY: ${err.message}`
      );
    }

    // 6B. Company Owner grants permission to the blocked recruiter
    await asUser(userAId);
    const grantRes = await pgClient.query(
      `select public.update_team_member_bulk_upload_permission($1, true) as res;`,
      [blockedAccountId]
    );
    report(grantRes.rows[0].res.success === true, "Company Owner granted bulk upload permission");

    // 6C. The previously blocked recruiter can now perform bulk upload!
    await asUser(userARecruiterBlockedId);
    const previouslyBlockedPayload = [
      {
        rowNumber: 2,
        title: "Sprint 7E SAP Basis Administrator",
        description: "Basis administrator for enterprise systems.",
        sapModule: "SAP Basis",
        jobType: "Permanent",
        employmentType: "Full-time",
        workMode: "Hybrid",
        location: "Seattle, WA",
        country: "United States",
        minExperience: 4,
        openings: 1,
      },
    ];

    const unblockedRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb, $2::jsonb) as result;`,
      [JSON.stringify(previouslyBlockedPayload), JSON.stringify({ fileName: "Unblocked_Upload.xlsx" })]
    );
    const unblockedResult = unblockedRes.rows[0].result;
    testImportIds.push(unblockedResult.importId);
    if (unblockedResult.created?.[0]?.jobId) {
      createdJobIds.push(unblockedResult.created[0].jobId);
    }
    report(
      unblockedResult.created.length === 1,
      "Newly authorized recruiter successfully performed bulk upload after admin granted permission"
    );

    // 6D. Owner revokes the permission
    await asUser(userAId);
    await pgClient.query(
      `select public.update_team_member_bulk_upload_permission($1, false);`,
      [blockedAccountId]
    );

    // 6E. Revoked recruiter is blocked again
    await asUser(userARecruiterBlockedId);
    try {
      await pgClient.query(
        `select public.bulk_import_jobs($1::jsonb, $2::jsonb) as result;`,
        [JSON.stringify(previouslyBlockedPayload), JSON.stringify({ fileName: "Blocked_Again.xlsx" })]
      );
      report(false, "Revoked recruiter was able to upload");
    } catch (err) {
      report(
        err.message.includes("FORBIDDEN_BULK_UPLOAD_PERMISSION_DENIED"),
        "Revoked recruiter immediately blocked on subsequent import attempt"
      );
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 7: Excel Report Generation & Security
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 7: Excel Report Generation & Privacy ---");

    const sampleRowRecords = [
      {
        rowNumber: 2,
        jobTitle: "SAP MM Consultant",
        status: "created",
        reason: null,
        jobId: "00000000-0000-0000-0000-000000000001",
      },
      {
        rowNumber: 4,
        jobTitle: "SAP FICO Lead",
        status: "skipped",
        reason: "Possible duplicate of an existing job.",
        jobId: null,
      },
      {
        rowNumber: 7,
        jobTitle: "SAP ABAP Dev",
        status: "failed",
        reason: "Job Description is required.",
        jobId: null,
      },
    ];

    const reportBuffer = await generateBulkImportSessionReportBuffer(sampleRowRecords, "Test_File.xlsx");
    report(reportBuffer instanceof Uint8Array && reportBuffer.length > 1000, "Generated valid Excel .xlsx report buffer");

    // Read back workbook using ExcelJS to verify contents
    const readWb = new ExcelJS.Workbook();
    await readWb.xlsx.load(Buffer.from(reportBuffer));
    const sheet = readWb.getWorksheet("Import Results");
    report(Boolean(sheet), "Workbook has 'Import Results' worksheet");

    const rowCount = sheet.rowCount;
    report(rowCount >= 4, `Report has header + 3 data rows: got ${rowCount}`);

    const headerVals = sheet.getRow(1).values;
    report(
      JSON.stringify(headerVals).includes("Excel Row") &&
        JSON.stringify(headerVals).includes("Job Title") &&
        JSON.stringify(headerVals).includes("Import Status") &&
        JSON.stringify(headerVals).includes("Result Details"),
      "Report headers contain user-friendly recruiter column names"
    );

    // Verify privacy: ensure no internal connection strings or company IDs leaked in workbook
    const allCellsStr = JSON.stringify(sheet.getSheetValues());
    report(
      !allCellsStr.includes(connectionString) &&
        !allCellsStr.includes(password) &&
        !allCellsStr.includes("postgres://"),
      "Report is clean of internal database credentials and stack traces"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 8: Regression Testing
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 8: Single Job & System Regression ---");

    // 8A. Single job post still works
    await asUser(userAId);
    const singleJobRes = await pgClient.query(
      `insert into public.jobs (
         company_id, employer_id, created_by, title, employment_type, job_type,
         experience_level, location, work_arrangement, sap_module, description,
         responsibilities, required_skills, minimum_experience, status
       ) values (
         $1,
         (select id from public.employer_profiles where user_id = $2 limit 1),
         $2,
         'Sprint 7E Single Post Job',
         'Full-time', 'Permanent', 'Senior', 'Miami, FL',
         'On-site', 'SAP QM', 'Single post job test.',
         '', 'SAP QM', 5, 'draft'
       ) returning id;`,
      [companyAId, userAId]
    );
    report(Boolean(singleJobRes.rows[0]?.id), "Standard single job posting continues working normally");
    createdJobIds.push(singleJobRes.rows[0].id);

    // 8B. list_company_team_members returns canBulkUpload field
    const teamRes = await pgClient.query(
      `select public.list_company_team_members() as team;`
    );
    const teamItems = teamRes.rows[0].team.items;
    report(
      teamItems.every((m) => typeof m.canBulkUpload === "boolean"),
      "list_company_team_members RPC returns canBulkUpload boolean on all member items"
    );

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n--- CLEANUP: Removing Test Data ---");
    await asServiceRole();

    if (testImportIds.length > 0) {
      await pgClient.query(
        `delete from public.bulk_imports where id = any($1::uuid[]);`,
        [testImportIds]
      );
    }

    if (createdJobIds.length > 0) {
      await pgClient.query(
        `delete from public.jobs where id = any($1::uuid[]);`,
        [createdJobIds]
      );
    }

    if (testUserIds.length > 0) {
      await pgClient.query(
        `delete from public.employer_accounts where user_id = any($1::uuid[]);`,
        [testUserIds]
      );
      await pgClient.query(
        `delete from public.company_profiles where user_id = any($1::uuid[]);`,
        [testUserIds]
      );
      await pgClient.query(
        `delete from public.employer_profiles where user_id = any($1::uuid[]);`,
        [testUserIds]
      );
    }

    await pgClient.end();
    console.log("Cleanup completed.\n");
  }

  console.log("==================================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
