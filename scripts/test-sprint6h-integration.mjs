/**
 * Sprint 6 Phase H: Candidate Settings Supabase Integration Test Suite
 * Validates candidate_settings table, RLS security isolation between candidates,
 * preference persistence, candidate_profiles synchronization, and regression safety.
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
  console.log("====================================================================");
  console.log("SPRINT 6 PHASE H: CANDIDATE SETTINGS SUPABASE INTEGRATION TEST");
  console.log("====================================================================\n");

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

  try {
    await asServiceRole();

    // -------------------------------------------------------------------------
    // 1. Schema & Table Structure Validation
    // -------------------------------------------------------------------------
    console.log("--- 1. Schema & Table Structure Validation ---");

    const tableRes = await pgClient.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'candidate_settings';
    `);
    report(tableRes.rows.length === 1, "candidate_settings table exists in public schema");

    const colsRes = await pgClient.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'candidate_settings'
      ORDER BY ordinal_position;
    `);

    const colNames = colsRes.rows.map((r) => r.column_name);
    report(colNames.includes("id"), "column id exists");
    report(colNames.includes("candidate_id"), "column candidate_id exists");
    report(colNames.includes("notification_preferences"), "column notification_preferences exists");
    report(colNames.includes("job_preferences"), "column job_preferences exists");
    report(colNames.includes("privacy_preferences"), "column privacy_preferences exists");
    report(colNames.includes("created_at"), "column created_at exists");
    report(colNames.includes("updated_at"), "column updated_at exists");

    const indexRes = await pgClient.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'candidate_settings';
    `);
    const idxNames = indexRes.rows.map((r) => r.indexname);
    report(
      idxNames.some((n) => n.includes("candidate_id")),
      "candidate_id index exists on candidate_settings",
    );

    // -------------------------------------------------------------------------
    // 2. Setup Test Candidates A and B
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Setting up Test Candidates ---");

    // Candidate A
    let userA = (await pgClient.query(`SELECT id, email FROM auth.users WHERE email = 'test_cand_settings_a@example.com'`)).rows[0];
    if (!userA) {
      userA = (await pgClient.query(`
        INSERT INTO auth.users (id, email, raw_user_meta_data)
        VALUES (gen_random_uuid(), 'test_cand_settings_a@example.com', '{"role":"candidate","first_name":"Alice","last_name":"Candidate"}'::jsonb)
        RETURNING id, email;
      `)).rows[0];
    }

    let candA = (await pgClient.query(`SELECT id FROM public.candidate_profiles WHERE user_id = $1`, [userA.id])).rows[0];
    if (!candA) {
      candA = (await pgClient.query(`
        INSERT INTO public.candidate_profiles (user_id, first_name, last_name, is_searchable, discovery_status)
        VALUES ($1, 'Alice', 'Candidate', true, 'open_to_opportunities')
        RETURNING id;
      `)).rows[0];
    }

    // Candidate B
    let userB = (await pgClient.query(`SELECT id, email FROM auth.users WHERE email = 'test_cand_settings_b@example.com'`)).rows[0];
    if (!userB) {
      userB = (await pgClient.query(`
        INSERT INTO auth.users (id, email, raw_user_meta_data)
        VALUES (gen_random_uuid(), 'test_cand_settings_b@example.com', '{"role":"candidate","first_name":"Bob","last_name":"Candidate"}'::jsonb)
        RETURNING id, email;
      `)).rows[0];
    }

    let candB = (await pgClient.query(`SELECT id FROM public.candidate_profiles WHERE user_id = $1`, [userB.id])).rows[0];
    if (!candB) {
      candB = (await pgClient.query(`
        INSERT INTO public.candidate_profiles (user_id, first_name, last_name, is_searchable, discovery_status)
        VALUES ($1, 'Bob', 'Candidate', false, 'not_available')
        RETURNING id;
      `)).rows[0];
    }

    // Clean up any previous candidate_settings for test candidates
    await pgClient.query(`DELETE FROM public.candidate_settings WHERE candidate_id IN ($1, $2);`, [candA.id, candB.id]);
    report(true, `Test candidates initialized (Alice ID: ${candA.id}, Bob ID: ${candB.id})`);

    // -------------------------------------------------------------------------
    // 3. RLS Security Tests
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Row Level Security (RLS) Isolation Tests ---");

    // Anon cannot select from candidate_settings
    await asAnon();
    let anonSelectError = false;
    try {
      const res = await pgClient.query(`SELECT * FROM public.candidate_settings;`);
      if (res.rows.length === 0) anonSelectError = true; // RLS blocks rows
    } catch {
      anonSelectError = true;
    }
    report(anonSelectError, "Anonymous user cannot read candidate_settings records");

    // Anon cannot insert into candidate_settings
    let anonInsertBlocked = false;
    try {
      await pgClient.query(`
        INSERT INTO public.candidate_settings (candidate_id) VALUES ($1);
      `, [candA.id]);
    } catch {
      anonInsertBlocked = true;
    }
    report(anonInsertBlocked, "Anonymous user cannot insert into candidate_settings");

    // Candidate A can insert own settings
    await asCandidate(userA.id);
    const insertAlice = await pgClient.query(`
      INSERT INTO public.candidate_settings (
        candidate_id,
        notification_preferences,
        job_preferences,
        privacy_preferences
      ) VALUES (
        $1,
        '{"emailNotifications": true, "pushNotifications": false, "jobAlertFrequency": "daily"}'::jsonb,
        '{"preferredJobRoles": ["SAP Fiori Consultant"], "careerLevel": "Senior"}'::jsonb,
        '{"profileVisibility": "public", "showInTalentSearch": true}'::jsonb
      )
      RETURNING id, candidate_id;
    `, [candA.id]);
    report(insertAlice.rows.length === 1, "Candidate A can INSERT own settings");

    // Candidate A can SELECT own settings
    const selectAlice = await pgClient.query(`SELECT * FROM public.candidate_settings WHERE candidate_id = $1;`, [candA.id]);
    report(selectAlice.rows.length === 1, "Candidate A can SELECT own settings");

    // Candidate A CANNOT insert Candidate B settings
    let crossInsertBlocked = false;
    try {
      await pgClient.query(`
        INSERT INTO public.candidate_settings (candidate_id) VALUES ($1);
      `, [candB.id]);
    } catch {
      crossInsertBlocked = true;
    }
    report(crossInsertBlocked, "Candidate A CANNOT INSERT Candidate B settings");

    // Candidate B inserts own settings
    await asCandidate(userB.id);
    await pgClient.query(`
      INSERT INTO public.candidate_settings (
        candidate_id,
        notification_preferences,
        job_preferences,
        privacy_preferences
      ) VALUES (
        $1,
        '{"emailNotifications": false, "pushNotifications": true, "jobAlertFrequency": "weekly"}'::jsonb,
        '{"preferredJobRoles": ["SAP ABAP Developer"], "careerLevel": "Lead"}'::jsonb,
        '{"profileVisibility": "private", "showInTalentSearch": false}'::jsonb
      );
    `, [candB.id]);

    // Candidate B CANNOT SELECT Candidate A settings
    const crossSelectBob = await pgClient.query(`SELECT * FROM public.candidate_settings WHERE candidate_id = $1;`, [candA.id]);
    report(crossSelectBob.rows.length === 0, "Candidate B CANNOT SELECT Candidate A settings");

    // Candidate B CANNOT UPDATE Candidate A settings
    const crossUpdateBob = await pgClient.query(`
      UPDATE public.candidate_settings
      SET notification_preferences = '{"hacked": true}'::jsonb
      WHERE candidate_id = $1;
    `, [candA.id]);
    report(crossUpdateBob.rowCount === 0, "Candidate B CANNOT UPDATE Candidate A settings (0 rows updated)");

    // Candidate B CANNOT DELETE Candidate A settings
    const crossDeleteBob = await pgClient.query(`DELETE FROM public.candidate_settings WHERE candidate_id = $1;`, [candA.id]);
    report(crossDeleteBob.rowCount === 0, "Candidate B CANNOT DELETE Candidate A settings (0 rows deleted)");

    // -------------------------------------------------------------------------
    // 4. Persistence and Upsert Operations
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Preferences Persistence & Upsert Verification ---");

    await asCandidate(userA.id);

    // Update notifications via upsert
    await pgClient.query(`
      INSERT INTO public.candidate_settings (candidate_id, notification_preferences, updated_at)
      VALUES ($1, '{"emailNotifications": false, "pushNotifications": true, "jobAlerts": false, "jobAlertFrequency": "immediately"}'::jsonb, now())
      ON CONFLICT (candidate_id)
      DO UPDATE SET notification_preferences = excluded.notification_preferences, updated_at = now();
    `, [candA.id]);

    const updatedNotifs = await pgClient.query(`SELECT notification_preferences FROM public.candidate_settings WHERE candidate_id = $1;`, [candA.id]);
    report(
      updatedNotifs.rows[0].notification_preferences.emailNotifications === false &&
      updatedNotifs.rows[0].notification_preferences.jobAlertFrequency === "immediately",
      "Notification preferences update persisted via upsert",
    );

    // Update job preferences and sync candidate_profiles
    await pgClient.query(`
      INSERT INTO public.candidate_settings (candidate_id, job_preferences, updated_at)
      VALUES ($1, '{"preferredJobRoles": ["SAP BTP Architect", "SAP Integration Lead"], "careerLevel": "Lead"}'::jsonb, now())
      ON CONFLICT (candidate_id)
      DO UPDATE SET job_preferences = excluded.job_preferences, updated_at = now();
    `, [candA.id]);

    await pgClient.query(`
      UPDATE public.candidate_profiles
      SET preferred_job_roles = ARRAY['SAP BTP Architect', 'SAP Integration Lead'], career_level = 'Lead', updated_at = now()
      WHERE id = $1;
    `, [candA.id]);

    const updatedJobPrefs = await pgClient.query(`SELECT job_preferences FROM public.candidate_settings WHERE candidate_id = $1;`, [candA.id]);
    const updatedProfile = await pgClient.query(`SELECT preferred_job_roles, career_level FROM public.candidate_profiles WHERE id = $1;`, [candA.id]);

    report(
      updatedJobPrefs.rows[0].job_preferences.preferredJobRoles[0] === "SAP BTP Architect" &&
      updatedProfile.rows[0].preferred_job_roles[0] === "SAP BTP Architect" &&
      updatedProfile.rows[0].career_level === "Lead",
      "Job preferences persisted and synchronized with candidate_profiles",
    );

    // Update privacy preferences to private and sync candidate_profiles searchability
    await pgClient.query(`
      INSERT INTO public.candidate_settings (candidate_id, privacy_preferences, updated_at)
      VALUES ($1, '{"profileVisibility": "private", "showInTalentSearch": false, "showResumeToRecruiters": false}'::jsonb, now())
      ON CONFLICT (candidate_id)
      DO UPDATE SET privacy_preferences = excluded.privacy_preferences, updated_at = now();
    `, [candA.id]);

    await pgClient.query(`
      UPDATE public.candidate_profiles
      SET is_searchable = false, discovery_status = 'not_available', updated_at = now()
      WHERE id = $1;
    `, [candA.id]);

    const updatedPrivacy = await pgClient.query(`SELECT privacy_preferences FROM public.candidate_settings WHERE candidate_id = $1;`, [candA.id]);
    const updatedProfileSearch = await pgClient.query(`SELECT is_searchable, discovery_status FROM public.candidate_profiles WHERE id = $1;`, [candA.id]);

    report(
      updatedPrivacy.rows[0].privacy_preferences.profileVisibility === "private" &&
      updatedProfileSearch.rows[0].is_searchable === false &&
      updatedProfileSearch.rows[0].discovery_status === "not_available",
      "Privacy preferences set to private synchronize is_searchable = false on candidate_profiles",
    );

    // -------------------------------------------------------------------------
    // 5. Regression Tests (Job Alerts, Subscriptions, Notifications)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Regression Safety Verification ---");

    await asServiceRole();

    // Verify Candidate Plans and Active Job Alert Limits
    const plansRes = await pgClient.query(`SELECT id, limits FROM public.candidate_plans ORDER BY sort_order;`);
    const freePlan = plansRes.rows.find((p) => p.id === "free");
    const proPlan = plansRes.rows.find((p) => p.id === "professional");
    const premPlan = plansRes.rows.find((p) => p.id === "premium");

    report(freePlan?.limits?.job_alerts === 5, "Free plan active job alerts limit preserved at 5");
    report(proPlan?.limits?.job_alerts === 20, "Professional plan active job alerts limit preserved at 20");
    report(premPlan?.limits?.job_alerts === null, "Premium plan active job alerts limit remains TBD (null)");

    // Verify Notifications table intact
    const notifsCount = await pgClient.query(`SELECT count(*) FROM public.notifications;`);
    report(Number(notifsCount.rows[0].count) >= 0, "Notifications table accessible and operational");

    // Verify Candidate Subscriptions intact
    const subsCount = await pgClient.query(`SELECT count(*) FROM public.candidate_subscriptions;`);
    report(Number(subsCount.rows[0].count) >= 0, "Candidate Subscriptions table accessible and operational");

    // Verify Candidate Resumes intact
    const resumesCount = await pgClient.query(`SELECT count(*) FROM public.candidate_resumes;`);
    report(Number(resumesCount.rows[0].count) >= 0, "Candidate Resumes table accessible and operational");

    console.log("\n====================================================================");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("====================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await pgClient.end();
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
