/**
 * Comprehensive Automated Test Suite for Sprint 10C: Candidate & Employer Management
 */

import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runTests() {
  console.log("==================================================");
  console.log("STARTING SPRINT 10C AUTOMATED TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Schema & Column Checks
    console.log("\n[TEST 1] Schema & Table Column Verification");

    const profCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'status';
    `);
    assert(profCols.rows.length === 1, "profiles.status column exists");

    const candCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidate_profiles' AND column_name = 'status';
    `);
    assert(candCols.rows.length === 1, "candidate_profiles.status column exists");

    const compCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'company_profiles' AND column_name IN ('status', 'is_verified');
    `);
    assert(compCols.rows.length === 2, "company_profiles status and is_verified columns exist");

    // 2. RPC Functions Verification
    console.log("\n[TEST 2] Administrative RPC Functions Verification");

    const rpcList = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN (
          'admin_suspend_candidate',
          'admin_reactivate_candidate',
          'admin_suspend_employer',
          'admin_reactivate_employer',
          'admin_verify_employer'
        );
    `);
    assert(rpcList.rows.length === 5, `All 5 administrative RPCs exist in database (found ${rpcList.rows.length}/5)`);

    // 3. Query Candidate Profiles
    console.log("\n[TEST 3] Candidate Management Queries");

    const candQuery = await pool.query(`
      SELECT cp.id, cp.user_id, cp.first_name, cp.last_name, cp.status, p.email, p.status as profile_status
      FROM public.candidate_profiles cp
      LEFT JOIN public.profiles p ON p.user_id = cp.user_id
      LIMIT 5;
    `);
    assert(candQuery.rows.length > 0, `Successfully queried candidates from database (found ${candQuery.rows.length} records)`);

    const testCand = candQuery.rows[0];
    console.log(`  ℹ Candidate sample: ID ${testCand.id} (${testCand.first_name} ${testCand.last_name}, status: ${testCand.status})`);

    // 4. Test Candidate Suspend & Reactivate RPC
    console.log("\n[TEST 4] Candidate Suspension & Reactivation");

    // Set role context to super_admin
    const superAdminRes = await pool.query(`
      SELECT user_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;
    `);
    const superAdminUserId = superAdminRes.rows[0]?.user_id;
    assert(Boolean(superAdminUserId), `Found Super Admin user (${superAdminUserId})`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      await client.query(`SET LOCAL "request.jwt.claim.sub" = '${superAdminUserId}';`);

      // Execute admin_suspend_candidate directly
      const suspendCandRes = await client.query(`
        SELECT public.admin_suspend_candidate($1) as result;
      `, [testCand.id]);
      const suspendResult = suspendCandRes.rows[0]?.result;
      assert(suspendResult?.success === true && suspendResult?.status === "suspended", "admin_suspend_candidate succeeded");

      // Verify status updated in both tables
      const verifySuspended = await client.query(`
        SELECT cp.status as cand_status, p.status as prof_status
        FROM public.candidate_profiles cp
        JOIN public.profiles p ON p.user_id = cp.user_id
        WHERE cp.id = $1;
      `, [testCand.id]);
      assert(
        verifySuspended.rows[0]?.cand_status === "suspended" && verifySuspended.rows[0]?.prof_status === "suspended",
        "Candidate profile and auth profile are both marked 'suspended'"
      );

      // Reactivate candidate
      const reactivateCandRes = await client.query(`
        SELECT public.admin_reactivate_candidate($1) as result;
      `, [testCand.id]);
      const reactivateResult = reactivateCandRes.rows[0]?.result;
      assert(reactivateResult?.success === true && reactivateResult?.status === "active", "admin_reactivate_candidate succeeded");

      const verifyActive = await client.query(`
        SELECT cp.status as cand_status, p.status as prof_status
        FROM public.candidate_profiles cp
        JOIN public.profiles p ON p.user_id = cp.user_id
        WHERE cp.id = $1;
      `, [testCand.id]);
      assert(
        verifyActive.rows[0]?.cand_status === "active" && verifyActive.rows[0]?.prof_status === "active",
        "Candidate profile and auth profile are both restored to 'active'"
      );

      await client.query("COMMIT;");
    } catch (e) {
      await client.query("ROLLBACK;");
      throw e;
    } finally {
      client.release();
    }

    // 5. Query Employer Profiles
    console.log("\n[TEST 5] Employer Management Queries");

    const empQuery = await pool.query(`
      SELECT cp.id, cp.user_id, cp.company_name, cp.status, cp.is_verified, cp.work_email
      FROM public.company_profiles cp
      LIMIT 5;
    `);
    assert(empQuery.rows.length > 0, `Successfully queried employers from database (found ${empQuery.rows.length} records)`);

    const testEmp = empQuery.rows[0];
    console.log(`  ℹ Employer sample: ID ${testEmp.id} (${testEmp.company_name}, verified: ${testEmp.is_verified})`);

    // 6. Test Employer Verification RPC
    console.log("\n[TEST 6] Employer Verification Toggle");

    const empClient = await pool.connect();
    try {
      await empClient.query("BEGIN;");
      await empClient.query(`SET LOCAL "request.jwt.claim.sub" = '${superAdminUserId}';`);

      const verifyTrueRes = await empClient.query(`
        SELECT public.admin_verify_employer($1, true) as result;
      `, [testEmp.id]);
      assert(verifyTrueRes.rows[0]?.result?.is_verified === true, "admin_verify_employer(true) succeeded");

      const verifyCheck1 = await empClient.query(`
        SELECT is_verified FROM public.company_profiles WHERE id = $1;
      `, [testEmp.id]);
      assert(verifyCheck1.rows[0]?.is_verified === true, "company_profiles.is_verified is true");

      const verifyFalseRes = await empClient.query(`
        SELECT public.admin_verify_employer($1, false) as result;
      `, [testEmp.id]);
      assert(verifyFalseRes.rows[0]?.result?.is_verified === false, "admin_verify_employer(false) succeeded");

      // 7. Test Employer Suspend & Reactivate RPC
      console.log("\n[TEST 7] Employer Suspension & Reactivation");

      const suspendEmpRes = await empClient.query(`
        SELECT public.admin_suspend_employer($1) as result;
      `, [testEmp.id]);
      assert(suspendEmpRes.rows[0]?.result?.status === "suspended", "admin_suspend_employer succeeded");

      const empSuspendedCheck = await empClient.query(`
        SELECT cp.status as comp_status, p.status as prof_status, ea.status as ea_status
        FROM public.company_profiles cp
        JOIN public.profiles p ON p.user_id = cp.user_id
        LEFT JOIN public.employer_accounts ea ON ea.company_id = cp.id AND ea.user_id = cp.user_id
        WHERE cp.id = $1;
      `, [testEmp.id]);
      assert(
        empSuspendedCheck.rows[0]?.comp_status === "suspended" &&
        empSuspendedCheck.rows[0]?.prof_status === "suspended" &&
        (empSuspendedCheck.rows[0]?.ea_status === null || empSuspendedCheck.rows[0]?.ea_status === "suspended"),
        "Company profile, owner profile, and employer account are all suspended"
      );

      const reactivateEmpRes = await empClient.query(`
        SELECT public.admin_reactivate_employer($1) as result;
      `, [testEmp.id]);
      assert(reactivateEmpRes.rows[0]?.result?.status === "active", "admin_reactivate_employer succeeded");

      const empActiveCheck = await empClient.query(`
        SELECT cp.status as comp_status, p.status as prof_status, ea.status as ea_status
        FROM public.company_profiles cp
        JOIN public.profiles p ON p.user_id = cp.user_id
        LEFT JOIN public.employer_accounts ea ON ea.company_id = cp.id AND ea.user_id = cp.user_id
        WHERE cp.id = $1;
      `, [testEmp.id]);
      assert(
        empActiveCheck.rows[0]?.comp_status === "active" &&
        empActiveCheck.rows[0]?.prof_status === "active" &&
        (empActiveCheck.rows[0]?.ea_status === null || empActiveCheck.rows[0]?.ea_status === "active"),
        "Company profile, owner profile, and employer account are all restored to active"
      );

      await empClient.query("COMMIT;");
    } catch (e) {
      await empClient.query("ROLLBACK;");
      throw e;
    } finally {
      empClient.release();
    }

    // 8. RLS Policies Check
    console.log("\n[TEST 8] RLS Policies Verification");

    const rlsPolicies = await pool.query(`
      SELECT tablename, policyname, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND policyname ILIKE '%super admin%'
      ORDER BY tablename, policyname;
    `);
    assert(rlsPolicies.rows.length >= 10, `Super Admin RLS policies in place across platform tables (found ${rlsPolicies.rows.length} policies)`);

    console.log("==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

  } finally {
    await pool.end();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
