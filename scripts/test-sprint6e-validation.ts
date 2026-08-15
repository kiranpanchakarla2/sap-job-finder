import {
  CANDIDATE_PLAN_DEFINITIONS,
  CANDIDATE_PLAN_LIMITS,
  CANDIDATE_PLAN_FEATURES,
  CANDIDATE_COMPARISON_ROWS,
  getCandidatePlanDefinition,
  getCandidatePlanLimits,
  canUseCandidateFeature,
  getCandidatePlanLimit,
  getUsagePercentage,
  isNearLimit,
  isAtLimit,
  buildCandidateUsageMetrics,
  formatCandidatePlanPrice,
} from "../src/features/candidate-subscription/config/planRules";
import {
  candidateSubscriptionService,
  MOCK_PRESETS,
} from "../src/features/candidate-subscription/services/candidateSubscriptionService";
import type {
  CandidatePlanId,
  CandidateSubscription,
} from "../src/features/candidate-subscription/types/subscription.types";

console.log("=================================================");
console.log("SPRINT 6E: CANDIDATE SUBSCRIPTIONS VALIDATION");
console.log("=================================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function runValidation() {
  // 1. Plan Structure & Positioning
  console.log("\n--- 1. Plan Structure & Positioning ---");
  assert(
    CANDIDATE_PLAN_DEFINITIONS.length === 3,
    `Expected exactly 3 plans, found ${CANDIDATE_PLAN_DEFINITIONS.length}`,
  );

  const planIds = CANDIDATE_PLAN_DEFINITIONS.map((p) => p.id);
  assert(
    planIds.includes("free") &&
      planIds.includes("professional") &&
      planIds.includes("premium"),
    "Plans are FREE, PROFESSIONAL, and PREMIUM",
  );

  const freePlan = getCandidatePlanDefinition("free");
  const proPlan = getCandidatePlanDefinition("professional");
  const premPlan = getCandidatePlanDefinition("premium");

  assert(freePlan.name === "Free", "Free plan name is 'Free'");
  assert(freePlan.priceMonthly === 0, "Free plan price is ₹0");
  assert(
    freePlan.tagline.toLowerCase().includes("exploring"),
    `Free plan positioning contains 'exploring': "${freePlan.tagline}"`,
  );

  assert(proPlan.name === "Professional", "Professional plan name is 'Professional'");
  assert(proPlan.highlighted === true, "Professional plan is highlighted as recommended");
  assert(
    proPlan.badge === "Most Popular" || proPlan.badge === "Recommended",
    `Professional has Most Popular/Recommended badge: "${proPlan.badge}"`,
  );
  assert(
    proPlan.tagline.toLowerCase().includes("actively applying"),
    `Professional positioning contains 'actively applying': "${proPlan.tagline}"`,
  );

  assert(premPlan.name === "Premium", "Premium plan name is 'Premium'");
  assert(
    premPlan.tagline.toLowerCase().includes("maximize") ||
      premPlan.tagline.toLowerCase().includes("serious"),
    `Premium positioning aligns with maximizing hiring chances: "${premPlan.tagline}"`,
  );

  // 2. Limits and Features
  console.log("\n--- 2. Plan Limits & Gating ---");
  assert(
    CANDIDATE_PLAN_LIMITS.free.applicationsPerMonth === 5,
    "Free plan application limit is 5/month",
  );
  assert(
    CANDIDATE_PLAN_LIMITS.free.jobAlerts === 5,
    "Free plan job alert limit is 5",
  );
  assert(
    CANDIDATE_PLAN_LIMITS.free.savedJobs === 15,
    "Free plan saved jobs limit is 15",
  );

  assert(
    CANDIDATE_PLAN_LIMITS.professional.applicationsPerMonth === 25,
    "Professional plan application limit is 25/month",
  );
  assert(
    CANDIDATE_PLAN_LIMITS.professional.jobAlerts === 20,
    "Professional plan job alert limit is 20",
  );
  assert(
    CANDIDATE_PLAN_LIMITS.professional.savedJobs === 50,
    "Professional plan saved jobs limit is 50",
  );

  assert(
    CANDIDATE_PLAN_LIMITS.premium.applicationsPerMonth === null,
    "Premium plan applications are unlimited (null)",
  );
  assert(
    CANDIDATE_PLAN_LIMITS.premium.jobAlerts === null,
    "Premium plan alerts are unlimited (null)",
  );
  assert(
    CANDIDATE_PLAN_LIMITS.premium.savedJobs === null,
    "Premium plan saved jobs are unlimited (null)",
  );

  assert(
    canUseCandidateFeature("professional", "ats_resume_score") === true,
    "Professional includes ATS resume score",
  );
  assert(
    canUseCandidateFeature("free", "ats_resume_score") === false,
    "Free does not include ATS resume score",
  );
  assert(
    canUseCandidateFeature("premium", "direct_recruiter_reach") === true,
    "Premium includes direct recruiter outreach",
  );

  // 3. Price and Currency Formatting
  console.log("\n--- 3. Currency & Formatting ---");
  assert(formatCandidatePlanPrice(0, "INR") === "₹0", "Free price formats as ₹0");
  assert(
    formatCandidatePlanPrice(499, "INR") === "₹499",
    "Professional price formats with ₹ symbol",
  );
  assert(
    formatCandidatePlanPrice(999, "INR") === "₹999",
    "Premium price formats with ₹ symbol",
  );

  // 4. Comparison Table Matrix
  console.log("\n--- 4. Comparison Table Rows ---");
  assert(
    CANDIDATE_COMPARISON_ROWS.length >= 8,
    `Comparison table has ${CANDIDATE_COMPARISON_ROWS.length} comparison rows`,
  );
  const rowLabels = CANDIDATE_COMPARISON_ROWS.map((r) => r.label);
  assert(
    rowLabels.includes("SAP Job Search") &&
      rowLabels.includes("Monthly Applications") &&
      rowLabels.includes("Active Job Alerts") &&
      rowLabels.includes("ATS Resume Scoring"),
    "Comparison table contains key candidate feature comparisons",
  );

  // 5. Usage Helpers
  console.log("\n--- 5. Usage & Limit Helpers ---");
  assert(getUsagePercentage(3, 5) === 60, "getUsagePercentage calculates 3/5 as 60%");
  assert(getUsagePercentage(10, null) === null, "Unlimited returns null percentage");
  assert(isNearLimit(4, 5, 0.8) === true, "isNearLimit detects 4/5 (80%)");
  assert(isNearLimit(2, 5, 0.8) === false, "isNearLimit returns false for 2/5 (40%)");
  assert(isAtLimit(5, 5) === true, "isAtLimit detects 5/5 reached");
  assert(isAtLimit(3, 5) === false, "isAtLimit returns false when under limit");
  assert(isAtLimit(50, null) === false, "isAtLimit returns false for unlimited");

  const mockSub: CandidateSubscription = {
    planId: "free",
    status: "active",
    billingCycle: "monthly",
    priceMonthly: 0,
    currency: "INR",
    startDate: "2026-08-01",
    currentPeriodEnd: "2026-08-31",
    renewalDate: null,
    cancelAtPeriodEnd: false,
    usage: {
      applications: 3,
      jobAlerts: 2,
      savedJobs: 5,
      resumeVersions: 1,
    },
  };

  const metrics = buildCandidateUsageMetrics(mockSub);
  assert(metrics.length === 4, "buildCandidateUsageMetrics builds all 4 metrics");
  assert(
    metrics.find((m) => m.key === "applications")?.used === 3 &&
      metrics.find((m) => m.key === "applications")?.limit === 5,
    "Applications metric has used=3 and limit=5",
  );

  // 6. Service Flows & Presets
  console.log("\n--- 6. Service Mock Flows & Presets ---");
  const initialRes = await candidateSubscriptionService.getSubscription();
  assert(initialRes.success, "getSubscription succeeds");

  const proUpgrade = await candidateSubscriptionService.upgradePlan("professional");
  assert(
    proUpgrade.success && proUpgrade.data.planId === "professional",
    "upgradePlan to 'professional' succeeds and sets planId to professional",
  );
  assert(
    proUpgrade.success && proUpgrade.data.priceMonthly === 499,
    "upgradePlan sets monthly price to ₹499",
  );
  assert(
    proUpgrade.success && proUpgrade.data.status === "active",
    "upgradePlan sets status to active",
  );

  const premUpgrade = await candidateSubscriptionService.upgradePlan("premium");
  assert(
    premUpgrade.success && premUpgrade.data.planId === "premium",
    "upgradePlan to 'premium' succeeds",
  );

  const cancelRes = await candidateSubscriptionService.cancelSubscription();
  assert(
    cancelRes.success &&
      cancelRes.data.status === "cancelled" &&
      cancelRes.data.cancelAtPeriodEnd === true,
    "cancelSubscription sets status to cancelled and cancelAtPeriodEnd to true",
  );

  const reactivateRes = await candidateSubscriptionService.reactivateSubscription();
  assert(
    reactivateRes.success &&
      reactivateRes.data.status === "active" &&
      reactivateRes.data.cancelAtPeriodEnd === false,
    "reactivateSubscription restores active status and cancelAtPeriodEnd=false",
  );

  // Presets verification
  const presetKeys = Object.keys(MOCK_PRESETS);
  assert(
    presetKeys.includes("FREE") &&
      presetKeys.includes("PROFESSIONAL_ACTIVE") &&
      presetKeys.includes("PREMIUM_ACTIVE") &&
      presetKeys.includes("PROFESSIONAL_CANCELLED") &&
      presetKeys.includes("PREMIUM_CANCELLED") &&
      presetKeys.includes("PAST_DUE") &&
      presetKeys.includes("EXPIRED"),
    "All required mock presets exist (FREE, PROFESSIONAL_ACTIVE, PREMIUM_ACTIVE, PROFESSIONAL_CANCELLED, PREMIUM_CANCELLED, PAST_DUE, EXPIRED)",
  );

  // Test setting preset
  const presetPastDue = await candidateSubscriptionService.setMockPreset("PAST_DUE");
  assert(
    presetPastDue.success && presetPastDue.data.status === "past_due",
    "setMockPreset PAST_DUE sets status to past_due",
  );

  const presetExpired = await candidateSubscriptionService.setMockPreset("EXPIRED");
  assert(
    presetExpired.success && presetExpired.data.status === "expired",
    "setMockPreset EXPIRED sets status to expired",
  );

  // Reset back to FREE
  await candidateSubscriptionService.setMockPreset("FREE");
  const finalSub = await candidateSubscriptionService.getSubscription();
  assert(
    finalSub.success && finalSub.data.planId === "free",
    "Reset back to Free plan successfully",
  );

  // Summary
  console.log("\n=================================================");
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error("Validation failed with error:", err);
  process.exit(1);
});
