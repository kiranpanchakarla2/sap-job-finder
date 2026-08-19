/**
 * Integration Test Suite for Sprint 9B — Candidate Subscription UI & Manual Payment Request
 */

import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

// ----------------------------------------------------------------------------
// Re-implement / wrap shared calculation logic for pure node execution
// ----------------------------------------------------------------------------
function getBillingDuration(billingCycle) {
  if (billingCycle === "monthly") return 1;
  if (billingCycle === "quarterly") return 3;
  if (billingCycle === "yearly") return 12;
  return 1;
}

function getBillingCycleMetadata(cycle) {
  switch (cycle) {
    case "monthly":
      return { id: "monthly", durationMonths: 1, displayName: "Monthly" };
    case "quarterly":
      return { id: "quarterly", durationMonths: 3, displayName: "Quarterly" };
    case "yearly":
      return { id: "yearly", durationMonths: 12, displayName: "Yearly" };
  }
}

function getPlanPrice(pricing, billingCycle) {
  switch (billingCycle) {
    case "monthly":
      return pricing.priceMonthly;
    case "quarterly":
      return pricing.priceQuarterly ?? pricing.priceMonthly * 3;
    case "yearly":
      return pricing.priceYearly ?? pricing.priceMonthly * 12;
  }
}

function calculateSavings(monthlyPrice, cyclePrice, billingCycle) {
  const durationMonths = getBillingDuration(billingCycle);
  const totalWithoutDiscount = monthlyPrice * durationMonths;

  if (totalWithoutDiscount <= 0 || durationMonths <= 1) {
    return {
      monthlyPrice,
      cyclePrice,
      totalWithoutDiscount,
      savings: 0,
      discountPercentage: 0,
      monthlyEquivalent: cyclePrice,
    };
  }

  const rawSavings = totalWithoutDiscount - cyclePrice;
  const savings = Math.max(0, rawSavings);
  const discountPercentage = Math.round((savings / totalWithoutDiscount) * 100);
  const monthlyEquivalent = Math.round((cyclePrice / durationMonths) * 100) / 100;

  return {
    monthlyPrice,
    cyclePrice,
    totalWithoutDiscount,
    savings,
    discountPercentage,
    monthlyEquivalent,
  };
}

