/**
 * Sprint 7D: Bulk Job Database Import, Duplicate Detection & Permissions Test Suite
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
  console.log("================================================================");
  console.log("   SPRINT 7D TEST SUITE: DATABASE IMPORT, DUPES & PERMISSIONS  ");
  console.log("================================================================\n");

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
    createBulkImportResultWorkbook,
    generateBulkImportResultReportBuffer,
  } = await import("../src/features/employer-jobs/lib/bulkErrorReport.ts");

  // Track created test IDs for safe cleanup
  const createdJobIds = [];
  const testCompanyIds = [];
  const testUserIds = [];

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Excel Result Report Generation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 1: Excel Import Result Report Generation ---");
    {
      const mockResult = {
        totalSelected: 4,
        created: [
          { rowNumber: 2, jobTitle: "SAP MM Consultant", jobId: "test-job-id-1" },
          { rowNumber: 3, jobTitle: "SAP FICO Lead", jobId: "test-job-id-2" },
        ],
        skipped: [
          {
            rowNumber: 4,
            jobTitle: "SAP SD Specialist",
            reason: "Possible duplicate of an existing SAP SD Specialist job.",
          },
        ],
        failed: [
          {
            rowNumber: 5,
            jobTitle: "SAP ABAP Dev",
            reason: "Invalid Work Mode. Please use On-site, Hybrid, or Remote.",
          },
        ],
      };

      const wb = createBulkImportResultWorkbook(mockResult, "Test_Upload.xlsx");
      const sheet = wb.getWorksheet("Import Results");
      report(Boolean(sheet), "Result report worksheet created with correct name");
      report(sheet.rowCount === 5, `Result report has header + 4 rows (got ${sheet.rowCount})`);

      const buffer = await generateBulkImportResultReportBuffer(mockResult, "Test_Upload.xlsx");
      report(buffer.length > 1000, `Result report buffer generated successfully (${buffer.length} bytes)`);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 2: Setup Test Tenants and Users in Database
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 2: Database Setup & Test Context ---");
    await asServiceRole();

    const userAId = crypto.randomUUID();
    const userARecruiterId = crypto.randomUUID();
    const userBId = crypto.randomUUID();
    const candidateUserId = crypto.randomUUID();

    testUserIds.push(userAId, userARecruiterId, userBId, candidateUserId);

    // Create auth users if not existing
    for (const uid of [userAId, userARecruiterId, userBId]) {
      await pgClient.query(
        `insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
         values ($1, 'authenticated', 'authenticated', $2, '{"provider":"email","providers":["email"]}', '{"role":"employer"}', now(), now())
         on conflict (id) do nothing;`,
        [uid, `test-${uid}@example.com`]
      );
    }
    await pgClient.query(
      `insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
       values ($1, 'authenticated', 'authenticated', $2, '{"provider":"email","providers":["email"]}', '{"role":"candidate"}', now(), now())
       on conflict (id) do nothing;`,
      [candidateUserId, `test-${candidateUserId}@example.com`]
    );

    // Setup profiles
    await pgClient.query(
      `insert into public.profiles (user_id, role, first_name, last_name, email)
       values
         ($1, 'employer', 'Admin', 'CompanyA', 'adminA@example.com'),
         ($2, 'employer', 'Recruiter', 'CompanyA', 'recruiterA@example.com'),
         ($3, 'employer', 'Owner', 'CompanyB', 'ownerB@example.com'),
         ($4, 'candidate', 'Candidate', 'User', 'candidate@example.com')
       on conflict (user_id) do nothing;`,
      [userAId, userARecruiterId, userBId, candidateUserId]
    );



    // Setup company A
    const compARes = await pgClient.query(
      `insert into public.company_profiles (user_id, company_name, setup_complete)
       values ($1, 'Sprint 7D Company A', true)
       on conflict (user_id) do update set company_name = 'Sprint 7D Company A'
       returning id;`,
      [userAId]
    );
    const companyAId = compARes.rows[0].id;
    testCompanyIds.push(companyAId);

    // Setup employer profile A
    await pgClient.query(
      `insert into public.employer_profiles (user_id, company_name)
       values ($1, 'Sprint 7D Company A')
       on conflict (user_id) do nothing;`,
      [userAId]
    );

    // Setup company B
    const compBRes = await pgClient.query(
      `insert into public.company_profiles (user_id, company_name, setup_complete)
       values ($1, 'Sprint 7D Company B', true)
       on conflict (user_id) do update set company_name = 'Sprint 7D Company B'
       returning id;`,
      [userBId]
    );
    const companyBId = compBRes.rows[0].id;
    testCompanyIds.push(companyBId);

    // Setup employer profile B
    await pgClient.query(
      `insert into public.employer_profiles (user_id, company_name)
       values ($1, 'Sprint 7D Company B')
       on conflict (user_id) do nothing;`,
      [userBId]
    );

    // Setup employer profile for recruiter A
    await pgClient.query(
      `insert into public.employer_profiles (user_id, company_name)
       values ($1, 'Sprint 7D Company A')
       on conflict (user_id) do nothing;`,
      [userARecruiterId]
    );


    // Ensure test users have no old employer accounts lingering
    await pgClient.query(
      `delete from public.employer_accounts where user_id = any($1::uuid[]);`,
      [testUserIds]
    );

    // Setup recruiter employer account (owners are auto-created by trigger on company_profiles)
    await pgClient.query(
      `insert into public.employer_accounts (user_id, company_id, role, status)
       values ($1, $2, 'recruiter', 'active')
       on conflict (user_id, company_id) do update set role = 'recruiter', status = 'active';`,
      [userARecruiterId, companyAId]
    );
    // Ensure owners also have their employer_accounts entry
    await pgClient.query(
      `insert into public.employer_accounts (user_id, company_id, role, status)
       values
         ($1, $2, 'owner', 'active'),
         ($3, $4, 'owner', 'active')
       on conflict (user_id, company_id) do update set role = 'owner', status = 'active';`,
      [userAId, companyAId, userBId, companyBId]
    );



    report(true, "Database test tenants and users initialized");

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Authorization & Security Boundary
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 3: Authorization & Security Boundary ---");

    // 3A. Unauthenticated user cannot call bulk_import_jobs
    await asAnon();
    try {
      await pgClient.query(`select public.bulk_import_jobs('[]'::jsonb);`);
      report(false, "Unauthenticated user was able to call bulk_import_jobs");
    } catch (err) {
      report(true, `Unauthenticated user blocked: ${err.message}`);
    }

    // 3B. Candidate role cannot call bulk_import_jobs
    await asUser(candidateUserId);
    try {
      await pgClient.query(`select public.bulk_import_jobs('[]'::jsonb);`);
      report(false, "Candidate user was able to call bulk_import_jobs");
    } catch (err) {
      report(true, `Candidate user blocked from bulk import: ${err.message}`);
    }

    // 3C. Authorized Company Admin/Owner can call bulk_import_jobs
    await asUser(userAId);
    try {
      const emptyRes = await pgClient.query(`select public.bulk_import_jobs('[]'::jsonb) as res;`);
      const val = emptyRes.rows[0].res;
      report(val.totalSelected === 0, "Authorized Company Owner can execute bulk_import_jobs");
    } catch (err) {
      report(false, `Company Owner failed to execute RPC: ${err.message}`);
    }

    // 3D. Authorized Recruiter can call bulk_import_jobs
    await asUser(userARecruiterId);
    try {
      const recRes = await pgClient.query(`select public.bulk_import_jobs('[]'::jsonb) as res;`);
      const val = recRes.rows[0].res;
      report(val.totalSelected === 0, "Authorized Recruiter can execute bulk_import_jobs");
    } catch (err) {
      report(false, `Authorized Recruiter failed to execute RPC: ${err.message}`);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Single Job Import & Field Mapping
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 4: Single Job Import & Field Mapping ---");
    await asUser(userAId);

    const singleJobPayload = [
      {
        rowNumber: 2,
        title: "SAP MM Lead Consultant",
        description: "Configure material management and logistics invoices.",
        sapModule: "SAP MM",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 5,
        maxExperience: 9,
        location: "Hyderabad",
        workMode: "Hybrid",
        country: "India",
        skills: ["SAP MM", "S/4HANA", "Inventory"],
        minSalary: 1500000,
        maxSalary: 2200000,
        currency: "INR",
        noticePeriod: "30 Days",
        education: "B.Tech",
        openings: 2,
        deadline: "2026-11-30",
        contactEmail: "jobs@companya.com",
      },
    ];

    const import1Res = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb) as res;`,
      [JSON.stringify(singleJobPayload)]
    );
    const result1 = import1Res.rows[0].res;
    console.log("result1:", JSON.stringify(result1, null, 2));

    report(result1.totalSelected === 1, "Single job payload recognized 1 selected job");
    report(result1.created.length === 1, "Single valid job successfully created");
    report(result1.skipped.length === 0, "No rows skipped");
    report(result1.failed.length === 0, "No rows failed");

    const createdJobId = result1.created[0]?.jobId;
    if (createdJobId) createdJobIds.push(createdJobId);

    // Verify row directly in database
    await asServiceRole();
    const dbJobRes = await pgClient.query(
      `select *, application_deadline::text as application_deadline_str from public.jobs where id = $1;`,
      [createdJobId]
    );
    const dbJob = dbJobRes.rows[0];

    report(Boolean(dbJob), "Job record found in public.jobs");
    report(dbJob.company_id === companyAId, "Job company_id correctly assigned to authenticated Company A");
    report(dbJob.created_by === userAId, "Job created_by correctly assigned to authenticated User A");
    report(dbJob.status === "draft", "Job initial status is 'draft'");
    report(dbJob.experience_level === "Mid Level", `Experience level correctly derived ('Mid Level', got ${dbJob.experience_level})`);
    report(dbJob.required_skills === "SAP MM, S/4HANA, Inventory", `Skills array mapped to required_skills string (got '${dbJob.required_skills}')`);
    report(Number(dbJob.salary_min) === 1500000 && Number(dbJob.salary_max) === 2200000, "Salary range correctly stored as numbers");
    report(dbJob.currency === "INR", "Preserved employer's INR currency");
    report(dbJob.number_of_openings === 2, "Openings set to 2");
    report(dbJob.application_deadline_str === "2026-11-30", `Deadline stored correctly without timezone shift (got '${dbJob.application_deadline_str}')`);


    // -------------------------------------------------------------------------
    // TEST SECTION 5: Duplicate Detection (Case & Whitespace Normalization)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 5: Duplicate Detection ---");
    await asUser(userAId);

    // Attempt to import duplicate of "SAP MM Lead Consultant" with different case and whitespace
    const duplicatePayload = [
      {
        rowNumber: 3,
        title: "   sap   mm   lead   consultant   ",
        description: "Another copy of MM lead.",
        sapModule: "SAP MM",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 5,
        maxExperience: 9,
        location: "Hyderabad, India",
        workMode: "Hybrid",
        country: "India",
        skills: ["SAP MM"],
      },
    ];

    const dupeRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb) as res;`,
      [JSON.stringify(duplicatePayload)]
    );
    const dupeResult = dupeRes.rows[0].res;

    report(dupeResult.created.length === 0, "Duplicate job was not created");
    report(dupeResult.skipped.length === 1, "Duplicate job was recorded as skipped");
    report(
      dupeResult.skipped[0]?.reason?.includes("duplicate of an existing SAP MM Lead Consultant job"),
      `Skip reason clearly identifies existing job: "${dupeResult.skipped[0]?.reason}"`
    );

    // Verify Company B can create the exact same job title without conflict (Company Scoped)
    await asUser(userBId);
    const compBImportRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb) as res;`,
      [JSON.stringify(singleJobPayload)]
    );
    const compBResult = compBImportRes.rows[0].res;

    report(
      compBResult.created.length === 1,
      "Company B can legitimately create a job with the same title (duplicate detection is company-scoped)"
    );
    if (compBResult.created[0]?.jobId) {
      createdJobIds.push(compBResult.created[0].jobId);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 6: Intra-Batch Duplicate Detection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 6: Intra-Batch Duplicate Detection ---");
    await asUser(userAId);

    const intraBatchDupePayload = [
      {
        rowNumber: 10,
        title: "SAP FICO Senior Architect",
        description: "Lead enterprise finance design.",
        sapModule: "SAP FICO",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 10,
        maxExperience: 15,
        location: "Bangalore",
        workMode: "Remote",
        country: "India",
        skills: ["SAP FICO", "S/4HANA Finance"],
      },
      {
        rowNumber: 11,
        title: "SAP FICO Senior Architect",
        description: "Exact duplicate in same Excel file.",
        sapModule: "SAP FICO",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 10,
        maxExperience: 15,
        location: "Bangalore",
        workMode: "Remote",
        country: "India",
        skills: ["SAP FICO"],
      },
    ];

    const intraRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb) as res;`,
      [JSON.stringify(intraBatchDupePayload)]
    );
    const intraResult = intraRes.rows[0].res;

    report(intraResult.created.length === 1, "First instance in batch was created");
    report(intraResult.skipped.length === 1, "Second duplicate instance in batch was skipped");
    report(
      intraResult.skipped[0]?.reason?.includes("Duplicate of another job in this upload batch"),
      `Intra-batch duplicate reason: "${intraResult.skipped[0]?.reason}"`
    );

    if (intraResult.created[0]?.jobId) {
      createdJobIds.push(intraResult.created[0].jobId);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 7: Server-Side Validation & Partial Success
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 7: Server-Side Validation & Partial Success ---");
    await asUser(userAId);

    const mixedBatchPayload = [
      {
        // 1. Valid new job
        rowNumber: 20,
        title: "SAP SD Logistics Specialist",
        description: "Manage sales and distribution cycle.",
        sapModule: "SAP SD",
        jobType: "Contract",
        employmentType: "Full-time",
        minExperience: 4,
        maxExperience: 7,
        location: "Pune",
        workMode: "On-site",
        country: "India",
        skills: ["SAP SD", "Order Management"],
      },
      {
        // 2. Existing duplicate
        rowNumber: 21,
        title: "SAP MM Lead Consultant",
        description: "Duplicate of test 4.",
        sapModule: "SAP MM",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 5,
        maxExperience: 9,
        location: "Hyderabad",
        workMode: "Hybrid",
        country: "India",
        skills: ["SAP MM"],
      },
      {
        // 3. Server-side validation failure (negative min experience)
        rowNumber: 22,
        title: "SAP PP Planner",
        description: "Invalid experience values.",
        sapModule: "SAP PP",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: -3,
        maxExperience: 5,
        location: "Chennai",
        workMode: "Hybrid",
        country: "India",
        skills: ["SAP PP"],
      },
      {
        // 4. Server-side validation failure (maxSalary < minSalary)
        rowNumber: 23,
        title: "SAP ABAP Developer",
        description: "Invalid salary values.",
        sapModule: "SAP ABAP",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 3,
        maxExperience: 6,
        location: "Mumbai",
        workMode: "Remote",
        country: "India",
        skills: ["ABAP", "OOPS ABAP"],
        minSalary: 2000000,
        maxSalary: 1000000,
        currency: "INR",
      },
    ];

    const mixedRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb) as res;`,
      [JSON.stringify(mixedBatchPayload)]
    );
    const mixedResult = mixedRes.rows[0].res;

    report(mixedResult.totalSelected === 4, "Total selected 4 rows processed");
    report(mixedResult.created.length === 1, `Created count = 1 (got ${mixedResult.created.length})`);
    report(mixedResult.skipped.length === 1, `Skipped count = 1 (got ${mixedResult.skipped.length})`);
    report(mixedResult.failed.length === 2, `Failed count = 2 (got ${mixedResult.failed.length})`);

    report(
      mixedResult.created[0]?.jobTitle === "SAP SD Logistics Specialist",
      "Valid job created in mixed batch"
    );
    report(
      mixedResult.skipped[0]?.rowNumber === 21,
      "Duplicate job skipped in mixed batch"
    );
    report(
      mixedResult.failed[0]?.reason?.includes("Minimum Experience must be a non-negative number"),
      `First failure reason: "${mixedResult.failed[0]?.reason}"`
    );
    report(
      mixedResult.failed[1]?.reason?.includes("Maximum Salary must be greater than or equal to Minimum Salary"),
      `Second failure reason: "${mixedResult.failed[1]?.reason}"`
    );

    if (mixedResult.created[0]?.jobId) {
      createdJobIds.push(mixedResult.created[0].jobId);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 8: Idempotency on Repeated Import
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 8: Idempotency on Repeated Submission ---");
    await asUser(userAId);

    // Resubmit the exact same mixed payload
    const repeatRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb) as res;`,
      [JSON.stringify(mixedBatchPayload)]
    );
    const repeatResult = repeatRes.rows[0].res;

    report(
      repeatResult.created.length === 0,
      "Re-submitting the same batch created 0 duplicate jobs (100% idempotent)"
    );
    report(
      repeatResult.skipped.length === 2,
      "Previously created jobs are now safely skipped as duplicates"
    );
    report(
      repeatResult.failed.length === 2,
      "Previously invalid jobs remain failed"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 9: Client Payload Hijack Prevention
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 9: Client Payload Hijack Prevention ---");
    await asUser(userAId);

    // Attempt to inject malicious company_id or created_by into payload
    const maliciousPayload = [
      {
        rowNumber: 99,
        title: "SAP Security Lead",
        description: "Attempting to create job for Company B while logged in as Company A.",
        sapModule: "SAP Security",
        jobType: "Permanent",
        employmentType: "Full-time",
        minExperience: 6,
        maxExperience: 10,
        location: "Delhi",
        workMode: "Remote",
        country: "India",
        skills: ["SAP Security"],
        // Malicious overrides in payload
        company_id: companyBId,
        companyId: companyBId,
        created_by: userBId,
        userId: userBId,
        employer_id: "fake-id",
        status: "active",
      },
    ];

    const hijackRes = await pgClient.query(
      `select public.bulk_import_jobs($1::jsonb) as res;`,
      [JSON.stringify(maliciousPayload)]
    );
    const hijackResult = hijackRes.rows[0].res;

    report(hijackResult.created.length === 1, "Job created successfully");
    const hijackJobId = hijackResult.created[0]?.jobId;
    if (hijackJobId) createdJobIds.push(hijackJobId);

    await asServiceRole();
    const hijackCheckRes = await pgClient.query(
      `select * from public.jobs where id = $1;`,
      [hijackJobId]
    );
    const hijackJob = hijackCheckRes.rows[0];

    report(
      hijackJob.company_id === companyAId,
      "CRITICAL: company_id was enforced as authenticated Company A, ignoring payload hijack attempt"
    );
    report(
      hijackJob.created_by === userAId,
      "CRITICAL: created_by was enforced as authenticated User A, ignoring payload hijack attempt"
    );
    report(
      hijackJob.status === "draft",
      "CRITICAL: status was enforced as 'draft', ignoring payload attempt to publish immediately"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 10: Single Job Service Regression Tests
    // -------------------------------------------------------------------------
    console.log("\n--- TEST SECTION 10: Single Job Service Regression Tests ---");
    {
      const fs = await import("node:fs");
      const code = fs.readFileSync(
        "src/features/employer-jobs/services/jobService.ts",
        "utf8"
      );
      report(code.includes("createJob:"), "jobService.createJob exists");
      report(code.includes("bulkImportJobs:"), "jobService.bulkImportJobs exists");
      report(code.includes("listJobs:"), "jobService.listJobs exists");
      report(code.includes("updateJob:"), "jobService.updateJob exists");
      report(code.includes("publishJob:"), "jobService.publishJob exists");
      report(code.includes("pauseJob:"), "jobService.pauseJob exists");
      report(code.includes("resumeJob:"), "jobService.resumeJob exists");
      report(code.includes("closeJob:"), "jobService.closeJob exists");
      report(code.includes("deleteDraftJob:"), "jobService.deleteDraftJob exists");
    }


  } finally {
    // Cleanup created test records
    console.log("\n--- CLEANUP: Removing Test Records ---");
    await asServiceRole();

    if (createdJobIds.length > 0) {
      await pgClient.query(
        `delete from public.jobs where id = any($1::uuid[]);`,
        [createdJobIds]
      );
      console.log(`Cleaned up ${createdJobIds.length} test job records.`);
    }

    for (const compId of testCompanyIds) {
      await pgClient.query(
        `delete from public.employer_accounts where company_id = $1;`,
        [compId]
      );
      await pgClient.query(
        `delete from public.company_profiles where id = $1;`,
        [compId]
      );
    }

    for (const uid of testUserIds) {
      await pgClient.query(
        `delete from public.employer_profiles where user_id = $1;`,
        [uid]
      );
      await pgClient.query(
        `delete from public.profiles where user_id = $1;`,
        [uid]
      );
      await pgClient.query(
        `delete from auth.users where id = $1;`,
        [uid]
      );
    }

    console.log("Cleaned up test tenants and users.");
    await pgClient.end();
  }

  console.log("\n================================================================");
  console.log(`   SPRINT 7D TEST RESULTS: ${passed} PASSED, ${failed} FAILED   `);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
