import dns from "node:dns";
import pg from "pg";
import assert from "node:assert";

dns.setDefaultResultOrder("ipv4first");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to run tests.");
  process.exit(1);
}

// ----------------------------------------------------------------------------
// Local implementations of shared business utilities for testing
// ----------------------------------------------------------------------------
function getBillingDuration(billingCycle) {
  if (billingCycle === "monthly") return 1;
  if (billingCycle === "quarterly") return 3;
  if (billingCycle === "yearly") return 12;
  return 1;
}

function calculateSubscriptionEndDate(startDate, billingCycle) {
  const start = typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid start date: ${startDate}`);
  }
  const monthsToAdd = getBillingDuration(billingCycle);
  const targetYear = start.getFullYear();
  const targetMonth = start.getMonth() + monthsToAdd;
  const targetDay = start.getDate();

  const target = new Date(targetYear, targetMonth, 1);
  const maxDaysInTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(targetDay, maxDaysInTargetMonth));
  return target;
}

function formatIsoDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSubscriptionActive(startDate, endDate, status, now = new Date()) {
  if (status !== "active" && status !== "trialing") return false;
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  if (Number.isNaN(start.getTime()) || start.getTime() > now.getTime()) return false;
  if (!endDate) return true;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() > now.getTime();
}

function calculateSavings(monthlyPrice, cyclePrice, billingCycle) {
  const durationMonths = getBillingDuration(billingCycle);
  const totalWithoutDiscount = monthlyPrice * durationMonths;
  const savings = Math.max(0, totalWithoutDiscount - cyclePrice);
  const monthlyEquivalent = durationMonths > 0 ? Math.round((cyclePrice / durationMonths) * 100) / 100 : cyclePrice;
  const discountPercentage = totalWithoutDiscount > 0 ? Math.round((savings / totalWithoutDiscount) * 100) : 0;
  return {
    billingCycle,
    monthlyPrice,
    cyclePrice,
    durationMonths,
    totalWithoutDiscount,
    savings,
    monthlyEquivalent,
    discountPercentage,
  };
}

function isPlanAvailableForAccountType(planAccountType, targetAccountType) {
  return planAccountType === targetAccountType;
}

// ----------------------------------------------------------------------------
// Test Runner
// ----------------------------------------------------------------------------
async function runTests() {
  console.log("================================================================================");
  console.log("Running Sprint 9A: Subscription & Billing Foundation Test Suite");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("1. BILLING CYCLES & DURATIONS");
  test("Monthly cycle has duration of 1 month", () => {
    assert.strictEqual(getBillingDuration("monthly"), 1);
  });
  test("Quarterly cycle has duration of 3 months", () => {
    assert.strictEqual(getBillingDuration("quarterly"), 3);
  });
  test("Yearly cycle has duration of 12 months", () => {
    assert.strictEqual(getBillingDuration("yearly"), 12);
  });

  console.log("\n2. DATE CALCULATION & MONTH-END BOUNDARY SAFETY");
  test("Standard date calculation (2026-08-19)", () => {
    const start = "2026-08-19";
    assert.strictEqual(formatIsoDate(calculateSubscriptionEndDate(start, "monthly")), "2026-09-19");
    assert.strictEqual(formatIsoDate(calculateSubscriptionEndDate(start, "quarterly")), "2026-11-19");
    assert.strictEqual(formatIsoDate(calculateSubscriptionEndDate(start, "yearly")), "2027-08-19");
  });

  test("Month-end clamping: Jan 31 + 1 month in non-leap year (2026) => Feb 28", () => {
    const start = "2026-01-31";
    assert.strictEqual(formatIsoDate(calculateSubscriptionEndDate(start, "monthly")), "2026-02-28");
  });

  test("Month-end clamping: Jan 31 + 1 month in leap year (2028) => Feb 29", () => {
    const start = "2028-01-31";
    assert.strictEqual(formatIsoDate(calculateSubscriptionEndDate(start, "monthly")), "2028-02-29");
  });

  test("Month-end clamping: Aug 31 + 1 month => Sep 30", () => {
    const start = "2026-08-31";
    assert.strictEqual(formatIsoDate(calculateSubscriptionEndDate(start, "monthly")), "2026-09-30");
  });

  test("Month-end clamping: Oct 31 + 3 months (quarterly) => Jan 31", () => {
    const start = "2026-10-31";
    assert.strictEqual(formatIsoDate(calculateSubscriptionEndDate(start, "quarterly")), "2027-01-31");
  });

  console.log("\n3. SUBSCRIPTION STATUS & ACTIVE/EXPIRED DETERMINATION");
  test("Active subscription detection (within date range)", () => {
    const now = new Date("2026-08-19T12:00:00Z");
    const active = isSubscriptionActive("2026-08-01", "2026-09-01", "active", now);
    assert.strictEqual(active, true);
  });

  test("Expired subscription detection (past end date)", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    const active = isSubscriptionActive("2026-08-01", "2026-09-01", "active", now);
    assert.strictEqual(active, false);
  });

  test("Non-active status (cancelled) is not active even if within date range", () => {
    const now = new Date("2026-08-19T12:00:00Z");
    const active = isSubscriptionActive("2026-08-01", "2026-09-01", "cancelled", now);
    assert.strictEqual(active, false);
  });

  console.log("\n4. PRICING & SAVINGS CALCULATIONS");
  test("Quarterly savings calculation (₹1,000/mo, ₹2,700/quarter => ₹300 savings, 10% discount)", () => {
    const res = calculateSavings(1000, 2700, "quarterly");
    assert.strictEqual(res.totalWithoutDiscount, 3000);
    assert.strictEqual(res.savings, 300);
    assert.strictEqual(res.monthlyEquivalent, 900);
    assert.strictEqual(res.discountPercentage, 10);
  });

  test("Yearly savings calculation (₹1,000/mo, ₹9,000/year => ₹3,000 savings, 25% discount)", () => {
    const res = calculateSavings(1000, 9000, "yearly");
    assert.strictEqual(res.totalWithoutDiscount, 12000);
    assert.strictEqual(res.savings, 3000);
    assert.strictEqual(res.monthlyEquivalent, 750);
    assert.strictEqual(res.discountPercentage, 25);
  });

  console.log("\n5. ACCOUNT TYPE PLAN ISOLATION");
  test("Candidate plan is available for Candidate and not Employer", () => {
    assert.strictEqual(isPlanAvailableForAccountType("candidate", "candidate"), true);
    assert.strictEqual(isPlanAvailableForAccountType("candidate", "employer"), false);
  });

  test("Employer plan is available for Employer and not Candidate", () => {
    assert.strictEqual(isPlanAvailableForAccountType("employer", "employer"), true);
    assert.strictEqual(isPlanAvailableForAccountType("employer", "candidate"), false);
  });

  console.log("\n6. DATABASE SCHEMA & DATA INTEGRITY VERIFICATION");
  await asyncTest("Employer subscription_plans table has billing cycle columns and valid prices", async () => {
    const res = await client.query(`
      SELECT id, name, price_monthly, price_quarterly, price_yearly, currency, account_type
      FROM public.subscription_plans
      ORDER BY id;
    `);
    assert.strictEqual(res.rowCount, 3);
    const free = res.rows.find(r => r.id === "free");
    const pro = res.rows.find(r => r.id === "pro");
    const business = res.rows.find(r => r.id === "business");

    assert.strictEqual(free.account_type, "employer");
    assert.strictEqual(Number(free.price_monthly), 0);
    assert.strictEqual(Number(free.price_quarterly), 0);
    assert.strictEqual(Number(free.price_yearly), 0);

    assert.strictEqual(pro.account_type, "employer");
    assert.strictEqual(Number(pro.price_monthly), 1999);
    assert.strictEqual(Number(pro.price_quarterly), 5399);
    assert.strictEqual(Number(pro.price_yearly), 19199);

    assert.strictEqual(business.account_type, "employer");
    assert.strictEqual(Number(business.price_monthly), 5999);
    assert.strictEqual(Number(business.price_quarterly), 16199);
    assert.strictEqual(Number(business.price_yearly), 57599);
  });

  await asyncTest("Candidate candidate_plans table has billing cycle columns and valid prices", async () => {
    const res = await client.query(`
      SELECT id, name, price_monthly, price_quarterly, price_yearly, currency, account_type
      FROM public.candidate_plans
      ORDER BY id;
    `);
    assert.strictEqual(res.rowCount, 3);
    const free = res.rows.find(r => r.id === "free");
    const professional = res.rows.find(r => r.id === "professional");
    const premium = res.rows.find(r => r.id === "premium");

    assert.strictEqual(free.account_type, "candidate");
    assert.strictEqual(Number(free.price_monthly), 0);

    assert.strictEqual(professional.account_type, "candidate");
    assert.strictEqual(Number(professional.price_monthly), 499);
    assert.strictEqual(Number(professional.price_quarterly), 1349);
    assert.strictEqual(Number(professional.price_yearly), 4799);

    assert.strictEqual(premium.account_type, "candidate");
    assert.strictEqual(Number(premium.price_monthly), 999);
    assert.strictEqual(Number(premium.price_quarterly), 2699);
    assert.strictEqual(Number(premium.price_yearly), 9599);
  });

  await asyncTest("Employer subscriptions table supports snapshotted price and quarterly billing", async () => {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'subscriptions'
        AND column_name IN ('price', 'currency', 'account_type', 'billing_cycle', 'status');
    `);
    const colNames = res.rows.map(r => r.column_name);
    assert.ok(colNames.includes("price"));
    assert.ok(colNames.includes("currency"));
    assert.ok(colNames.includes("account_type"));
    assert.ok(colNames.includes("billing_cycle"));
    assert.ok(colNames.includes("status"));
  });

  await asyncTest("Candidate candidate_subscriptions table supports snapshotted price and quarterly billing", async () => {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'candidate_subscriptions'
        AND column_name IN ('price', 'account_type', 'billing_cycle', 'status');
    `);
    const colNames = res.rows.map(r => r.column_name);
    assert.ok(colNames.includes("price"));
    assert.ok(colNames.includes("account_type"));
    assert.ok(colNames.includes("billing_cycle"));
    assert.ok(colNames.includes("status"));
  });

  console.log("\n7. PAYMENT REQUESTS FOUNDATION");
  await asyncTest("Payment requests table exists with all required fields and constraints", async () => {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'payment_requests'
      ORDER BY ordinal_position;
    `);
    const cols = res.rows.map(r => r.column_name);
    const requiredCols = [
      "id",
      "account_type",
      "user_id",
      "candidate_id",
      "company_id",
      "plan_id",
      "billing_cycle",
      "amount",
      "currency",
      "customer_name",
      "email",
      "whatsapp_number",
      "company_name",
      "status",
      "requested_at",
      "payment_link_sent_at",
      "payment_received_at",
      "created_at",
      "updated_at",
    ];
    for (const c of requiredCols) {
      assert.ok(cols.includes(c), `Missing column ${c} in payment_requests`);
    }
  });

  await asyncTest("Payment request direct insert test with snapshotted amount and pending status", async () => {
    // Insert a test candidate payment request
    const insertRes = await client.query(`
      INSERT INTO public.payment_requests (
        account_type,
        plan_id,
        billing_cycle,
        amount,
        currency,
        customer_name,
        email,
        whatsapp_number,
        status,
        notes
      ) VALUES (
        'candidate',
        'professional',
        'quarterly',
        1349.00,
        'INR',
        'Test Candidate',
        'candidate.test@example.com',
        '+919876543210',
        'pending',
        'Sprint 9A automated verification'
      )
      RETURNING *;
    `);

    assert.strictEqual(insertRes.rowCount, 1);
    const row = insertRes.rows[0];
    assert.strictEqual(row.account_type, "candidate");
    assert.strictEqual(row.plan_id, "professional");
    assert.strictEqual(row.billing_cycle, "quarterly");
    assert.strictEqual(Number(row.amount), 1349);
    assert.strictEqual(row.status, "pending");
    assert.ok(row.requested_at != null);

    // Clean up test record
    await client.query(`DELETE FROM public.payment_requests WHERE id = $1;`, [row.id]);
  });

  await asyncTest("Employer payment request direct insert test with company name and yearly cycle", async () => {
    const insertRes = await client.query(`
      INSERT INTO public.payment_requests (
        account_type,
        plan_id,
        billing_cycle,
        amount,
        currency,
        customer_name,
        company_name,
        email,
        whatsapp_number,
        status,
        notes
      ) VALUES (
        'employer',
        'pro',
        'yearly',
        19199.00,
        'INR',
        'Recruiter Lead',
        'Enterprise Global Ltd',
        'recruiter@enterprise.com',
        '+919876500000',
        'pending',
        'Sprint 9A employer test'
      )
      RETURNING *;
    `);

    assert.strictEqual(insertRes.rowCount, 1);
    const row = insertRes.rows[0];
    assert.strictEqual(row.account_type, "employer");
    assert.strictEqual(row.plan_id, "pro");
    assert.strictEqual(row.billing_cycle, "yearly");
    assert.strictEqual(Number(row.amount), 19199);
    assert.strictEqual(row.company_name, "Enterprise Global Ltd");
    assert.strictEqual(row.status, "pending");

    // Clean up test record
    await client.query(`DELETE FROM public.payment_requests WHERE id = $1;`, [row.id]);
  });

  console.log("\n8. RLS SECURITY POLICIES");
  await asyncTest("Payment requests table has RLS enabled", async () => {
    const res = await client.query(`
      SELECT relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'payment_requests' AND relnamespace = 'public'::regnamespace;
    `);
    assert.strictEqual(res.rowCount, 1);
    assert.strictEqual(res.rows[0].relrowsecurity, true);
    assert.strictEqual(res.rows[0].relforcerowsecurity, true);
  });

  await client.end();

  console.log("\n================================================================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