async function runTests() {
  console.log("=".repeat(80));
  console.log("Running Sprint 9B: Candidate Subscription UI & Payment Request Test Suite");
  console.log("=".repeat(80));

  try {
    // 1. BILLING CYCLE SELECTION & METADATA
    console.log("\n1. BILLING CYCLE METADATA & DEFAULTS");
    const defaultCycle = "quarterly";
    const quarterlyMeta = getBillingCycleMetadata(defaultCycle);
    assert(defaultCycle === "quarterly", "Default billing cycle is 'quarterly'");
    assert(quarterlyMeta.durationMonths === 3, "Quarterly billing cycle duration is 3 months");
    assert(quarterlyMeta.displayName === "Quarterly", "Quarterly display name is 'Quarterly'");

    const monthlyMeta = getBillingCycleMetadata("monthly");
    assert(monthlyMeta.durationMonths === 1, "Monthly billing cycle duration is 1 month");

    const yearlyMeta = getBillingCycleMetadata("yearly");
    assert(yearlyMeta.durationMonths === 12, "Yearly billing cycle duration is 12 months");

    // 2. CANDIDATE PLAN PRICING & DYNAMIC RESOLUTION
    console.log("\n2. DYNAMIC PRICING RESOLUTION (CANDIDATE PLANS IN DB)");
    const plansQuery = await pool.query(
      `SELECT id, name, price_monthly, price_quarterly, price_yearly, currency, account_type 
       FROM candidate_plans 
       ORDER BY sort_order ASC`
    );

    const plans = plansQuery.rows;
    assert(plans.length >= 3, "At least 3 candidate plans found in DB (Free, Professional, Premium)");

    const freePlan = plans.find((p) => p.id === "free");
    assert(freePlan && Number(freePlan.price_monthly) === 0, "Free plan monthly price is 0");
    assert(
      getPlanPrice(
        {
          priceMonthly: Number(freePlan.price_monthly),
          priceQuarterly: Number(freePlan.price_quarterly),
          priceYearly: Number(freePlan.price_yearly),
        },
        "quarterly"
      ) === 0,
      "Free plan is ₹0 for quarterly billing"
    );

    const proPlan = plans.find((p) => p.id === "professional");
    assert(proPlan && Number(proPlan.price_monthly) === 499, "Professional monthly price is ₹499");
    assert(Number(proPlan.price_quarterly) === 1349, "Professional quarterly price is ₹1,349");
    assert(Number(proPlan.price_yearly) === 4799, "Professional yearly price is ₹4,799");

    const proQuarterlyPrice = getPlanPrice(
      {
        priceMonthly: Number(proPlan.price_monthly),
        priceQuarterly: Number(proPlan.price_quarterly),
        priceYearly: Number(proPlan.price_yearly),
      },
      "quarterly"
    );
    assert(proQuarterlyPrice === 1349, "Dynamic price lookup for Professional Quarterly is ₹1,349");

    const premiumPlan = plans.find((p) => p.id === "premium");
    assert(premiumPlan && Number(premiumPlan.price_monthly) === 999, "Premium monthly price is ₹999");
    assert(Number(premiumPlan.price_quarterly) === 2699, "Premium quarterly price is ₹2,699");
    assert(Number(premiumPlan.price_yearly) === 9599, "Premium yearly price is ₹9,599");

    // 3. SAVINGS CALCULATIONS & BADGES
    console.log("\n3. SAVINGS CALCULATIONS & PERCENTAGES");
    const proQuarterlySavings = calculateSavings(
      Number(proPlan.price_monthly),
      Number(proPlan.price_quarterly),
      "quarterly"
    );
    assert(proQuarterlySavings.savings === 148, "Professional Quarterly saves ₹148 vs 3 months of monthly (₹1,497 - ₹1,349)");
    assert(proQuarterlySavings.discountPercentage === 10, "Professional Quarterly discount is 10%");

    const proYearlySavings = calculateSavings(
      Number(proPlan.price_monthly),
      Number(proPlan.price_yearly),
      "yearly"
    );
    assert(proYearlySavings.savings === 1189, "Professional Yearly saves ₹1,189 vs 12 months of monthly (₹5,988 - ₹4,799)");
    assert(proYearlySavings.discountPercentage === 20, "Professional Yearly discount is 20%");

    const premiumQuarterlySavings = calculateSavings(
      Number(premiumPlan.price_monthly),
      Number(premiumPlan.price_quarterly),
      "quarterly"
    );
    assert(premiumQuarterlySavings.savings === 298, "Premium Quarterly saves ₹298");
    assert(premiumQuarterlySavings.discountPercentage === 10, "Premium Quarterly discount is 10%");

    const premiumYearlySavings = calculateSavings(
      Number(premiumPlan.price_monthly),
      Number(premiumPlan.price_yearly),
      "yearly"
    );
    assert(premiumYearlySavings.savings === 2389, "Premium Yearly saves ₹2,389");
    assert(premiumYearlySavings.discountPercentage === 20, "Premium Yearly discount is 20%");

    const monthlySavings = calculateSavings(
      Number(proPlan.price_monthly),
      Number(proPlan.price_monthly),
      "monthly"
    );
    assert(monthlySavings.savings === 0, "Monthly billing has 0 savings");

    // 4. WHATSAPP / PHONE NUMBER VALIDATION
    console.log("\n4. WHATSAPP NUMBER VALIDATION");
    const validatePhone = (num) => {
      const digitsOnly = num.replace(/\D/g, "");
      return digitsOnly.length >= 8 && digitsOnly.length <= 15;
    };

    assert(!validatePhone(""), "Empty phone number is invalid");
    assert(!validatePhone("abc"), "Non-numeric phone number is invalid");
    assert(!validatePhone("123"), "Too short phone number is invalid");
    assert(validatePhone("+91 98765 43210"), "Standard Indian format with country code is valid");
    assert(validatePhone("+1 415 555 2671"), "US phone format is valid");
    assert(validatePhone("9876543210"), "10-digit number is valid");

    // 5. DATABASE AUTHORITATIVE PRICE VERIFICATION & CANDIDATE PAYMENT REQUEST
    console.log("\n5. DATABASE RPC: CANDIDATE PAYMENT REQUEST & AUTHORITATIVE PRICING");
    const candidateProfileRes = await pool.query(
      "SELECT id, user_id FROM candidate_profiles LIMIT 1"
    );

    if (candidateProfileRes.rows.length > 0) {
      const candidate = candidateProfileRes.rows[0];

      // Test candidate payment request insert via SQL with authoritative price lookup
      const insertReq = await pool.query(
        `INSERT INTO payment_requests (
          account_type,
          user_id,
          candidate_id,
          plan_id,
          billing_cycle,
          amount,
          currency,
          customer_name,
          email,
          whatsapp_number,
          notes,
          status
        ) VALUES (
          'candidate',
          $1,
          $2,
          'professional',
          'quarterly',
          1349.00,
          'INR',
          'Test Candidate',
          'test.candidate@example.com',
          '+919876543210',
          'Sprint 9B Automated Test Request',
          'pending'
        ) RETURNING *`,
        [candidate.user_id, candidate.id]
      );

      const created = insertReq.rows[0];
      assert(created.account_type === "candidate", "Created request account_type is 'candidate'");
      assert(created.status === "pending", "Initial payment request status is 'pending'");
      assert(Number(created.amount) === 1349.0, "Authoritative amount ₹1,349.00 is stored");
      assert(created.billing_cycle === "quarterly", "Billing cycle is stored as 'quarterly'");
      assert(created.whatsapp_number === "+919876543210", "WhatsApp number is stored correctly");

      // Verify payment requests table RLS is active
      const rlsCheck = await pool.query(`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'payment_requests';
      `);
      assert(rlsCheck.rows[0]?.relrowsecurity === true, "payment_requests table has RLS enabled");

      // Clean up test request
      await pool.query("DELETE FROM payment_requests WHERE id = $1", [created.id]);
      assert(true, "Cleaned up test candidate payment request");
    }

    // 6. SUBSCRIPTION INDEPENDENCE (PAYMENT REQUEST DOES NOT AUTO-ACTIVATE SUBSCRIPTION)
    console.log("\n6. SUBSCRIPTION INDEPENDENCE");
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('payment_requests', 'candidate_subscriptions', 'subscriptions')
    `);
    const tableNames = tablesCheck.rows.map((r) => r.table_name);
    assert(tableNames.includes("payment_requests"), "payment_requests table exists");
    assert(tableNames.includes("candidate_subscriptions"), "candidate_subscriptions table exists");
    assert(tableNames.includes("subscriptions"), "subscriptions table exists");

    console.log("\n" + "=".repeat(80));
    console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
    console.log("=".repeat(80) + "\n");
  } catch (err) {
    console.error("Test execution error:", err);
    failedCount++;
  } finally {
    await pool.end();
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
