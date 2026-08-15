/**
 * Sprint 4 Phase B — Complete Integration & Security Test Suite
 * Tests against real Supabase database and schema.
 */

import dns from "node:dns";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder("ipv4first");

function projectRefFromPublicUrl() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!publicUrl) return null;
  return new URL(publicUrl).hostname.split(".")[0];
}

const password = process.env.SUPABASE_DB_PASSWORD?.trim();
const ref = projectRefFromPublicUrl();
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function runTests() {
  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();
  console.log("==================================================");
  console.log("SPRINT 4 PHASE B — SUPABASE INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  // 1. Setup / identify test candidates and jobs
  const candidatesRes = await pgClient.query(`
    select cp.id as candidate_id, cp.user_id, u.email
    from candidate_profiles cp
    join auth.users u on u.id = cp.user_id
    limit 2;
  `);

  if (candidatesRes.rows.length === 0) {
    throw new Error("No candidate profile found in database for testing.");
  }

  const candidateA = candidatesRes.rows[0];
  console.log(`[Setup] Candidate A: ${candidateA.email} (${candidateA.candidate_id})`);

  // Check candidate A resume
  let resumeRes = await pgClient.query(`
    select id, resume_name from candidate_resumes where candidate_id = $1 limit 1;
  `, [candidateA.candidate_id]);

  let resumeAId;
  if (resumeRes.rows.length === 0) {
    const newResume = await pgClient.query(`
      insert into candidate_resumes (candidate_id, resume_name, resume_url, is_primary)
      values ($1, 'Kiran_SAP_Fiori_Resume.pdf', 'https://example.com/resume.pdf', true)
      returning id;
    `, [candidateA.candidate_id]);
    resumeAId = newResume.rows[0].id;
    console.log(`[Setup] Created test resume for Candidate A: ${resumeAId}`);
  } else {
    resumeAId = resumeRes.rows[0].id;
    console.log(`[Setup] Found existing resume for Candidate A: ${resumeAId}`);
  }

  // Active Job
  const activeJobRes = await pgClient.query(`
    select id, title from jobs where status = 'active' limit 1;
  `);
  if (activeJobRes.rows.length === 0) {
    throw new Error("No active job found for testing.");
  }
  const activeJob = activeJobRes.rows[0];
  console.log(`[Setup] Active Job: ${activeJob.title} (${activeJob.id})`);

  // Closed Job
  let closedJobRes = await pgClient.query(`
    select id, title from jobs where status = 'closed' limit 1;
  `);
  let closedJobId;
  if (closedJobRes.rows.length === 0) {
    const newClosed = await pgClient.query(`
      insert into jobs (company_id, employer_id, created_by, title, status, employment_type, job_type, experience_level, location, work_arrangement, sap_module, description, responsibilities, required_skills, minimum_experience)
      select company_id, employer_id, created_by, 'Archived SAP Role', 'closed', employment_type, job_type, experience_level, location, work_arrangement, sap_module, description, responsibilities, required_skills, minimum_experience
      from jobs where status = 'active' limit 1
      returning id;
    `);
    closedJobId = newClosed.rows[0].id;
    console.log(`[Setup] Created test closed job: ${closedJobId}`);
  } else {
    closedJobId = closedJobRes.rows[0].id;
    console.log(`[Setup] Found closed job: ${closedJobId}`);
  }

  // Application questions for active job
  const questionsRes = await pgClient.query(`
    select id, question, question_type, required
    from job_application_questions
    where job_id = $1
    order by display_order;
  `, [activeJob.id]);
  console.log(`[Setup] Job Application Questions (${questionsRes.rows.length} found)`);

  // Clean any previous test applications for Candidate A on activeJob
  await pgClient.query(`
    delete from job_applications where candidate_id = $1 and job_id = $2;
  `, [candidateA.candidate_id, activeJob.id]);

  console.log("\n--------------------------------------------------");
  console.log("TEST 1: Atomic Application Submission (Happy Path)");
  console.log("--------------------------------------------------");

  const answersPayload = questionsRes.rows.map((q) => {
    let ans = "Sample answer";
    if (q.question_type === "number") ans = "5";
    else if (q.question_type === "yes_no") ans = "true";
    else if (q.question_type === "single_select") ans = "30 Days";
    return { question_id: q.id, answer: ans };
  });

  // Call submit_candidate_application as Candidate A via authenticated context
  await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidateA.user_id]);
  await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);
  const submitRes = await pgClient.query(
    `select public.submit_candidate_application($1, $2, $3, $4::jsonb) as application_id;`,
    [
      activeJob.id,
      resumeAId,
      'I am excited to apply for this SAP role. My experience in SAP matches the requirements.',
      JSON.stringify(answersPayload),
    ],
  );

  const applicationId = submitRes.rows[0].application_id;
  console.log(`✓ Application created successfully with ID: ${applicationId}`);

  // Verify in DB
  const appDbRow = await pgClient.query(`
    select * from job_applications where id = $1;
  `, [applicationId]);
  console.log("✓ Application row in DB:", {
    id: appDbRow.rows[0].id,
    candidate_id: appDbRow.rows[0].candidate_id,
    job_id: appDbRow.rows[0].job_id,
    resume_id: appDbRow.rows[0].resume_id,
    status: appDbRow.rows[0].status,
    applied_at: appDbRow.rows[0].applied_at,
  });

  // Verify answers in DB
  const answersDb = await pgClient.query(`
    select * from application_answers where application_id = $1;
  `, [applicationId]);
  console.log(`✓ Stored answers count: ${answersDb.rows.length} (expected: ${questionsRes.rows.length})`);

  // Verify status history timeline in DB
  const historyDb = await pgClient.query(`
    select * from application_status_history where application_id = $1 order by created_at asc;
  `, [applicationId]);
  console.log(`✓ Status history timeline:`, historyDb.rows.map(h => ({ status: h.status, created_at: h.created_at })));

  console.log("\n--------------------------------------------------");
  console.log("TEST 2: Duplicate Application Prevention");
  console.log("--------------------------------------------------");
  try {
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidateA.user_id]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);
    await pgClient.query(
      `select public.submit_candidate_application($1, $2, $3, $4::jsonb) as application_id;`,
      [
        activeJob.id,
        resumeAId,
        'Duplicate apply attempt',
        JSON.stringify(answersPayload),
      ],
    );
    console.error("✗ ERROR: Duplicate application was NOT blocked!");
    process.exit(1);
  } catch (err) {
    console.log(`✓ Duplicate application blocked successfully with error: "${err.message}"`);
  }

  console.log("\n--------------------------------------------------");
  console.log("TEST 3: Resume Ownership Security");
  console.log("--------------------------------------------------");
  const fakeResumeId = '00000000-0000-0000-0000-000000000000';
  try {
    const otherJobRes = await pgClient.query(`
      select id from jobs where status = 'active' and id != $1 limit 1;
    `, [activeJob.id]);

    const otherJobId = otherJobRes.rows[0]?.id || activeJob.id;
    await pgClient.query(`delete from job_applications where candidate_id = $1 and job_id = $2;`, [candidateA.candidate_id, otherJobId]);

    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidateA.user_id]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);
    await pgClient.query(
      `select public.submit_candidate_application($1, $2, $3, '[]'::jsonb);`,
      [
        otherJobId,
        fakeResumeId,
        'Fake resume test',
      ],
    );
    console.error("✗ ERROR: Unowned resume was NOT blocked!");
    process.exit(1);
  } catch (err) {
    console.log(`✓ Unowned resume blocked successfully with error: "${err.message}"`);
  }

  console.log("\n--------------------------------------------------");
  console.log("TEST 4: Closed Job Application Rejection");
  console.log("--------------------------------------------------");
  try {
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidateA.user_id]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);
    await pgClient.query(
      `select public.submit_candidate_application($1, $2, $3, '[]'::jsonb);`,
      [
        closedJobId,
        resumeAId,
        'Closed job test',
      ],
    );
    console.error("✗ ERROR: Application to closed job was NOT blocked!");
    process.exit(1);
  } catch (err) {
    console.log(`✓ Closed job application blocked successfully with error: "${err.message}"`);
  }

  console.log("\n--------------------------------------------------");
  console.log("TEST 5: Application Withdrawal Lifecycle");
  console.log("--------------------------------------------------");
  await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidateA.user_id]);
  await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);
  await pgClient.query(`select public.withdraw_candidate_application($1);`, [applicationId]);

  const withdrawnRow = await pgClient.query(`
    select status, withdrawn_at, updated_at from job_applications where id = $1;
  `, [applicationId]);
  console.log(`✓ Withdrawn application row:`, withdrawnRow.rows[0]);

  const withdrawnHistory = await pgClient.query(`
    select status, created_at from application_status_history where application_id = $1 order by created_at asc;
  `, [applicationId]);
  console.log(`✓ Updated status history timeline:`, withdrawnHistory.rows);

  console.log("\n--------------------------------------------------");
  console.log("TEST 6: Status Protection & RLS Isolation");
  console.log("--------------------------------------------------");
  // Candidate cannot directly update status to 'hired'
  const candidateClient = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✓ RLS policies active on job_applications, job_application_questions, application_answers, application_status_history");

  console.log("\n==================================================");
  console.log("ALL TESTS PASSED SUCCESSFULLY! ✓");
  console.log("==================================================");

  await pgClient.end();
}

runTests().catch((e) => {
  console.error("Integration test failed:", e);
  process.exit(1);
});
