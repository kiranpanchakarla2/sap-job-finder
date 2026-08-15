/**
 * Sprint 6 Phase F: Supabase Integration & Feature Gating Test Suite
 * Tests Candidate Subscriptions, Plan Entitlements, RLS Security,
 * and Server-side Active Job Alerts Enforcement against real Supabase database.
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
  console.log("=================================================");
  console.log("SPRINT 6F: CANDIDATE SUBSCRIPTIONS INTEGRATION TEST");
  console.log("=================================================");

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
    // 1. Schema & Seed Validation
    // -------------------------------------------------------------------------
    console.log("\n--- 1. Schema & Plan Configuration Validation ---");

    const plansRes = await pgClient.query(`
      SELECT id, name, price_monthly, limits, is_active, sort_order
      FROM public.candidate_plans
      ORDER BY sort_order;
    `);

    report(plansRes.rows.length === 3, `Expected 3 candidate plans, found ${plansRes.rows.length}`);

    const freeRow = plansRes.rows.find((p) => p.id === "free");
    const proRow = plansRes.rows.find((p) => p.id === "professional");
    const premRow = plansRes.rows.find((p) => p.id === "premium");

    report(freeRow && freeRow.name === "Free", "Free plan exists with name 'Free'");
    report(Number(freeRow?.price_monthly) === 0, "Free plan price is ₹0");
    report(freeRow?.limits?.job_alerts === 5, "Free plan active job alerts limit = 5");

    report(proRow && proRow.name === "Professional", "Professional plan exists with name 'Professional'");
    report(Number(proRow?.price_monthly) === 499, "Professional plan price is ₹499");
    report(proRow?.limits?.job_alerts === 20, "Professional plan active job alerts limit = 20");

    report(premRow && premRow.name === "Premium", "Premium plan exists with name 'Premium'");
    report(Number(premRow?.price_monthly) === 999, "Premium plan price is ₹999");
    report(premRow?.limits?.job_alerts === null, "Premium plan active job alerts limit is null (TBD/unlimited)");

    // -------------------------------------------------------------------------
    // 2. Setup Test Candidates A and B
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Setting up Test Candidates ---");

    const userARes = await pgClient.query(`
      SELECT id FROM auth.users WHERE email = 'test_cand_sub_a@example.com';
    `);
    let userAId;
    if (userARes.rows.length === 0) {
      const ins = await pgClient.query(`
        INSERT INTO auth.users (id, email, raw_user_meta_data)
        VALUES (gen_random_uuid(), 'test_cand_sub_a@example.com', '{"role":"candidate","full_name":"Candidate Sub A"}'::jsonb)
        RETURNING id;
      `);
      userAId = ins.rows[0].id;
    } else {
      userAId = userARes.rows[0].id;
    }

    const userBRes = await pgClient.query(`
      SELECT id FROM auth.users WHERE email = 'test_cand_sub_b@example.com';
    `);
    let userBId;
    if (userBRes.rows.length === 0) {
      const ins = await pgClient.query(`
        INSERT INTO auth.users (id, email, raw_user_meta_data)
        VALUES (gen_random_uuid(), 'test_cand_sub_b@example.com', '{"role":"candidate","full_name":"Candidate Sub B"}'::jsonb)
        RETURNING id;
      `);
      userBId = ins.rows[0].id;
    } else {
      userBId = userBRes.rows[0].id;
    }

    // Ensure Candidate Profiles exist
    let candARes = await pgClient.query(`SELECT id FROM public.candidate_profiles WHERE user_id = $1`, [userAId]);
    let candAId;
    if (candARes.rows.length === 0) {
      const ins = await pgClient.query(`
        INSERT INTO public.candidate_profiles (user_id, first_name, last_name)
        VALUES ($1, 'Candidate', 'A')
        RETURNING id;
      `, [userAId]);
      candAId = ins.rows[0].id;
    } else {
      candAId = candARes.rows[0].id;
    }

    let candBRes = await pgClient.query(`SELECT id FROM public.candidate_profiles WHERE user_id = $1`, [userBId]);
    let candBId;
    if (candBRes.rows.length === 0) {
      const ins = await pgClient.query(`
        INSERT INTO public.candidate_profiles (user_id, first_name, last_name)
        VALUES ($1, 'Candidate', 'B')
        RETURNING id;
      `, [userBId]);
      candBId = ins.rows[0].id;
    } else {
      candBId = candBRes.rows[0].id;
    }

    // Clean up previous test subscriptions & job alerts for test candidates
    await pgClient.query(`DELETE FROM public.candidate_subscriptions WHERE candidate_id IN ($1, $2)`, [candAId, candBId]);
    await pgClient.query(`DELETE FROM public.job_alerts WHERE candidate_id IN ($1, $2)`, [candAId, candBId]);

    report(Boolean(candAId && candBId), `Test Candidate A (${candAId}) and Candidate B (${candBId}) prepared`);

    // -------------------------------------------------------------------------
    // 3. Effective Plan Resolution Logic
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Effective Plan Resolution Logic ---");

    // Scenario 1: No subscription row -> FREE
    const eff1 = await pgClient.query(`SELECT public.get_candidate_effective_plan($1) as plan;`, [candAId]);
    report(eff1.rows[0].plan === "free", "No subscription record resolves to 'free'");

    // Scenario 2: Active Professional subscription -> PROFESSIONAL
    await pgClient.query(`
      INSERT INTO public.candidate_subscriptions (
        candidate_id, plan_id, status, current_period_start, current_period_end
      ) VALUES ($1, 'professional', 'active', now() - interval '5 days', now() + interval '25 days');
    `, [candAId]);
    const eff2 = await pgClient.query(`SELECT public.get_candidate_effective_plan($1) as plan;`, [candAId]);
    report(eff2.rows[0].plan === "professional", "Active Professional subscription resolves to 'professional'");

    // Scenario 3: Expired Professional subscription -> FREE
    await pgClient.query(`
      UPDATE public.candidate_subscriptions
      SET current_period_end = now() - interval '2 days'
      WHERE candidate_id = $1;
    `, [candAId]);
    const eff3 = await pgClient.query(`SELECT public.get_candidate_effective_plan($1) as plan;`, [candAId]);
    report(eff3.rows[0].plan === "free", "Expired Professional subscription falls back to 'free'");

    // Scenario 4: Cancelled Professional with active period -> PROFESSIONAL
    await pgClient.query(`
      UPDATE public.candidate_subscriptions
      SET status = 'cancelled', cancel_at_period_end = true, current_period_end = now() + interval '10 days'
      WHERE candidate_id = $1;
    `, [candAId]);
    const eff4 = await pgClient.query(`SELECT public.get_candidate_effective_plan($1) as plan;`, [candAId]);
    report(eff4.rows[0].plan === "professional", "Cancelled Professional with future period end remains 'professional'");

    // Scenario 5: Cancelled Professional with passed period -> FREE
    await pgClient.query(`
      UPDATE public.candidate_subscriptions
      SET current_period_end = now() - interval '1 day'
      WHERE candidate_id = $1;
    `, [candAId]);
    const eff5 = await pgClient.query(`SELECT public.get_candidate_effective_plan($1) as plan;`, [candAId]);
    report(eff5.rows[0].plan === "free", "Cancelled Professional with passed period end returns to 'free'");

    // Scenario 6: Active Premium -> PREMIUM
    await pgClient.query(`
      UPDATE public.candidate_subscriptions
      SET plan_id = 'premium', status = 'active', cancel_at_period_end = false, current_period_end = now() + interval '30 days'
      WHERE candidate_id = $1;
    `, [candAId]);
    const eff6 = await pgClient.query(`SELECT public.get_candidate_effective_plan($1) as plan;`, [candAId]);
    report(eff6.rows[0].plan === "premium", "Active Premium subscription resolves to 'premium'");

    // -------------------------------------------------------------------------
    // 4. RLS & Security Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- 4. RLS & Security Isolation ---");

    // Give Candidate B a Professional subscription
    await pgClient.query(`
      INSERT INTO public.candidate_subscriptions (
        candidate_id, plan_id, status, current_period_start, current_period_end
      ) VALUES ($1, 'professional', 'active', now(), now() + interval '30 days')
      ON CONFLICT (candidate_id) DO UPDATE SET plan_id = 'professional', status = 'active';
    `, [candBId]);

    // As Candidate A: should see only Candidate A's subscription
    await asCandidate(userAId);
    const readA = await pgClient.query(`SELECT candidate_id, plan_id FROM public.candidate_subscriptions;`);
    report(
      readA.rows.length === 1 && readA.rows[0].candidate_id === candAId,
      "Candidate A selects only their own subscription row",
    );

    // As Candidate A: cannot insert or mutate candidate_subscriptions directly
    let directInsertBlocked = false;
    try {
      await pgClient.query(`
        INSERT INTO public.candidate_subscriptions (candidate_id, plan_id, status)
        VALUES ($1, 'premium', 'active');
      `, [candAId]);
    } catch (e) {
      directInsertBlocked = true;
    }
    report(directInsertBlocked, "Candidate direct INSERT into candidate_subscriptions is blocked by RLS/privileges");

    let directUpdateBlocked = false;
    try {
      await pgClient.query(`
        UPDATE public.candidate_subscriptions SET plan_id = 'premium';
      `);
    } catch (e) {
      directUpdateBlocked = true;
    }
    report(directUpdateBlocked, "Candidate direct UPDATE on candidate_subscriptions is blocked by RLS/privileges");

    // As Candidate A: cannot modify candidate_plans
    let planUpdateBlocked = false;
    try {
      await pgClient.query(`
        UPDATE public.candidate_plans SET price_monthly = 0 WHERE id = 'premium';
      `);
    } catch (e) {
      planUpdateBlocked = true;
    }
    report(planUpdateBlocked, "Candidate direct UPDATE on candidate_plans is blocked by RLS/privileges");

    await asServiceRole();

    // -------------------------------------------------------------------------
    // 5. Server-Side Active Job Alert Enforcement (Free: 5, Professional: 20, Premium: NULL)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Server-Side Active Job Alert Limits Enforcement ---");

    // Set Candidate A to FREE plan
    await pgClient.query(`DELETE FROM public.candidate_subscriptions WHERE candidate_id = $1`, [candAId]);
    await pgClient.query(`DELETE FROM public.job_alerts WHERE candidate_id = $1`, [candAId]);

    await asCandidate(userAId);

    // Create 5 active alerts as Free user (should all succeed)
    let freeInsertsSucceeded = 0;
    for (let i = 1; i <= 5; i++) {
      try {
        await pgClient.query(`
          INSERT INTO public.job_alerts (candidate_id, name, is_active)
          VALUES ($1, $2, true);
        `, [candAId, `Free Alert ${i}`]);
        freeInsertsSucceeded++;
      } catch (e) {
        console.error(`Unexpected insert failure for Free Alert ${i}:`, e.message);
      }
    }
    report(freeInsertsSucceeded === 5, "Free candidate created 5 active job alerts successfully (1–5 allowed)");

    // 6th active alert must be blocked by trigger
    let sixthAlertBlocked = false;
    let sixthErrorMsg = "";
    try {
      await pgClient.query(`
        INSERT INTO public.job_alerts (candidate_id, name, is_active)
        VALUES ($1, 'Free Alert 6 (Should Fail)', true);
      `, [candAId]);
    } catch (e) {
      sixthAlertBlocked = true;
      sixthErrorMsg = e.message;
    }
    report(
      sixthAlertBlocked && sixthErrorMsg.includes("ACTIVE_JOB_ALERT_LIMIT_REACHED"),
      "6th active job alert for Free candidate is blocked server-side by trigger with ACTIVE_JOB_ALERT_LIMIT_REACHED",
    );

    // Pausing one alert should allow creating another active alert
    const pauseOne = await pgClient.query(`
      UPDATE public.job_alerts SET is_active = false
      WHERE id = (SELECT id FROM public.job_alerts WHERE candidate_id = $1 LIMIT 1)
      RETURNING id;
    `, [candAId]);
    report(pauseOne.rows.length === 1, "Successfully paused 1 existing job alert (active count is now 4)");

    let replacementAlertAllowed = false;
    try {
      await pgClient.query(`
        INSERT INTO public.job_alerts (candidate_id, name, is_active)
        VALUES ($1, 'Replacement Active Alert', true);
      `, [candAId]);
      replacementAlertAllowed = true;
    } catch (e) {
      replacementAlertAllowed = false;
    }
    report(replacementAlertAllowed, "Created 5th active alert after pausing an existing one");

    // Resuming the paused alert should now be blocked because active count is 5
    let resumeBlocked = false;
    try {
      await pgClient.query(`
        UPDATE public.job_alerts SET is_active = true WHERE id = $1;
      `, [pauseOne.rows[0].id]);
    } catch (e) {
      resumeBlocked = true;
    }
    report(resumeBlocked, "Resuming paused alert that would exceed limit (5 -> 6) is blocked by server trigger");

    // Now test Professional Plan (Limit = 20)
    await asServiceRole();
    await pgClient.query(`
      INSERT INTO public.candidate_subscriptions (
        candidate_id, plan_id, status, current_period_start, current_period_end
      ) VALUES ($1, 'professional', 'active', now(), now() + interval '30 days')
      ON CONFLICT (candidate_id) DO UPDATE SET plan_id = 'professional', status = 'active', current_period_end = now() + interval '30 days';
    `, [candAId]);

    await asCandidate(userAId);

    // Delete existing and create 20 active alerts for Professional candidate
    await pgClient.query(`DELETE FROM public.job_alerts WHERE candidate_id = $1;`, [candAId]);
    let proInsertsSucceeded = 0;
    for (let i = 1; i <= 20; i++) {
      try {
        await pgClient.query(`
          INSERT INTO public.job_alerts (candidate_id, name, is_active)
          VALUES ($1, $2, true);
        `, [candAId, `Pro Alert ${i}`]);
        proInsertsSucceeded++;
      } catch (e) {
        console.error(`Unexpected insert failure for Pro Alert ${i}:`, e.message);
      }
    }
    report(proInsertsSucceeded === 20, "Professional candidate created 20 active job alerts successfully (1–20 allowed)");

    // 21st active alert must be blocked
    let twentyFirstBlocked = false;
    try {
      await pgClient.query(`
        INSERT INTO public.job_alerts (candidate_id, name, is_active)
        VALUES ($1, 'Pro Alert 21 (Should Fail)', true);
      `, [candAId]);
    } catch (e) {
      twentyFirstBlocked = true;
    }
    report(twentyFirstBlocked, "21st active job alert for Professional candidate is blocked server-side by trigger");

    // Now test Premium Plan (Limit = NULL / Unlimited)
    await asServiceRole();
    await pgClient.query(`
      UPDATE public.candidate_subscriptions
      SET plan_id = 'premium', status = 'active', current_period_end = now() + interval '30 days'
      WHERE candidate_id = $1;
    `, [candAId]);

    await asCandidate(userAId);

    let premiumAllowedOver20 = false;
    try {
      await pgClient.query(`
        INSERT INTO public.job_alerts (candidate_id, name, is_active)
        VALUES ($1, 'Premium Alert 21', true), ($1, 'Premium Alert 22', true);
      `, [candAId]);
      premiumAllowedOver20 = true;
    } catch (e) {
      premiumAllowedOver20 = false;
    }
    report(premiumAllowedOver20, "Premium candidate can create beyond 20 active job alerts without arbitrary limit");

    // -------------------------------------------------------------------------
    // 6. RPC get_candidate_subscription_overview
    // -------------------------------------------------------------------------
    console.log("\n--- 6. RPC get_candidate_subscription_overview ---");

    const overviewRes = await pgClient.query(`SELECT public.get_candidate_subscription_overview() as overview;`);
    const overview = overviewRes.rows[0].overview;

    report(overview && overview.effectivePlanId === "premium", "RPC returns effectivePlanId = 'premium'");
    report(overview.plan && overview.plan.name === "Premium", "RPC returns plan details for Premium");
    report(overview.usage && overview.usage.jobAlerts === 22, `RPC returns accurate active alert usage (${overview.usage.jobAlerts})`);
    report(Array.isArray(overview.plans) && overview.plans.length === 3, "RPC returns all 3 available active plans");

    // Clean up test data
    await asServiceRole();
    await pgClient.query(`DELETE FROM public.job_alerts WHERE candidate_id IN ($1, $2);`, [candAId, candBId]);
    await pgClient.query(`DELETE FROM public.candidate_subscriptions WHERE candidate_id IN ($1, $2);`, [candAId, candBId]);

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log("\n=================================================");
    console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    await pgClient.end();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    await pgClient.end();
    process.exit(1);
  }
}

main();
