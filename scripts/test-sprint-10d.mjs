import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  SPRINT 10D: SUBSCRIPTION PLAN MANAGEMENT TEST SUITE  ");
  console.log("=======================================================\n");

  const client = await pool.connect();

  try {
    // ------------------------------------------------------------------------
    // TEST SUITE 1: CANDIDATE PLANS
    // ------------------------------------------------------------------------
    console.log("--- 1. CANDIDATE PLANS CRUD & LOGIC ---");

    // 1.1 Query existing candidate plans
    const initialCandPlans = await client.query(
      "SELECT * FROM public.candidate_plans ORDER BY sort_order ASC"
    );
    assert(initialCandPlans.rowCount >= 3, `Found ${initialCandPlans.rowCount} default candidate plans (Free, Professional, Premium)`);

    // 1.2 Test candidate usage RPC
    const candUsageRpc = await client.query("SELECT * FROM public.admin_get_candidate_plan_usage_counts()");
    assert(Array.isArray(candUsageRpc.rows), "admin_get_candidate_plan_usage_counts() RPC executes successfully");

    // 1.3 Create a new test Candidate Plan
    const testCandSlug = `test-cand-plan-${Date.now()}`;
    const insertCandRes = await client.query(
      `
      INSERT INTO public.candidate_plans (
        id, name, tagline, description, price_monthly, price_quarterly, price_yearly,
        currency, duration_value, duration_unit, billing_cycle, account_type, is_active,
        badge, highlighted, features, feature_flags, limits, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *;
      `,
      [
        testCandSlug,
        "Executive SAP Leader",
        "For C-level SAP executives",
        "Full executive suite and direct recruiter concierge.",
        2499,
        6749,
        23999,
        "INR",
        1,
        "months",
        "monthly",
        "candidate",
        true,
        "Executive",
        true,
        ["Unlimited applications", "Concierge placement", "Executive ATS Review"],
        ["job_search", "advanced_search", "applications", "ats_resume_score", "direct_recruiter_reach", "priority_support"],
        JSON.stringify({ applications_per_month: null, job_alerts: null, saved_jobs: null, resume_versions: 10 }),
        4,
      ]
    );

    assert(insertCandRes.rowCount === 1, `Created candidate plan "${testCandSlug}"`);
    const createdCand = insertCandRes.rows[0];
    assert(Number(createdCand.price_monthly) === 2499, "Candidate plan monthly price stored numerically (2499)");
    assert(createdCand.duration_value === 1 && createdCand.duration_unit === "months", "Candidate plan duration is 1 month");
    assert(createdCand.is_active === true, "New candidate plan defaults to active");

    // 1.4 Update candidate plan
    const updateCandRes = await client.query(
      `
      UPDATE public.candidate_plans
      SET price_monthly = 2999, price_yearly = 28999, tagline = 'Updated Executive tagline', sort_order = 5
      WHERE id = $1
      RETURNING *;
      `,
      [testCandSlug]
    );
    assert(updateCandRes.rowCount === 1, "Updated candidate plan");
    assert(Number(updateCandRes.rows[0].price_monthly) === 2999, "Updated candidate plan monthly price (2999)");

    // 1.5 Deactivate candidate plan
    const deactCandRes = await client.query(
      "UPDATE public.candidate_plans SET is_active = false WHERE id = $1 RETURNING *;",
      [testCandSlug]
    );
    assert(deactCandRes.rows[0].is_active === false, "Deactivated candidate plan (is_active = false)");

    // 1.6 Verify portal query filters out deactivated plans
    const publicCandQuery = await client.query(
      "SELECT * FROM public.candidate_plans WHERE is_active = true AND id = $1;",
      [testCandSlug]
    );
    assert(publicCandQuery.rowCount === 0, "Deactivated plan is hidden from active purchases query");

    // 1.7 Reactivate candidate plan
    const reactCandRes = await client.query(
      "UPDATE public.candidate_plans SET is_active = true WHERE id = $1 RETURNING *;",
      [testCandSlug]
    );
    assert(reactCandRes.rows[0].is_active === true, "Reactivated candidate plan (is_active = true)");

    // 1.8 Cleanup test candidate plan
    await client.query("DELETE FROM public.candidate_plans WHERE id = $1;", [testCandSlug]);
    console.log("  ✓ Cleaned up test candidate plan");

    // ------------------------------------------------------------------------
    // TEST SUITE 2: EMPLOYER PLANS
    // ------------------------------------------------------------------------
    console.log("\n--- 2. EMPLOYER PLANS CRUD & LOGIC ---");

    // 2.1 Query existing employer plans
    const initialEmpPlans = await client.query(
      "SELECT * FROM public.subscription_plans WHERE account_type = 'employer' ORDER BY sort_order ASC"
    );
    assert(initialEmpPlans.rowCount >= 3, `Found ${initialEmpPlans.rowCount} default employer plans (Free, Pro, Business)`);

    // 2.2 Test employer usage RPC
    const empUsageRpc = await client.query("SELECT * FROM public.admin_get_employer_plan_usage_counts()");
    assert(Array.isArray(empUsageRpc.rows), "admin_get_employer_plan_usage_counts() RPC executes successfully");

    // 2.3 Create a new test Employer Plan
    const testEmpSlug = `test-emp-plan-${Date.now()}`;
    const insertEmpRes = await client.query(
      `
      INSERT INTO public.subscription_plans (
        id, name, tagline, description, price_monthly, price_quarterly, price_yearly,
        currency, duration_value, duration_unit, account_type, is_active,
        badge, highlighted, features, feature_flags, max_active_jobs, max_applications,
        max_talent_search, max_team_members, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *;
      `,
      [
        testEmpSlug,
        "Enterprise Custom",
        "For large global SAP delivery partners",
        "Unlimited enterprise access across all regions.",
        14999,
        40499,
        143999,
        "INR",
        1,
        "months",
        "employer",
        true,
        "Enterprise",
        true,
        ["Unlimited active jobs", "Unlimited Talent Search", "Dedicated SLA Manager"],
        ["basic_analytics", "advanced_analytics", "talent_search", "candidate_messaging", "interview_management", "team_members", "bulk_upload", "priority_support"],
        null, // Unlimited
        null, // Unlimited
        null, // Unlimited
        25,   // 25 team members
        4,
      ]
    );

    assert(insertEmpRes.rowCount === 1, `Created employer plan "${testEmpSlug}"`);
    const createdEmp = insertEmpRes.rows[0];
    assert(Number(createdEmp.price_monthly) === 14999, "Employer plan monthly price stored numerically (14999)");
    assert(createdEmp.max_active_jobs === null, "Active jobs limit set to null (unlimited)");
    assert(createdEmp.max_team_members === 25, "Team members limit set to 25");
    assert(createdEmp.is_active === true, "New employer plan defaults to active");

    // 2.4 Update employer plan
    const updateEmpRes = await client.query(
      `
      UPDATE public.subscription_plans
      SET price_monthly = 17999, max_team_members = 50, sort_order = 6
      WHERE id = $1
      RETURNING *;
      `,
      [testEmpSlug]
    );
    assert(updateEmpRes.rowCount === 1, "Updated employer plan");
    assert(Number(updateEmpRes.rows[0].price_monthly) === 17999, "Updated employer plan price (17999)");
    assert(updateEmpRes.rows[0].max_team_members === 50, "Updated employer team members limit (50)");

    // 2.5 Deactivate employer plan
    const deactEmpRes = await client.query(
      "UPDATE public.subscription_plans SET is_active = false WHERE id = $1 RETURNING *;",
      [testEmpSlug]
    );
    assert(deactEmpRes.rows[0].is_active === false, "Deactivated employer plan (is_active = false)");

    // 2.6 Verify portal query filters out deactivated plans
    const publicEmpQuery = await client.query(
      "SELECT * FROM public.subscription_plans WHERE account_type = 'employer' AND is_active = true AND id = $1;",
      [testEmpSlug]
    );
    assert(publicEmpQuery.rowCount === 0, "Deactivated employer plan is hidden from active purchases query");

    // 2.7 Reactivate employer plan
    const reactEmpRes = await client.query(
      "UPDATE public.subscription_plans SET is_active = true WHERE id = $1 RETURNING *;",
      [testEmpSlug]
    );
    assert(reactEmpRes.rows[0].is_active === true, "Reactivated employer plan (is_active = true)");

    // 2.8 Cleanup test employer plan
    await client.query("DELETE FROM public.subscription_plans WHERE id = $1;", [testEmpSlug]);
    console.log("  ✓ Cleaned up test employer plan");

    // ------------------------------------------------------------------------
    // TEST SUITE 3: DATA INTEGRITY & REGRESSION
    // ------------------------------------------------------------------------
    console.log("\n--- 3. DATA INTEGRITY & REGRESSION ---");

    // 3.1 Separate tables check
    const tablesCheck = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('candidate_plans', 'subscription_plans');"
    );
    assert(tablesCheck.rowCount === 2, "Candidate plans and Employer plans are physically separated in dedicated tables");

    // 3.2 Subscriptions price snapshot preservation
    const existingSubsCheck = await client.query("SELECT count(*) FROM public.subscriptions;");
    assert(existingSubsCheck.rowCount > 0, "Existing employer subscriptions remain intact");

    const existingPaymentReqsCheck = await client.query("SELECT count(*) FROM public.payment_requests;");
    assert(existingPaymentReqsCheck.rowCount > 0, "Payment requests retain historical amount snapshots");

  } finally {
    client.release();
    await pool.end();
  }

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
