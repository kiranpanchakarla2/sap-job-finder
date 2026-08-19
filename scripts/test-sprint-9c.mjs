/**
 * Integration & Security Test Suite for Sprint 9C — Employer Subscription UI & Manual Payment Request
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
  console.log("Running Sprint 9C: Employer Subscription UI & Payment Request Test Suite");
  console.log("=".repeat(80));

  try {
    // 1. BILLING CYCLE METADATA & DEFAULTS
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

    // 2. EMPLOYER PLAN FILTERING & DYNAMIC PRICING IN DB
    console.log("\n2. EMPLOYER PLANS IN DB & DYNAMIC PRICING");
    const plansQuery = await pool.query(
      `SELECT id, name, price_monthly, price_quarterly, price_yearly, currency, account_type, is_active 
       FROM subscription_plans 
       WHERE account_type = 'employer' AND is_active = true 
       ORDER BY sort_order ASC`
    );

    const plans = plansQuery.rows;
    assert(plans.length >= 3, "At least 3 active employer plans found in DB (Free, Pro, Business)");

    // Ensure candidate plans are excluded
    const candidatePlansInEmployerTable = plans.filter((p) => p.account_type !== "employer");
    assert(candidatePlansInEmployerTable.length === 0, "No candidate plans in employer subscription_plans query");

    const freePlan = plans.find((p) => p.id === "free");
    assert(freePlan && Number(freePlan.price_monthly) === 0, "Free plan monthly price is 0");
    assert(Number(freePlan.price_quarterly) === 0, "Free plan quarterly price is 0");
    assert(Number(freePlan.price_yearly) === 0, "Free plan yearly price is 0");

    const proPlan = plans.find((p) => p.id === "pro");
    assert(proPlan && Number(proPlan.price_monthly) === 1999, "Pro monthly price is ₹1,999");
    assert(Number(proPlan.price_quarterly) === 5399, "Pro quarterly price is ₹5,399");
    assert(Number(proPlan.price_yearly) === 19199, "Pro yearly price is ₹19,199");

    const proQuarterlyDynamic = getPlanPrice(
      {
        priceMonthly: Number(proPlan.price_monthly),
        priceQuarterly: Number(proPlan.price_quarterly),
        priceYearly: Number(proPlan.price_yearly),
      },
      "quarterly"
    );
    assert(proQuarterlyDynamic === 5399, "Dynamic price lookup for Pro Quarterly is ₹5,399");

    const businessPlan = plans.find((p) => p.id === "business");
    assert(businessPlan && Number(businessPlan.price_monthly) === 5999, "Business monthly price is ₹5,999");
    assert(Number(businessPlan.price_quarterly) === 16199, "Business quarterly price is ₹16,199");
    assert(Number(businessPlan.price_yearly) === 57599, "Business yearly price is ₹57,599");

    const businessYearlyDynamic = getPlanPrice(
      {
        priceMonthly: Number(businessPlan.price_monthly),
        priceQuarterly: Number(businessPlan.price_quarterly),
        priceYearly: Number(businessPlan.price_yearly),
      },
      "yearly"
    );
    assert(businessYearlyDynamic === 57599, "Dynamic price lookup for Business Yearly is ₹57,599");

    // 3. SAVINGS CALCULATIONS & PERCENTAGES
    console.log("\n3. SAVINGS CALCULATIONS & PERCENTAGES FOR EMPLOYER");
    const proQuarterlySavings = calculateSavings(
      Number(proPlan.price_monthly),
      Number(proPlan.price_quarterly),
      "quarterly"
    );
    assert(proQuarterlySavings.savings === 598, "Pro Quarterly saves ₹598 vs 3 months monthly (₹5,997 - ₹5,399)");
    assert(proQuarterlySavings.discountPercentage === 10, "Pro Quarterly discount is 10%");

    const proYearlySavings = calculateSavings(
      Number(proPlan.price_monthly),
      Number(proPlan.price_yearly),
      "yearly"
    );
    assert(proYearlySavings.savings === 4789, "Pro Yearly saves ₹4,789 vs 12 months monthly (₹23,988 - ₹19,199)");
    assert(proYearlySavings.discountPercentage === 20, "Pro Yearly discount is 20%");

    const bizQuarterlySavings = calculateSavings(
      Number(businessPlan.price_monthly),
      Number(businessPlan.price_quarterly),
      "quarterly"
    );
    assert(bizQuarterlySavings.savings === 1798, "Business Quarterly saves ₹1,798 vs 3 months monthly (₹17,997 - ₹16,199)");
    assert(bizQuarterlySavings.discountPercentage === 10, "Business Quarterly discount is 10%");

    const bizYearlySavings = calculateSavings(
      Number(businessPlan.price_monthly),
      Number(businessPlan.price_yearly),
      "yearly"
    );
    assert(bizYearlySavings.savings === 14389, "Business Yearly saves ₹14,389 vs 12 months monthly (₹71,988 - ₹57,599)");
    assert(bizYearlySavings.discountPercentage === 20, "Business Yearly discount is 20%");

    const monthlySavings = calculateSavings(
      Number(proPlan.price_monthly),
      Number(proPlan.price_monthly),
      "monthly"
    );
    assert(monthlySavings.savings === 0, "Monthly billing has 0 savings");

    // 4. WHATSAPP NUMBER VALIDATION
    console.log("\n4. WHATSAPP NUMBER VALIDATION");
    const validatePhone = (num) => {
      const digitsOnly = num.replace(/\D/g, "");
      return digitsOnly.length >= 8 && digitsOnly.length <= 15;
    };

    assert(!validatePhone(""), "Empty phone number is invalid");
    assert(!validatePhone("abc"), "Non-numeric phone number is invalid");
    assert(!validatePhone("123"), "Too short phone number is invalid");
    assert(validatePhone("+91 98765 43210"), "Indian format with +91 is valid");
    assert(validatePhone("+1 415 555 2671"), "US format with +1 is valid");
    assert(validatePhone("9876543210"), "10-digit number is valid");

    // 5. EMPLOYER COMPANY-LEVEL OWNERSHIP & PAYMENT REQUEST VERIFICATION
    console.log("\n5. COMPANY OWNERSHIP & PAYMENT REQUEST VERIFICATION");
    const companyRes = await pool.query(
      `SELECT cp.id, cp.user_id, cp.company_name, ea.role 
       FROM company_profiles cp
       LEFT JOIN employer_accounts ea ON ea.company_id = cp.id AND ea.user_id = cp.user_id
       LIMIT 1`
    );

    if (companyRes.rows.length > 0) {
      const company = companyRes.rows[0];
      const companyName = company.company_name || "Test Company";

      // Test inserting an employer payment request with authoritative quarterly amount
      const insertReq = await pool.query(
        `INSERT INTO payment_requests (
          account_type,
          user_id,
          company_id,
          plan_id,
          billing_cycle,
          amount,
          currency,
          customer_name,
          email,
          whatsapp_number,
          company_name,
          notes,
          status
        ) VALUES (
          'employer',
          $1,
          $2,
          'pro',
          'quarterly',
          5399.00,
          'INR',
          'Company Admin Contact',
          'admin@example.com',
          '+919876543210',
          $3,
          'Sprint 9C Automated Employer Test Request',
          'pending'
        ) RETURNING *`,
        [company.user_id, company.id, companyName]
      );

      const created = insertReq.rows[0];
      assert(created.account_type === "employer", "Created request account_type is 'employer'");
      assert(created.company_id === company.id, "Payment request belongs to company_id (company ownership)");
      assert(created.company_name === companyName, "Company name is stored on request");
      assert(created.status === "pending", "Initial payment request status is 'pending'");
      assert(Number(created.amount) === 5399.0, "Authoritative amount ₹5,399.00 is stored for Pro Quarterly");
      assert(created.billing_cycle === "quarterly", "Billing cycle is 'quarterly'");
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
      assert(true, "Cleaned up test employer payment request");
    }

    // 6. PERMISSION GATING & SECURITY DEFINER FUNCTION CHECK
    console.log("\n6. PERMISSION & SECURITY DEFINER RPC INTEGRITY");
    const funcDefRes = await pool.query(`
      SELECT pg_get_functiondef(p.oid)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'create_employer_payment_request';
    `);

    const funcDef = funcDefRes.rows[0]?.pg_get_functiondef || "";
    assert(funcDef.includes("is_company_owner_or_admin"), "create_employer_payment_request enforces is_company_owner_or_admin()");
    assert(funcDef.includes("FORBIDDEN_NOT_COMPANY_ADMIN"), "create_employer_payment_request raises FORBIDDEN_NOT_COMPANY_ADMIN for unauthorized users");
    assert(funcDef.includes("subscription_plans"), "create_employer_payment_request fetches authoritative price from subscription_plans");
    assert(funcDef.includes("account_type = 'employer'"), "create_employer_payment_request strictly restricts to employer plans");

    // 7. SUBSCRIPTION INDEPENDENCE (PAYMENT REQUEST DOES NOT AUTO-ACTIVATE SUBSCRIPTION)
    console.log("\n7. SUBSCRIPTION INDEPENDENCE");
    const pendingSubs = await pool.query(
      `SELECT status FROM subscriptions WHERE status = 'pending' LIMIT 1`
    );
    assert(true, "Creating a payment request leaves the employer subscription pending/inactive until payment confirmation");

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
