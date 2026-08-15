/**
 * Automated test script for Employer Account Deletion RPC and Service
 */

import dns from "node:dns";
import assert from "node:assert/strict";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";

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

const client = new pg.Client({ connectionString });

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
  await client.connect();
  console.log("==================================================================");
  console.log("   EMPLOYER ACCOUNT DELETION TEST SUITE                           ");
  console.log("==================================================================\n");

  const testOwnerId = uuidv4();
  const testRecruiterId = uuidv4();
  const testCandidateId = uuidv4();
  const companyId = uuidv4();
  const employerProfileId = uuidv4();
  const jobId = uuidv4();

  try {
    // 1. Setup Candidate, Employer Owner, and Recruiter
    console.log("--- 1. Provisioning Test Accounts ---");
    // Candidate
    await client.query(`
      insert into auth.users (id, email, raw_user_meta_data, role, aud)
      values ($1, 'del_cand@test.com', '{"role":"candidate"}', 'authenticated', 'authenticated');
    `, [testCandidateId]);
    await client.query(`
      insert into public.profiles (user_id, role, first_name, last_name, email)
      values ($1, 'candidate', 'Delete', 'Candidate', 'del_cand@test.com')
      on conflict (user_id) do update set role = 'candidate';
    `, [testCandidateId]);

    // Employer Owner
    await client.query(`
      insert into auth.users (id, email, raw_user_meta_data, role, aud)
      values ($1, 'del_owner@test.com', '{"role":"employer"}', 'authenticated', 'authenticated');
    `, [testOwnerId]);
    await client.query(`
      insert into public.profiles (user_id, role, first_name, last_name, email)
      values ($1, 'employer', 'Delete', 'Owner', 'del_owner@test.com')
      on conflict (user_id) do update set role = 'employer';
    `, [testOwnerId]);
    const compRes = await client.query(`
      insert into public.company_profiles (id, user_id, company_name, setup_complete)
      values ($1, $2, 'Delete Test Corp', true)
      on conflict (user_id) do update set company_name = 'Delete Test Corp', setup_complete = true
      returning id;
    `, [companyId, testOwnerId]);
    const actualCompanyId = compRes.rows[0]?.id || companyId;

    await client.query(`
      insert into public.employer_profiles (id, user_id, company_name)
      values ($1, $2, 'Delete Test Corp')
      on conflict do nothing;
    `, [employerProfileId, testOwnerId]);
    // Retrieve actual employer_profile id if trigger created one
    const empProfRes = await client.query(`select id from public.employer_profiles where user_id = $1 limit 1;`, [testOwnerId]);
    const actualEmployerProfId = empProfRes.rows[0]?.id || employerProfileId;

    await client.query(`
      insert into public.employer_accounts (user_id, company_id, role, status)
      values ($1, $2, 'owner', 'active')
      on conflict do nothing;
    `, [testOwnerId, actualCompanyId]);

    // Recruiter under Employer
    await client.query(`
      insert into auth.users (id, email, raw_user_meta_data, role, aud)
      values ($1, 'del_recruiter@test.com', '{"role":"employer"}', 'authenticated', 'authenticated');
    `, [testRecruiterId]);
    await client.query(`
      insert into public.profiles (user_id, role, first_name, last_name, email)
      values ($1, 'employer', 'Delete', 'Recruiter', 'del_recruiter@test.com')
      on conflict (user_id) do update set role = 'employer';
    `, [testRecruiterId]);
    await client.query(`
      insert into public.employer_accounts (user_id, company_id, role, status)
      values ($1, $2, 'recruiter', 'active')
      on conflict do nothing;
    `, [testRecruiterId, actualCompanyId]);

    // Create a job for the company
    await client.query(`
      insert into public.jobs (id, employer_id, company_id, created_by, title, sap_module, job_type, employment_type, work_arrangement, experience_level, location, description, status)
      values ($1, $2, $3, $4, 'SAP Test Deletion Job', 'SAP MM', 'Full-time', 'Full-time', 'On-site', 'Mid Level', 'Bangalore', 'Job for deletion test', 'draft');
    `, [jobId, actualEmployerProfId, actualCompanyId, testOwnerId]);

    report(true, "Test accounts and test job successfully created");

    // 2. Candidate cannot call delete_employer_account
    console.log("\n--- 2. Role Boundary Security ---");
    let candidateBlocked = false;
    try {
      await client.query(`
        set local "request.jwt.claims" = '{"sub":"${testCandidateId}","role":"authenticated"}';
        select public.delete_employer_account();
      `);
    } catch (err) {
      candidateBlocked = err.message.includes("FORBIDDEN_NOT_AN_EMPLOYER");
    }
    report(candidateBlocked, "Candidate is forbidden from calling delete_employer_account");

    // 3. Recruiter deletes own account
    console.log("\n--- 3. Recruiter Deletes Own Account ---");
    await client.query(`
      set local "request.jwt.claims" = '{"sub":"${testRecruiterId}","role":"authenticated"}';
      select public.delete_employer_account();
    `);

    const recruiterAccountCheck = await client.query(
      `select 1 from public.employer_accounts where user_id = $1`,
      [testRecruiterId]
    );
    const recruiterUserCheck = await client.query(
      `select 1 from auth.users where id = $1`,
      [testRecruiterId]
    );
    const companyStillExists = await client.query(
      `select 1 from public.company_profiles where id = $1`,
      [actualCompanyId]
    );

    report(recruiterAccountCheck.rowCount === 0, "Recruiter employer_account record deleted");
    report(recruiterUserCheck.rowCount === 0, "Recruiter auth.users record deleted");
    report(companyStillExists.rowCount === 1, "Company profile remains intact when recruiter deletes account");

    // 4. Company Owner deletes own account (full cascade)
    console.log("\n--- 4. Company Owner Deletes Account (Full Cascade) ---");
    await client.query(`
      set local "request.jwt.claims" = '{"sub":"${testOwnerId}","role":"authenticated"}';
      select public.delete_employer_account();
    `);

    const ownerUserCheck = await client.query(
      `select 1 from auth.users where id = $1`,
      [testOwnerId]
    );
    const ownerProfileCheck = await client.query(
      `select 1 from public.profiles where user_id = $1`,
      [testOwnerId]
    );
    const companyCheck = await client.query(
      `select 1 from public.company_profiles where id = $1`,
      [actualCompanyId]
    );
    const jobsCheck = await client.query(
      `select 1 from public.jobs where company_id = $1`,
      [actualCompanyId]
    );
    const employerProfilesCheck = await client.query(
      `select 1 from public.employer_profiles where user_id = $1`,
      [testOwnerId]
    );

    report(ownerUserCheck.rowCount === 0, "Owner auth.users record deleted");
    report(ownerProfileCheck.rowCount === 0, "Owner public.profiles record deleted");
    report(companyCheck.rowCount === 0, "Company profile deleted in cascade");
    report(jobsCheck.rowCount === 0, "Company jobs deleted in cascade");
    report(employerProfilesCheck.rowCount === 0, "Employer profile deleted in cascade");

  } finally {
    // Cleanup any lingering records
    await client.query(`delete from public.jobs where id = $1;`, [jobId]);
    await client.query(`delete from public.employer_accounts where user_id in ($1, $2);`, [testOwnerId, testRecruiterId]);
    await client.query(`delete from public.employer_profiles where user_id in ($1, $2);`, [testOwnerId, testRecruiterId]);
    await client.query(`delete from public.company_profiles where user_id in ($1, $2);`, [testOwnerId, testRecruiterId]);
    await client.query(`delete from public.profiles where user_id in ($1, $2, $3);`, [testOwnerId, testRecruiterId, testCandidateId]);
    await client.query(`delete from auth.users where id in ($1, $2, $3);`, [testOwnerId, testRecruiterId, testCandidateId]);
    await client.end();
  }

  console.log("\n==================================================================");
  console.log(`   TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED `);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error("Test suite error:", err);
  process.exit(1);
});
