import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

function pass(msg) {
  console.log(`✅ PASS: ${msg}`);
}

function fail(msg, err) {
  console.error(`❌ FAIL: ${msg}`);
  if (err) console.error(err);
  process.exit(1);
}

async function main() {
  console.log("==================================================================");
  console.log("   SUBSCRIPTION BULK UPLOAD GATING TEST SUITE                    ");
  console.log("==================================================================\n");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    // 1. Verify subscription plans feature configuration
    console.log("--- 1. Plan Features Verification ---");
    const plansRes = await client.query("SELECT id, features FROM public.subscription_plans;");
    const planMap = Object.fromEntries(plansRes.rows.map(r => [r.id, r.features]));

    if (!planMap.free.includes("bulk_upload")) {
      pass("Free plan does NOT have bulk_upload feature");
    } else {
      fail("Free plan unexpectedly has bulk_upload feature");
    }

    if (planMap.pro.includes("bulk_upload")) {
      pass("Pro plan has bulk_upload feature");
    } else {
      fail("Pro plan missing bulk_upload feature");
    }

    if (planMap.business.includes("bulk_upload")) {
      pass("Business plan has bulk_upload feature");
    } else {
      fail("Business plan missing bulk_upload feature");
    }

    // 2. Setup Test Company A on Free Plan
    console.log("\n--- 2. Free Plan Company Import Rejection ---");
    const userFreeId = "33333333-3333-3333-3333-333333333333";

    // Clean previous test data by user_id
    await client.query("DELETE FROM public.jobs WHERE created_by = $1;", [userFreeId]);
    await client.query("DELETE FROM public.bulk_imports WHERE uploaded_by = $1;", [userFreeId]);
    await client.query("DELETE FROM auth.users WHERE id = $1;", [userFreeId]);

    // Create Free plan user & company
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES ($1, 'test-free-bulk@example.com', '{"role":"employer"}'::jsonb, 'authenticated', 'authenticated');
    `, [userFreeId]);

    await client.query(`
      INSERT INTO public.profiles (id, user_id, email, role, first_name, last_name)
      VALUES ($1, $1, 'test-free-bulk@example.com', 'employer', 'Free', 'Employer')
      ON CONFLICT (user_id) DO UPDATE SET role = 'employer';
    `, [userFreeId]);

    const compRes = await client.query("SELECT id FROM public.company_profiles WHERE user_id = $1;", [userFreeId]);
    const compFreeId = compRes.rows[0].id;

    await client.query("DELETE FROM public.employer_accounts WHERE user_id = $1;", [userFreeId]);
    await client.query(`
      INSERT INTO public.employer_accounts (user_id, company_id, role, status, can_bulk_upload)
      VALUES ($1, $2, 'owner', 'active', true);
    `, [userFreeId, compFreeId]);

    // Ensure subscription is Free
    await client.query(`
      INSERT INTO public.subscriptions (company_id, plan_id, status)
      VALUES ($1, 'free', 'active')
      ON CONFLICT (company_id) DO UPDATE SET plan_id = 'free';
    `, [compFreeId]);

    // Attempt RPC import as Free plan company
    const testJob = [{
      rowNumber: 2,
      title: "SAP ABAP Developer Free Test",
      sapModule: "SAP ABAP",
      location: "Bengaluru, India",
      jobType: "Permanent",
      employmentType: "Full-time",
      workMode: "Hybrid",
      minExperience: 3,
      maxExperience: 6,
      description: "Test job posting for Free plan validation."
    }];

    try {
      await client.query("BEGIN;");
      await client.query(`SET LOCAL "request.jwt.claim.sub" = '${userFreeId}';`);
      await client.query(`SET LOCAL "request.jwt.claim.role" = 'authenticated';`);
      await client.query("SELECT public.bulk_import_jobs($1::jsonb, $2::jsonb);", [
        JSON.stringify(testJob),
        JSON.stringify({ fileName: "test.xlsx", totalRowsInFile: 1 }),
      ]);
      await client.query("COMMIT;");
      fail("Expected bulk_import_jobs to fail with FORBIDDEN_PLAN_UPGRADE_REQUIRED for Free plan");
    } catch (err) {
      await client.query("ROLLBACK;");
      if (err.message && err.message.includes("FORBIDDEN_PLAN_UPGRADE_REQUIRED")) {
        pass("Free plan company is blocked with FORBIDDEN_PLAN_UPGRADE_REQUIRED");
      } else {
        fail("Unexpected error message on Free plan import: " + err.message);
      }
    }

    // 3. Upgrade Company A to Pro Plan and verify success
    console.log("\n--- 3. Pro Plan Company Import Success ---");
    await client.query(`
      UPDATE public.subscriptions
      SET plan_id = 'pro'
      WHERE company_id = $1;
    `, [compFreeId]);

    await client.query("BEGIN;");
    await client.query(`SET LOCAL "request.jwt.claim.sub" = '${userFreeId}';`);
    await client.query(`SET LOCAL "request.jwt.claim.role" = 'authenticated';`);
    const importRes = await client.query("SELECT public.bulk_import_jobs($1::jsonb, $2::jsonb) as res;", [
      JSON.stringify(testJob),
      JSON.stringify({ fileName: "test.xlsx", totalRowsInFile: 1 }),
    ]);
    await client.query("COMMIT;");

    const resData = importRes.rows[0].res;
    if (resData && resData.status === "completed" && resData.created?.length === 1) {
      pass("Pro plan company successfully executed bulk_import_jobs RPC");
      pass(`Created draft job ID: ${resData.created[0].jobId}`);
    } else {
      fail("Failed to import job on Pro plan: " + JSON.stringify(resData));
    }

    // Clean up test data
    await client.query("DELETE FROM public.jobs WHERE company_id = $1;", [compFreeId]);
    await client.query("DELETE FROM public.bulk_imports WHERE company_id = $1;", [compFreeId]);
    await client.query("DELETE FROM auth.users WHERE id = $1;", [userFreeId]);

    console.log("\n==================================================================");
    console.log("   ALL SUBSCRIPTION BULK UPLOAD GATING TESTS PASSED!             ");
    console.log("==================================================================\n");

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
