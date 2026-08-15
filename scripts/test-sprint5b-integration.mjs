/**
 * Sprint 5 Phase B: Supabase Integration & RLS Security Test Suite
 * Tests Saved Jobs & Job Alerts end-to-end against real Supabase database.
 */

import dns from "node:dns";
import assert from "node:assert/strict";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

function projectRefFromPublicUrl() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://jhoaaijrwigvuxhtoadx.supabase.co";
  return new URL(publicUrl).hostname.split(".")[0];
}

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = projectRefFromPublicUrl();
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

async function main() {
  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  async function asCandidate(user_id) {
    await pgClient.query(`set role authenticated;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [user_id]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);
  }

  async function asServiceRole() {
    await pgClient.query(`reset role;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', '', false);`);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'service_role', false);`);
  }

  console.log("================================================================");
  console.log("SPRINT 5 PHASE B — SUPABASE INTEGRATION TEST SUITE");
  console.log("================================================================\n");

  try {
    // ------------------------------------------------------------------------
    // 1. Setup Candidate A and Candidate B
    // ------------------------------------------------------------------------
    console.log("[1. CANDIDATE SETUP]");
    await asServiceRole();

    const candidatesRes = await pgClient.query(`
      select cp.id as candidate_id, cp.user_id, u.email, cp.first_name, cp.last_name
      from candidate_profiles cp
      join auth.users u on u.id = cp.user_id
      order by cp.created_at asc
      limit 2;
    `);

    if (candidatesRes.rows.length === 0) {
      throw new Error("No candidate profile found in database for testing.");
    }

    const candidateA = candidatesRes.rows[0];
    let candidateB;

    if (candidatesRes.rows.length >= 2) {
      candidateB = candidatesRes.rows[1];
    } else {
      const fakeUserId = "00000000-0000-0000-0000-000000000002";
      const userExists = await pgClient.query(`select id from auth.users where id = $1;`, [fakeUserId]);
      if (!userExists.rows.length) {
        await pgClient.query(`
          insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
          values ($1, 'authenticated', 'authenticated', 'test.candidate.b@example.com', '{"provider":"email","providers":["email"]}', '{"first_name":"Bob","last_name":"Candidate"}', now(), now());
        `, [fakeUserId]);
      }
      const profileExists = await pgClient.query(`select id from candidate_profiles where user_id = $1;`, [fakeUserId]);
      let candBId;
      if (!profileExists.rows.length) {
        const cpRes = await pgClient.query(`
          insert into candidate_profiles (user_id, first_name, last_name)
          values ($1, 'Bob', 'Candidate')
          returning id;
        `, [fakeUserId]);
        candBId = cpRes.rows[0].id;
      } else {
        candBId = profileExists.rows[0].id;
      }
      candidateB = {
        candidate_id: candBId,
        user_id: fakeUserId,
        email: 'test.candidate.b@example.com',
        first_name: 'Bob',
        last_name: 'Candidate',
      };
    }

    console.log(`✓ Candidate A: ${candidateA.first_name} ${candidateA.last_name} (${candidateA.email})`);
    console.log(`  Candidate Profile ID: ${candidateA.candidate_id}`);
    console.log(`  User ID: ${candidateA.user_id}`);
    console.log(`✓ Candidate B: ${candidateB.first_name} ${candidateB.last_name} (${candidateB.email})`);
    console.log(`  Candidate Profile ID: ${candidateB.candidate_id}`);
    console.log(`  User ID: ${candidateB.user_id}\n`);

    // Clean up test data for candidates
    await pgClient.query(`delete from saved_jobs where candidate_id in ($1, $2);`, [candidateA.candidate_id, candidateB.candidate_id]);
    await pgClient.query(`delete from job_alerts where candidate_id in ($1, $2);`, [candidateA.candidate_id, candidateB.candidate_id]);

    // ------------------------------------------------------------------------
    // 2. Discover Active Jobs
    // ------------------------------------------------------------------------
    console.log("[2. JOB DISCOVERY]");
    const jobsRes = await pgClient.query(`
      select j.id, j.title, j.location, j.sap_module, cp.company_name
      from jobs j
      left join company_profiles cp on cp.id = j.company_id
      where j.status = 'active'
      limit 2;
    `);
    assert(jobsRes.rows.length > 0, "Expected at least 1 active job in catalog");
    const testJob1 = jobsRes.rows[0];
    const testJob2 = jobsRes.rows.length > 1 ? jobsRes.rows[1] : jobsRes.rows[0];
    console.log(`✓ Active Job 1: "${testJob1.title}" at ${testJob1.company_name} (${testJob1.id})`);
    if (jobsRes.rows.length > 1) {
      console.log(`✓ Active Job 2: "${testJob2.title}" at ${testJob2.company_name} (${testJob2.id})\n`);
    }

    // ------------------------------------------------------------------------
    // 3. Saved Jobs — Save Job
    // ------------------------------------------------------------------------
    console.log("[3. SAVED JOBS: SAVE JOB]");
    await asCandidate(candidateA.user_id);

    // Candidate A saves testJob1
    const saveInsert = await pgClient.query(`
      insert into saved_jobs (candidate_id, job_id)
      values ($1, $2)
      returning id, candidate_id, job_id, created_at;
    `, [candidateA.candidate_id, testJob1.id]);

    assert.equal(saveInsert.rows.length, 1);
    const savedRecordId = saveInsert.rows[0].id;
    console.log(`✓ Candidate A saved Job 1 (saved_jobs id: ${savedRecordId})`);

    // Verify Candidate A can select own saved jobs
    const mySaved = await pgClient.query(`
      select sj.id, sj.job_id, sj.created_at, j.title, cp.company_name
      from saved_jobs sj
      join jobs j on j.id = sj.job_id
      left join company_profiles cp on cp.id = j.company_id;
    `);
    assert.equal(mySaved.rows.length, 1);
    assert.equal(mySaved.rows[0].job_id, testJob1.id);
    console.log(`✓ Candidate A queries saved jobs: retrieved "${mySaved.rows[0].title}" at ${mySaved.rows[0].company_name}\n`);

    // ------------------------------------------------------------------------
    // 4. Saved Jobs — Duplicate Save Handling
    // ------------------------------------------------------------------------
    console.log("[4. SAVED JOBS: DUPLICATE SAVE]");
    try {
      await pgClient.query(`
        insert into saved_jobs (candidate_id, job_id)
        values ($1, $2);
      `, [candidateA.candidate_id, testJob1.id]);
      assert.fail("Should have thrown unique constraint violation");
    } catch (err) {
      assert.equal(err.code, "23505", "Expected PostgreSQL unique violation error code 23505");
      console.log(`✓ Database enforces unique (candidate_id, job_id) constraint: blocked duplicate save.`);
    }

    const countAfterDuplicate = await pgClient.query(`select count(*)::int as count from saved_jobs;`);
    assert.equal(countAfterDuplicate.rows[0].count, 1, "Expected exactly 1 saved job row");
    console.log(`✓ Row count remains exactly 1 after duplicate save attempt.\n`);

    // ------------------------------------------------------------------------
    // 5. Saved Jobs — Closed Job Visibility
    // ------------------------------------------------------------------------
    console.log("[5. SAVED JOBS: CLOSED JOB VISIBILITY]");
    await asServiceRole();

    // Create a temporary closed job saved by Candidate A
    const closedJobRes = await pgClient.query(`
      insert into jobs (
        company_id, employer_id, created_by, title, description,
        status, minimum_experience, sap_module, location, work_arrangement,
        employment_type, job_type, experience_level, responsibilities, required_skills
      )
      values (
        (select company_id from jobs where id = $1),
        (select employer_id from jobs where id = $1),
        (select created_by from jobs where id = $1),
        'Archived SAP Lead Architect (Test Closed)',
        'This job is closed',
        'closed',
        10,
        'SAP S/4HANA',
        'Hyderabad, Telangana',
        'Hybrid',
        'Full-time',
        'Full-time',
        'Senior',
        'Architecture responsibilities',
        'SAP S/4HANA, ABAP'
      )
      returning id, title, status;
    `, [testJob1.id]);
    const closedJob = closedJobRes.rows[0];

    // Save this closed job
    await pgClient.query(`insert into saved_jobs (candidate_id, job_id) values ($1, $2);`, [candidateA.candidate_id, closedJob.id]);

    // Switch back to Candidate A authenticated role
    await asCandidate(candidateA.user_id);

    const savedWithClosed = await pgClient.query(`
      select sj.id, sj.job_id, j.title, j.status
      from saved_jobs sj
      join jobs j on j.id = sj.job_id
      where sj.job_id = $1;
    `, [closedJob.id]);

    assert.equal(savedWithClosed.rows.length, 1);
    assert.equal(savedWithClosed.rows[0].status, "closed");
    console.log(`✓ Closed saved job "${savedWithClosed.rows[0].title}" is accessible to candidate who saved it (status: ${savedWithClosed.rows[0].status})\n`);

    // Clean up the test closed job
    await asServiceRole();
    await pgClient.query(`delete from saved_jobs where job_id = $1;`, [closedJob.id]);
    await pgClient.query(`delete from jobs where id = $1;`, [closedJob.id]);

    // Switch back to Candidate A authenticated
    await asCandidate(candidateA.user_id);

    // ------------------------------------------------------------------------
    // 6. Saved Jobs — Unsave Job
    // ------------------------------------------------------------------------
    console.log("[6. SAVED JOBS: UNSAVE JOB]");
    const deleteRes = await pgClient.query(`
      delete from saved_jobs
      where candidate_id = $1 and job_id = $2
      returning id;
    `, [candidateA.candidate_id, testJob1.id]);
    assert.equal(deleteRes.rows.length, 1);
    console.log(`✓ Candidate A successfully unsaved Job 1.`);

    const afterUnsave = await pgClient.query(`select count(*)::int as count from saved_jobs;`);
    assert.equal(afterUnsave.rows[0].count, 0);
    console.log(`✓ Candidate A saved jobs count is now 0.\n`);

    // ------------------------------------------------------------------------
    // 7. Job Alerts — Create Alert
    // ------------------------------------------------------------------------
    console.log("[7. JOB ALERTS: CREATE ALERT]");
    const alertCreateRes = await pgClient.query(`
      insert into job_alerts (
        candidate_id, name, keywords, sap_modules, sap_module,
        location, experience, experience_min, experience_max,
        work_mode, employment_type, salary_min, salary_max,
        frequency, is_active
      )
      values (
        $1,
        'SAP Fiori Bangalore Hybrid',
        ARRAY['UI5', 'Fiori Elements'],
        ARRAY['SAP Fiori', 'SAP UI5'],
        'SAP Fiori',
        'Bengaluru, Karnataka',
        '5-8 Years',
        5,
        8,
        'Hybrid',
        'Full-time',
        18,
        28,
        'daily',
        true
      )
      returning id, candidate_id, name, keywords, sap_modules, location, experience, work_mode, salary_min, salary_max, frequency, is_active, created_at;
    `, [candidateA.candidate_id]);

    assert.equal(alertCreateRes.rows.length, 1);
    const createdAlert = alertCreateRes.rows[0];
    assert.equal(createdAlert.name, "SAP Fiori Bangalore Hybrid");
    assert.equal(createdAlert.is_active, true);
    assert.equal(createdAlert.frequency, "daily");
    assert.deepEqual(createdAlert.keywords, ["UI5", "Fiori Elements"]);
    assert.deepEqual(createdAlert.sap_modules, ["SAP Fiori", "SAP UI5"]);
    console.log(`✓ Candidate A created alert "${createdAlert.name}" (id: ${createdAlert.id})`);
    console.log(`  Modules: ${createdAlert.sap_modules.join(", ")} | Location: ${createdAlert.location} | Frequency: ${createdAlert.frequency}`);
    console.log(`  Active: ${createdAlert.is_active}\n`);

    // ------------------------------------------------------------------------
    // 8. Job Alerts — Edit Alert
    // ------------------------------------------------------------------------
    console.log("[8. JOB ALERTS: EDIT ALERT]");
    const editAlertRes = await pgClient.query(`
      update job_alerts
      set
        name = 'SAP Fiori Hyderabad Remote',
        location = 'Hyderabad, Telangana',
        work_mode = 'Remote',
        salary_min = 20,
        salary_max = 32,
        frequency = 'instant',
        updated_at = now()
      where id = $1
      returning id, name, location, work_mode, salary_min, salary_max, frequency, is_active, updated_at;
    `, [createdAlert.id]);

    assert.equal(editAlertRes.rows.length, 1);
    const updatedAlert = editAlertRes.rows[0];
    assert.equal(updatedAlert.name, "SAP Fiori Hyderabad Remote");
    assert.equal(updatedAlert.location, "Hyderabad, Telangana");
    assert.equal(updatedAlert.work_mode, "Remote");
    assert.equal(updatedAlert.frequency, "instant");
    console.log(`✓ Candidate A updated alert:`);
    console.log(`  Name: ${updatedAlert.name} | Location: ${updatedAlert.location} | Work Mode: ${updatedAlert.work_mode} | Freq: ${updatedAlert.frequency}\n`);

    // ------------------------------------------------------------------------
    // 9. Job Alerts — Pause & Resume Alert
    // ------------------------------------------------------------------------
    console.log("[9. JOB ALERTS: PAUSE & RESUME]");
    // Pause
    const pauseRes = await pgClient.query(`
      update job_alerts
      set is_active = false, updated_at = now()
      where id = $1
      returning id, is_active;
    `, [createdAlert.id]);
    assert.equal(pauseRes.rows[0].is_active, false);
    console.log(`✓ Candidate A paused alert (is_active: false).`);

    // Resume
    const resumeRes = await pgClient.query(`
      update job_alerts
      set is_active = true, updated_at = now()
      where id = $1
      returning id, is_active;
    `, [createdAlert.id]);
    assert.equal(resumeRes.rows[0].is_active, true);
    console.log(`✓ Candidate A resumed alert (is_active: true).\n`);

    // ------------------------------------------------------------------------
    // 10. Security & RLS Isolation Tests (Candidate A vs Candidate B)
    // ------------------------------------------------------------------------
    console.log("[10. SECURITY & RLS ISOLATION TESTS]");

    // Candidate A saves Job 1 again
    await pgClient.query(`
      insert into saved_jobs (candidate_id, job_id)
      values ($1, $2);
    `, [candidateA.candidate_id, testJob1.id]);

    // Switch to Candidate B authenticated session
    await asCandidate(candidateB.user_id);

    // Test 10a: Candidate B cannot select Candidate A's saved jobs
    const bSavedRes = await pgClient.query(`select * from saved_jobs;`);
    assert.equal(bSavedRes.rows.length, 0, "Candidate B must not see Candidate A's saved jobs");
    console.log(`✓ RLS Check 1: Candidate B selects saved_jobs -> 0 rows (Candidate A's saved job is invisible).`);

    // Test 10b: Candidate B cannot delete Candidate A's saved job
    const bDeleteSavedRes = await pgClient.query(`delete from saved_jobs where candidate_id = $1 returning id;`, [candidateA.candidate_id]);
    assert.equal(bDeleteSavedRes.rows.length, 0, "Candidate B must not be able to delete Candidate A's saved job");
    console.log(`✓ RLS Check 2: Candidate B deletes Candidate A's saved job -> 0 rows affected (blocked by RLS).`);

    // Test 10c: Candidate B cannot insert a saved job with Candidate A's candidate_id
    try {
      await pgClient.query(`
        insert into saved_jobs (candidate_id, job_id)
        values ($1, $2);
      `, [candidateA.candidate_id, testJob1.id]);
      assert.fail("Should have failed RLS insert policy");
    } catch (err) {
      assert(err.message.includes("row-level security") || err.code === "42501", `Expected RLS violation, got: ${err.message}`);
      console.log(`✓ RLS Check 3: Candidate B inserts saved job with Candidate A's ID -> blocked by RLS policy.`);
    }

    // Test 10d: Candidate B cannot select Candidate A's job alerts
    const bAlertsRes = await pgClient.query(`select * from job_alerts;`);
    assert.equal(bAlertsRes.rows.length, 0, "Candidate B must not see Candidate A's job alerts");
    console.log(`✓ RLS Check 4: Candidate B selects job_alerts -> 0 rows (Candidate A's alert is invisible).`);

    // Test 10e: Candidate B cannot update Candidate A's job alert
    const bUpdateAlertRes = await pgClient.query(`
      update job_alerts set name = 'Hacked by B' where id = $1 returning id;
    `, [createdAlert.id]);
    assert.equal(bUpdateAlertRes.rows.length, 0, "Candidate B must not be able to update Candidate A's alert");
    console.log(`✓ RLS Check 5: Candidate B updates Candidate A's alert -> 0 rows affected (blocked by RLS).`);

    // Test 10f: Candidate B cannot delete Candidate A's job alert
    const bDeleteAlertRes = await pgClient.query(`
      delete from job_alerts where id = $1 returning id;
    `, [createdAlert.id]);
    assert.equal(bDeleteAlertRes.rows.length, 0, "Candidate B must not be able to delete Candidate A's alert");
    console.log(`✓ RLS Check 6: Candidate B deletes Candidate A's alert -> 0 rows affected (blocked by RLS).`);

    // Test 10g: Candidate B cannot insert an alert with Candidate A's candidate_id
    try {
      await pgClient.query(`
        insert into job_alerts (candidate_id, name, keywords, sap_modules)
        values ($1, 'Fake Alert', ARRAY['test'], ARRAY['SAP Fiori']);
      `, [candidateA.candidate_id]);
      assert.fail("Should have failed RLS insert policy");
    } catch (err) {
      assert(err.message.includes("row-level security") || err.code === "42501", `Expected RLS violation, got: ${err.message}`);
      console.log(`✓ RLS Check 7: Candidate B inserts alert with Candidate A's ID -> blocked by RLS policy.\n`);
    }

    // ------------------------------------------------------------------------
    // 11. Delete Alert (as Candidate A)
    // ------------------------------------------------------------------------
    console.log("[11. JOB ALERTS: DELETE ALERT]");
    // Switch back to Candidate A
    await asCandidate(candidateA.user_id);

    const deleteAlertRes = await pgClient.query(`
      delete from job_alerts where id = $1 returning id;
    `, [createdAlert.id]);
    assert.equal(deleteAlertRes.rows.length, 1);
    console.log(`✓ Candidate A successfully deleted alert.`);

    const alertsAfterDelete = await pgClient.query(`select count(*)::int as count from job_alerts;`);
    assert.equal(alertsAfterDelete.rows[0].count, 0);
    console.log(`✓ Candidate A job alerts count is now 0.\n`);

    // ------------------------------------------------------------------------
    // 12. SPRINT 4 APPLICATION REGRESSION CHECK
    // ------------------------------------------------------------------------
    console.log("[12. SPRINT 4 APPLICATION REGRESSION CHECK]");
    // Clean up any existing application for testJob1
    await asServiceRole();
    await pgClient.query(`delete from job_applications where candidate_id = $1 and job_id = $2;`, [candidateA.candidate_id, testJob1.id]);

    await asCandidate(candidateA.user_id);

    const questionsRes = await pgClient.query(`
      select id, question, question_type, required, options
      from job_application_questions
      where job_id = $1
      order by display_order asc;
    `, [testJob1.id]);

    const answersPayload = questionsRes.rows.map((q) => {
      let ans = "Yes";
      if (q.question_type === "number") ans = "5";
      else if (q.question_type === "yes_no") ans = "true";
      else if (q.question_type === "single_select") ans = Array.isArray(q.options) && q.options.length ? q.options[0] : "30 Days";
      else if (q.question_type === "textarea") ans = "Experienced in SAP enterprise solutions and implementations.";
      return { question_id: q.id, answer: ans };
    });

    const submitAppRes = await pgClient.query(`
      select public.submit_candidate_application($1, null, 'Test cover letter', $2::jsonb);
    `, [testJob1.id, JSON.stringify(answersPayload)]);
    const appId = submitAppRes.rows[0].submit_candidate_application;
    assert(appId, "Expected valid application ID from submit_candidate_application");
    console.log(`✓ Candidate application submitted successfully (appId: ${appId})`);

    // Verify application status history exists
    const historyRes = await pgClient.query(`
      select * from application_status_history where application_id = $1;
    `, [appId]);
    assert(historyRes.rows.length >= 1, "Status history must record initial submission");
    console.log(`✓ Application status history verified (${historyRes.rows.length} records)`);

    // Clean up application & saved jobs
    await asServiceRole();
    await pgClient.query(`delete from job_applications where id = $1;`, [appId]);
    await pgClient.query(`delete from saved_jobs where candidate_id = $1;`, [candidateA.candidate_id]);

    console.log("✓ Sprint 4 application submission regression check passed!\n");

    console.log("================================================================");
    console.log("ALL SPRINT 5 PHASE B INTEGRATION TESTS PASSED PERFECTLY! 🚀");
    console.log("================================================================");
  } finally {
    await pgClient.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Test Suite Failed:", err);
  process.exit(1);
});
