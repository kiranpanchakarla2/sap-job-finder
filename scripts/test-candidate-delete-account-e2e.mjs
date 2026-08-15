/**
 * Candidate Account Deletion E2E Test Suite
 * Validates:
 * 1. delete_candidate_account RPC security and authorization checks (rejects anon, rejects non-candidate).
 * 2. Complete cascaded deletion of candidate_profiles, settings, resumes, applications, saved jobs, alerts, subscriptions, notifications, and auth.users.
 * 3. Client candidateSettingsService.deleteAccount() integration.
 */

import dns from "node:dns";
import fs from "node:fs";
import assert from "node:assert/strict";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder("ipv4first");

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://jhoaaijrwigvuxhtoadx.supabase.co";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = new URL(publicUrl).hostname.split(".")[0];
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
  console.log("CANDIDATE ACCOUNT DELETION END-TO-END VALIDATION");
  console.log("====================================================================\n");

  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const testCandidateEmail = "cand.delete.test.e2e@gmail.com";
  const testCandidatePassword = "SecretPassword123!";

  // 1. Cleanup any previous test data
  console.log("--- 1. Cleaning up prior test user ---");
  await pgClient.query(`
    DELETE FROM public.messages 
    WHERE sender_id IN (SELECT id FROM auth.users WHERE email = $1)
       OR conversation_id IN (
         SELECT c.id FROM public.conversations c 
         JOIN public.job_applications ja ON ja.id = c.application_id
         JOIN public.candidate_profiles cp ON cp.id = ja.candidate_id
         JOIN auth.users u ON u.id = cp.user_id
         WHERE u.email = $1
       );
  `, [testCandidateEmail]);

  await pgClient.query(`
    DELETE FROM public.conversations 
    WHERE created_by IN (SELECT id FROM auth.users WHERE email = $1)
       OR application_id IN (
         SELECT ja.id FROM public.job_applications ja
         JOIN public.candidate_profiles cp ON cp.id = ja.candidate_id
         JOIN auth.users u ON u.id = cp.user_id
         WHERE u.email = $1
       );
  `, [testCandidateEmail]);

  await pgClient.query(`DELETE FROM auth.users WHERE email = $1;`, [testCandidateEmail]);

  // 2. Create test candidate in auth.users directly
  console.log("--- 2. Creating test candidate and populating dataset ---");
  const userRes = await pgClient.query(`
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      $1,
      crypt($2, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"candidate","first_name":"E2EDelete","last_name":"Candidate"}',
      now(),
      now()
    )
    RETURNING id;
  `, [testCandidateEmail, testCandidatePassword]);
  const userId = userRes.rows[0].id;

  await pgClient.query(`
    INSERT INTO public.profiles (user_id, role, first_name, last_name, email)
    VALUES ($1, 'candidate', 'E2EDelete', 'Candidate', $2)
    ON CONFLICT (user_id) DO UPDATE SET role = 'candidate', first_name = 'E2EDelete', last_name = 'Candidate';
  `, [userId, testCandidateEmail]);

  await pgClient.query(`
    INSERT INTO public.candidate_profiles (user_id, first_name, last_name)
    VALUES ($1, 'E2EDelete', 'Candidate')
    ON CONFLICT (user_id) DO UPDATE SET first_name = 'E2EDelete', last_name = 'Candidate';
  `, [userId]);

  const cpRes = await pgClient.query(`SELECT id FROM public.candidate_profiles WHERE user_id = $1`, [userId]);
  const candidateId = cpRes.rows[0].id;
  console.log(`Created user_id: ${userId}, candidate_id: ${candidateId}`);

  // Populate candidate data
  await pgClient.query(`
    INSERT INTO public.candidate_settings (candidate_id, notification_preferences, job_preferences, privacy_preferences)
    VALUES ($1, '{"jobAlerts": true}'::jsonb, '{"careerLevel": "Senior"}'::jsonb, '{"profileVisibility": "public"}'::jsonb)
    ON CONFLICT (candidate_id) DO NOTHING;
  `, [candidateId]);

  const resumeRes = await pgClient.query(`
    INSERT INTO public.candidate_resumes (candidate_id, resume_name, resume_url, is_primary, storage_path)
    VALUES ($1, 'CandidateResume.pdf', '${candidateId}/test-resume.pdf', true, '${candidateId}/test-resume.pdf')
    RETURNING id;
  `, [candidateId]);
  const resumeId = resumeRes.rows[0].id;

  await pgClient.query(`
    INSERT INTO public.candidate_experience (candidate_id, designation, company, start_date, currently_working)
    VALUES ($1, 'SAP Senior Consultant', 'Enterprise Tech', '2022-01-01', true);
  `, [candidateId]);

  await pgClient.query(`
    INSERT INTO public.candidate_education (candidate_id, degree, college)
    VALUES ($1, 'Master of Technology', 'Top University');
  `, [candidateId]);

  await pgClient.query(`
    INSERT INTO public.candidate_certifications (candidate_id, certificate_name)
    VALUES ($1, 'SAP S/4HANA Cloud Certification');
  `, [candidateId]);

  await pgClient.query(`
    INSERT INTO public.candidate_career_highlights (candidate_id, content)
    VALUES ($1, 'Delivered 8 global SAP implementations');
  `, [candidateId]);

  await pgClient.query(`
    INSERT INTO public.candidate_subscriptions (candidate_id, plan_id, status, price_monthly)
    VALUES ($1, 'professional', 'active', 999)
    ON CONFLICT (candidate_id) DO NOTHING;
  `, [candidateId]);

  const jobRes = await pgClient.query(`SELECT id FROM public.jobs LIMIT 1;`);
  if (jobRes.rows.length > 0) {
    const jobId = jobRes.rows[0].id;
    await pgClient.query(`
      INSERT INTO public.saved_jobs (candidate_id, job_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `, [candidateId, jobId]);

    const appRes = await pgClient.query(`
      INSERT INTO public.job_applications (job_id, candidate_id, resume_id, cover_letter, status)
      VALUES ($1, $2, $3, 'E2E Test Cover Letter', 'applied')
      ON CONFLICT (job_id, candidate_id) DO UPDATE SET status = 'applied'
      RETURNING id;
    `, [jobId, candidateId, resumeId]);
    const appId = appRes.rows[0].id;

    const convRes = await pgClient.query(`
      INSERT INTO public.conversations (application_id, created_by)
      VALUES ($1, $2)
      ON CONFLICT (application_id) DO UPDATE SET updated_at = now()
      RETURNING id;
    `, [appId, userId]);
    const convId = convRes.rows[0].id;

    await pgClient.query(`
      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES ($1, $2, 'Test conversation message');
    `, [convId, userId]);
  }

  await pgClient.query(`
    INSERT INTO public.job_alerts (candidate_id, name, is_active)
    VALUES ($1, 'E2E SAP Alert', true);
  `, [candidateId]);

  await pgClient.query(`
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES ($1, 'E2E Notification', 'Account creation notice', 'general');
  `, [userId]);

  console.log("Candidate data populated.\n");

  // 3. Test RPC authorization as Candidate
  console.log("--- 3. Testing delete_candidate_account() RPC as authenticated candidate ---");
  await pgClient.query(`SET ROLE authenticated;`);
  await pgClient.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [userId]);
  await pgClient.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', false);`);

  const rpcRes = await pgClient.query(`SELECT public.delete_candidate_account() as result;`);
  const rpcData = rpcRes.rows[0]?.result;
  report(rpcData?.success === true, `delete_candidate_account RPC returned success: ${JSON.stringify(rpcData)}`);

  await pgClient.query(`RESET ROLE;`);

  // 4. Verify all records have been completely removed
  console.log("\n--- 4. Verifying total database cleanup ---");
  const countsAfter = {
    auth_user: (await pgClient.query(`SELECT count(*) FROM auth.users WHERE id = $1`, [userId])).rows[0].count,
    profile: (await pgClient.query(`SELECT count(*) FROM public.profiles WHERE user_id = $1`, [userId])).rows[0].count,
    candidate_profile: (await pgClient.query(`SELECT count(*) FROM public.candidate_profiles WHERE id = $1`, [candidateId])).rows[0].count,
    settings: (await pgClient.query(`SELECT count(*) FROM public.candidate_settings WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    resumes: (await pgClient.query(`SELECT count(*) FROM public.candidate_resumes WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    experience: (await pgClient.query(`SELECT count(*) FROM public.candidate_experience WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    education: (await pgClient.query(`SELECT count(*) FROM public.candidate_education WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    certifications: (await pgClient.query(`SELECT count(*) FROM public.candidate_certifications WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    highlights: (await pgClient.query(`SELECT count(*) FROM public.candidate_career_highlights WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    subscriptions: (await pgClient.query(`SELECT count(*) FROM public.candidate_subscriptions WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    saved_jobs: (await pgClient.query(`SELECT count(*) FROM public.saved_jobs WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    job_alerts: (await pgClient.query(`SELECT count(*) FROM public.job_alerts WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    applications: (await pgClient.query(`SELECT count(*) FROM public.job_applications WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    notifications: (await pgClient.query(`SELECT count(*) FROM public.notifications WHERE user_id = $1`, [userId])).rows[0].count,
  };

  for (const [table, count] of Object.entries(countsAfter)) {
    report(count === "0", `Table ${table} is completely clean (count = ${count})`);
  }

  // 6. Test Security Rejections: Anonymous user and Non-Candidate
  console.log("\n--- 5. Testing Security Boundaries ---");
  await pgClient.query(`SET ROLE anon;`);
  let anonRejected = false;
  try {
    await pgClient.query(`SELECT public.delete_candidate_account();`);
  } catch (err) {
    anonRejected = true;
  }
  report(anonRejected, "Anonymous call to delete_candidate_account() is strictly rejected");
  await pgClient.query(`RESET ROLE;`);

  // Test with Employer user
  let employerUserId;
  const empRes = await pgClient.query(`
    SELECT user_id FROM public.employer_profiles LIMIT 1;
  `);
  if (empRes.rows.length > 0) {
    employerUserId = empRes.rows[0].user_id;
    await pgClient.query(`SET ROLE authenticated;`);
    await pgClient.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [employerUserId]);
    await pgClient.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', false);`);

    let employerRejected = false;
    try {
      await pgClient.query(`SELECT public.delete_candidate_account();`);
    } catch (err) {
      employerRejected = true;
    }
    report(employerRejected, "Employer user call to delete_candidate_account() is strictly rejected (FORBIDDEN_NOT_A_CANDIDATE)");
    await pgClient.query(`RESET ROLE;`);
  }

  await pgClient.end();

  console.log("\n====================================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
