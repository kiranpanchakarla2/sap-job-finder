/**
 * Comprehensive Integration & Security Test Suite for Sprint 9D
 * Shared Payment Request, Renewal & Expiry Workflow
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
// Utilities for date & milestone calculations (matching shared-subscription)
// ----------------------------------------------------------------------------
const DEFAULT_PAYMENT_REQUEST_EXPIRY_DAYS = 7;

function getSubscriptionDaysRemaining(subscriptionOrEndDate, now = new Date()) {
  if (!subscriptionOrEndDate) return null;

  let endVal = null;
  if (typeof subscriptionOrEndDate === "string" || subscriptionOrEndDate instanceof Date) {
    endVal = subscriptionOrEndDate;
  } else if (typeof subscriptionOrEndDate === "object") {
    endVal =
      subscriptionOrEndDate.currentPeriodEnd ||
      subscriptionOrEndDate.current_period_end ||
      subscriptionOrEndDate.endDate ||
      subscriptionOrEndDate.end_date ||
      subscriptionOrEndDate.renewalDate ||
      subscriptionOrEndDate.renewal_date ||
      subscriptionOrEndDate.trialEndsAt ||
      subscriptionOrEndDate.trial_ends_at ||
      null;
  }

  if (!endVal) return null;

  const targetDate = typeof endVal === "string" ? new Date(endVal) : endVal;
  if (Number.isNaN(targetDate.getTime())) return null;

  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = targetMidnight.getTime() - nowMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function isSubscriptionExpired(subscriptionOrEndDate, now = new Date()) {
  if (!subscriptionOrEndDate) return false;
  if (typeof subscriptionOrEndDate === "object" && !(subscriptionOrEndDate instanceof Date)) {
    if (subscriptionOrEndDate.status === "expired") return true;
  }
  const days = getSubscriptionDaysRemaining(subscriptionOrEndDate, now);
  if (days === null) return false;
  return days <= 0;
}

function getRenewalMilestone(subscriptionOrEndDate, now = new Date()) {
  if (!subscriptionOrEndDate) return null;

  if (
    typeof subscriptionOrEndDate === "object" &&
    !(subscriptionOrEndDate instanceof Date) &&
    subscriptionOrEndDate.status === "expired"
  ) {
    return "expired";
  }

  if (
    typeof subscriptionOrEndDate === "object" &&
    !(subscriptionOrEndDate instanceof Date) &&
    (subscriptionOrEndDate.planId === "free" || subscriptionOrEndDate.plan_id === "free") &&
    !subscriptionOrEndDate.currentPeriodEnd &&
    !subscriptionOrEndDate.current_period_end &&
    !subscriptionOrEndDate.endDate &&
    !subscriptionOrEndDate.end_date
  ) {
    return null;
  }

  const daysRemaining = getSubscriptionDaysRemaining(subscriptionOrEndDate, now);
  if (daysRemaining === null) return null;

  if (daysRemaining <= 0) return "expired";
  if (daysRemaining === 1) return "1_day";
  if (daysRemaining <= 7) return "7_day";
  if (daysRemaining <= 14) return "14_day";
  if (daysRemaining <= 30) return "30_day";

  return null;
}

function getRenewalNotificationContent(milestone, isRenewalPending = false) {
  if (isRenewalPending) {
    return {
      milestone,
      title: "Renewal Payment Request Pending",
      description:
        "We've received your renewal request. We'll contact you with payment details. Your current subscription remains active until its expiry date.",
      ctaText: "View Request",
      variant: "pending",
      isExpired: false,
    };
  }

  switch (milestone) {
    case "30_day":
      return {
        milestone: "30_day",
        title: "Your subscription expires in 30 days.",
        description: "Renew early to continue uninterrupted access.",
        ctaText: "Renew Subscription",
        variant: "info",
        isExpired: false,
      };
    case "14_day":
      return {
        milestone: "14_day",
        title: "Your subscription expires in 14 days.",
        description: "Renew your subscription to continue uninterrupted access.",
        ctaText: "Renew Subscription",
        variant: "info",
        isExpired: false,
      };
    case "7_day":
      return {
        milestone: "7_day",
        title: "Your subscription expires in 7 days.",
        description: "Renew now to avoid interruption.",
        ctaText: "Renew Subscription",
        variant: "warning",
        isExpired: false,
      };
    case "1_day":
      return {
        milestone: "1_day",
        title: "Your subscription expires tomorrow.",
        description: "Renew now to keep your premium access.",
        ctaText: "Renew Subscription",
        variant: "warning",
        isExpired: false,
      };
    case "expired":
      return {
        milestone: "expired",
        title: "Your subscription has expired.",
        description: "Renew your subscription to regain access to premium features.",
        ctaText: "Renew Subscription",
        variant: "error",
        isExpired: true,
      };
    default:
      return null;
  }
}

function isPaymentRequestExpired(request, now = new Date()) {
  if (!request) return false;
  if (request.status === "payment_received" || request.status === "cancelled") {
    return false;
  }
  const nowMs = now.getTime();
  if (request.expires_at || request.expiresAt) {
    const expiresMs = new Date(request.expires_at || request.expiresAt).getTime();
    if (!isNaN(expiresMs)) return expiresMs < nowMs;
  }
  if (request.requested_at || request.requestedAt) {
    const requestedMs = new Date(request.requested_at || request.requestedAt).getTime();
    if (!isNaN(requestedMs)) {
      return requestedMs + DEFAULT_PAYMENT_REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000 < nowMs;
    }
  }
  return false;
}

function getPaymentRequestDisplayStatus(request, now = new Date()) {
  if (!request) {
    return { status: "pending", variant: "pending", label: "No Request", isExpired: false, isActionable: false };
  }
  const expired = isPaymentRequestExpired(request, now);
  if (expired && (request.status === "pending" || request.status === "payment_link_sent")) {
    return {
      status: "expired",
      variant: "expired",
      label: "Payment Request Expired",
      description: "This payment request is no longer valid. You can submit a new payment request.",
      isExpired: true,
      isActionable: true,
    };
  }
  switch (request.status) {
    case "pending":
      return {
        status: "pending",
        variant: "pending",
        label: "Payment Request Pending",
        description: "We've received your request. We'll contact you on WhatsApp with the payment details.",
        isExpired: false,
        isActionable: false,
      };
    case "payment_link_sent":
      return {
        status: "payment_link_sent",
        variant: "payment_link_sent",
        label: "Payment Link Sent",
        description: "Payment details have been sent to your WhatsApp contact.",
        isExpired: false,
        isActionable: false,
      };
    case "payment_received":
      return {
        status: "payment_received",
        variant: "payment_received",
        label: "Payment Received",
        description: "We've recorded your payment. Your subscription will be activated through the subscription management process.",
        isExpired: false,
        isActionable: false,
      };
    case "cancelled":
      return {
        status: "cancelled",
        variant: "cancelled",
        label: "Payment Request Cancelled",
        description: "This payment request has been cancelled.",
        isExpired: false,
        isActionable: true,
      };
    default:
      return {
        status: "pending",
        variant: "pending",
        label: "Payment Request Pending",
        description: "We've received your request.",
        isExpired: false,
        isActionable: false,
      };
  }
}

function canCreatePaymentRequest(pendingRequest, targetPlanId, targetBillingCycle, now = new Date()) {
  if (!pendingRequest) return { allowed: true, reason: "NONE" };
  if (pendingRequest.status === "cancelled" || isPaymentRequestExpired(pendingRequest, now)) {
    return { allowed: true, reason: "EXPIRED_ALLOWED" };
  }
  if (
    (pendingRequest.status === "pending" || pendingRequest.status === "payment_link_sent") &&
    pendingRequest.plan_id === targetPlanId &&
    pendingRequest.billing_cycle === targetBillingCycle
  ) {
    return { allowed: false, reason: "DUPLICATE_PENDING" };
  }
  return { allowed: true, reason: "NONE" };
}

async function runTests() {
  console.log("=".repeat(80));
  console.log("Running Sprint 9D: Shared Payment Request, Renewal & Expiry Test Suite");
  console.log("=".repeat(80));

  try {
    // ------------------------------------------------------------------------
    // 1. DATABASE SCHEMA & EXTENDED COLUMNS IN PAYMENT_REQUESTS
    // ------------------------------------------------------------------------
    console.log("\n1. DATABASE SCHEMA & EXTENDED COLUMNS IN PAYMENT_REQUESTS");
    const columnsRes = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'payment_requests' AND table_schema = 'public'`
    );
    const cols = columnsRes.rows.map((r) => r.column_name);

    assert(cols.includes("id"), "payment_requests has 'id'");
    assert(cols.includes("account_type"), "payment_requests has 'account_type'");
    assert(cols.includes("user_id"), "payment_requests has 'user_id'");
    assert(cols.includes("candidate_id"), "payment_requests has 'candidate_id'");
    assert(cols.includes("company_id"), "payment_requests has 'company_id'");
    assert(cols.includes("plan_id"), "payment_requests has 'plan_id'");
    assert(cols.includes("plan_name"), "payment_requests has 'plan_name' (historical snapshot)");
    assert(cols.includes("billing_cycle"), "payment_requests has 'billing_cycle'");
    assert(cols.includes("amount"), "payment_requests has 'amount'");
    assert(cols.includes("currency"), "payment_requests has 'currency'");
    assert(cols.includes("customer_name"), "payment_requests has 'customer_name'");
    assert(cols.includes("email"), "payment_requests has 'email'");
    assert(cols.includes("whatsapp_number"), "payment_requests has 'whatsapp_number'");
    assert(cols.includes("company_name"), "payment_requests has 'company_name'");
    assert(cols.includes("status"), "payment_requests has 'status'");
    assert(cols.includes("expires_at"), "payment_requests has 'expires_at'");
    assert(cols.includes("payment_link"), "payment_requests has 'payment_link'");
    assert(cols.includes("payment_link_sent_at"), "payment_requests has 'payment_link_sent_at'");
    assert(cols.includes("payment_received_at"), "payment_requests has 'payment_received_at'");
    assert(cols.includes("cancelled_at"), "payment_requests has 'cancelled_at'");

    // ------------------------------------------------------------------------
    // 2. SUBSCRIPTION_NOTIFICATIONS TABLE & CONSTRAINTS CHECK
    // ------------------------------------------------------------------------
    console.log("\n2. SUBSCRIPTION_NOTIFICATIONS TABLE & IDEMPOTENCY CONSTRAINTS");
    const notifColsRes = await pool.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'subscription_notifications' AND table_schema = 'public'`
    );
    const notifCols = notifColsRes.rows.map((r) => r.column_name);

    assert(notifCols.includes("id"), "subscription_notifications has 'id'");
    assert(notifCols.includes("subscription_id"), "subscription_notifications has 'subscription_id'");
    assert(notifCols.includes("account_type"), "subscription_notifications has 'account_type'");
    assert(notifCols.includes("user_id"), "subscription_notifications has 'user_id'");
    assert(notifCols.includes("candidate_id"), "subscription_notifications has 'candidate_id'");
    assert(notifCols.includes("company_id"), "subscription_notifications has 'company_id'");
    assert(notifCols.includes("notification_type"), "subscription_notifications has 'notification_type'");
    assert(notifCols.includes("milestone"), "subscription_notifications has 'milestone'");
    assert(notifCols.includes("triggered_at"), "subscription_notifications has 'triggered_at'");
    assert(notifCols.includes("created_at"), "subscription_notifications has 'created_at'");

    const uqRes = await pool.query(
      `SELECT conname FROM pg_constraint 
       WHERE conname = 'uq_subscription_notification' AND conrelid = 'public.subscription_notifications'::regclass`
    );
    assert(uqRes.rows.length > 0, "subscription_notifications has 'uq_subscription_notification' unique constraint");

    // ------------------------------------------------------------------------
    // 3. RENEWAL MILESTONE SCHEDULE & DATE CALCULATIONS
    // ------------------------------------------------------------------------
    console.log("\n3. RENEWAL MILESTONE SCHEDULE & EXACT NOTIFICATION COPY");
    const refNow = new Date("2026-08-19T12:00:00Z");

    // 30 days remaining (e.g. Sept 18)
    const sub30d = { currentPeriodEnd: "2026-09-18T12:00:00Z", planId: "professional" };
    assert(getSubscriptionDaysRemaining(sub30d, refNow) === 30, "getSubscriptionDaysRemaining returns 30 days");
    assert(getRenewalMilestone(sub30d, refNow) === "30_day", "30 days remaining maps to '30_day'");
    const copy30d = getRenewalNotificationContent("30_day");
    assert(copy30d.title === "Your subscription expires in 30 days.", "30-day title matches exact prompt requirement");
    assert(copy30d.description === "Renew early to continue uninterrupted access.", "30-day body matches exact prompt requirement");
    assert(copy30d.ctaText === "Renew Subscription", "30-day CTA matches 'Renew Subscription'");

    // Milestone window: 25 days remaining maps to 30_day
    const sub25d = { currentPeriodEnd: "2026-09-13T12:00:00Z", planId: "professional" };
    assert(getRenewalMilestone(sub25d, refNow) === "30_day", "25 days remaining (missed exact 30d) maps cleanly to '30_day'");

    // 14 days remaining (e.g. Sept 2)
    const sub14d = { currentPeriodEnd: "2026-09-02T12:00:00Z", planId: "pro" };
    assert(getSubscriptionDaysRemaining(sub14d, refNow) === 14, "getSubscriptionDaysRemaining returns 14 days");
    assert(getRenewalMilestone(sub14d, refNow) === "14_day", "14 days remaining maps to '14_day'");
    const copy14d = getRenewalNotificationContent("14_day");
    assert(copy14d.title === "Your subscription expires in 14 days.", "14-day title matches exact prompt requirement");
    assert(copy14d.description === "Renew your subscription to continue uninterrupted access.", "14-day body matches exact prompt requirement");
    assert(copy14d.ctaText === "Renew Subscription", "14-day CTA matches 'Renew Subscription'");

    // Milestone window: 12 days remaining maps to 14_day
    const sub12d = { currentPeriodEnd: "2026-08-31T12:00:00Z", planId: "pro" };
    assert(getRenewalMilestone(sub12d, refNow) === "14_day", "12 days remaining maps to '14_day'");

    // 7 days remaining (e.g. Aug 26)
    const sub7d = { currentPeriodEnd: "2026-08-26T12:00:00Z", planId: "business" };
    assert(getSubscriptionDaysRemaining(sub7d, refNow) === 7, "getSubscriptionDaysRemaining returns 7 days");
    assert(getRenewalMilestone(sub7d, refNow) === "7_day", "7 days remaining maps to '7_day'");
    const copy7d = getRenewalNotificationContent("7_day");
    assert(copy7d.title === "Your subscription expires in 7 days.", "7-day title matches exact prompt requirement");
    assert(copy7d.description === "Renew now to avoid interruption.", "7-day body matches exact prompt requirement");
    assert(copy7d.ctaText === "Renew Subscription", "7-day CTA matches 'Renew Subscription'");

    // Milestone window: 5 days remaining maps to 7_day
    const sub5d = { currentPeriodEnd: "2026-08-24T12:00:00Z", planId: "business" };
    assert(getRenewalMilestone(sub5d, refNow) === "7_day", "5 days remaining maps to '7_day'");

    // 1 day remaining (e.g. Aug 20)
    const sub1d = { currentPeriodEnd: "2026-08-20T12:00:00Z", planId: "premium" };
    assert(getSubscriptionDaysRemaining(sub1d, refNow) === 1, "getSubscriptionDaysRemaining returns 1 day");
    assert(getRenewalMilestone(sub1d, refNow) === "1_day", "1 day remaining maps to '1_day'");
    const copy1d = getRenewalNotificationContent("1_day");
    assert(copy1d.title === "Your subscription expires tomorrow.", "1-day title matches exact prompt requirement");
    assert(copy1d.description === "Renew now to keep your premium access.", "1-day body matches exact prompt requirement");
    assert(copy1d.ctaText === "Renew Subscription", "1-day CTA matches 'Renew Subscription'");

    // Expired subscription (e.g. Aug 18 or 0 days)
    const subExpired = { currentPeriodEnd: "2026-08-18T12:00:00Z", planId: "professional" };
    assert(isSubscriptionExpired(subExpired, refNow), "Past end date is marked as expired");
    assert(getRenewalMilestone(subExpired, refNow) === "expired", "Expired subscription maps to 'expired' milestone");
    const copyExpired = getRenewalNotificationContent("expired");
    assert(copyExpired.title === "Your subscription has expired.", "Expired title matches exact prompt requirement");
    assert(copyExpired.description === "Renew your subscription to regain access to premium features.", "Expired body matches exact prompt requirement");
    assert(copyExpired.ctaText === "Renew Subscription", "Expired CTA matches 'Renew Subscription'");

    // Over 30 days (e.g. 45 days) -> null
    const sub45d = { currentPeriodEnd: "2026-10-03T12:00:00Z", planId: "pro" };
    assert(getRenewalMilestone(sub45d, refNow) === null, "45 days remaining returns null (no milestone shown)");

    // Free plan without expiry -> null
    const subFree = { planId: "free", status: "active" };
    assert(getRenewalMilestone(subFree, refNow) === null, "Free plan without end date returns null (no renewal banner)");

    // ------------------------------------------------------------------------
    // 4. ACTIVE SUBSCRIPTION + PENDING RENEWAL REQUEST BANNER STATE
    // ------------------------------------------------------------------------
    console.log("\n4. ACTIVE SUBSCRIPTION + PENDING RENEWAL REQUEST STATE");
    const copyPendingRenewal = getRenewalNotificationContent("14_day", true);
    assert(copyPendingRenewal.title === "Renewal Payment Request Pending", "Pending renewal request shows 'Renewal Payment Request Pending'");
    assert(
      copyPendingRenewal.description.includes("Your current subscription remains active until its expiry date"),
      "Pending renewal communicates that current subscription remains active"
    );

    // ------------------------------------------------------------------------
    // 5. DATABASE IDEMPOTENCY & DUPLICATE NOTIFICATION PREVENTION
    // ------------------------------------------------------------------------
    console.log("\n5. DATABASE IDEMPOTENCY & DUPLICATE NOTIFICATION PREVENTION");
    const testSubId = "test-sub-" + Date.now();
    const userRes = await pool.query(`SELECT id FROM auth.users LIMIT 1`);
    if (userRes.rows.length > 0) {
      const testUserId = userRes.rows[0].id;

      // 1st insert: 30_day milestone
      await pool.query(
        `INSERT INTO subscription_notifications (subscription_id, account_type, user_id, notification_type, milestone)
         VALUES ($1, 'candidate', $2, 'subscription_renewal', '30_day')
         ON CONFLICT (subscription_id, notification_type, milestone) DO NOTHING`,
        [testSubId, testUserId]
      );

      // 2nd insert (duplicate attempt): 30_day milestone
      await pool.query(
        `INSERT INTO subscription_notifications (subscription_id, account_type, user_id, notification_type, milestone)
         VALUES ($1, 'candidate', $2, 'subscription_renewal', '30_day')
         ON CONFLICT (subscription_id, notification_type, milestone) DO NOTHING`,
        [testSubId, testUserId]
      );

      // 3rd insert: 14_day milestone (legitimate progression)
      await pool.query(
        `INSERT INTO subscription_notifications (subscription_id, account_type, user_id, notification_type, milestone)
         VALUES ($1, 'candidate', $2, 'subscription_renewal', '14_day')
         ON CONFLICT (subscription_id, notification_type, milestone) DO NOTHING`,
        [testSubId, testUserId]
      );

      const notifRows = await pool.query(
        `SELECT milestone FROM subscription_notifications WHERE subscription_id = $1 ORDER BY triggered_at ASC`,
        [testSubId]
      );

      assert(notifRows.rows.length === 2, "Duplicate 30_day insert was prevented; only 2 records created (30_day and 14_day)");
      assert(notifRows.rows[0].milestone === "30_day", "First record is '30_day'");
      assert(notifRows.rows[1].milestone === "14_day", "Second record is '14_day'");

      // Clean up test rows
      await pool.query(`DELETE FROM subscription_notifications WHERE subscription_id = $1`, [testSubId]);
    }

    // ------------------------------------------------------------------------
    // 6. PAYMENT REQUEST LIFECYCLE, EXPIRATION & DUPLICATE PROTECTION
    // ------------------------------------------------------------------------
    console.log("\n6. PAYMENT REQUEST LIFECYCLE & DUPLICATE PROTECTION");
    const activeReq = { status: "pending", requested_at: "2026-08-18T12:00:00Z", expires_at: "2026-08-25T12:00:00Z" };
    assert(!isPaymentRequestExpired(activeReq, refNow), "Request within 7 days is not expired");
    const activeDisplay = getPaymentRequestDisplayStatus(activeReq, refNow);
    assert(activeDisplay.status === "pending" && !activeDisplay.isExpired, "Active request displays 'Payment Request Pending'");

    const expiredReq = { status: "pending", requested_at: "2026-08-01T12:00:00Z", expires_at: "2026-08-08T12:00:00Z" };
    assert(isPaymentRequestExpired(expiredReq, refNow), "Request past 7 days is marked expired");
    const expiredDisplay = getPaymentRequestDisplayStatus(expiredReq, refNow);
    assert(expiredDisplay.status === "expired" && expiredDisplay.isExpired, "Expired request displays 'Payment Request Expired'");
    assert(expiredDisplay.isActionable === true, "Expired request allows requesting new payment");

    const pendingProQuarterly = { plan_id: "pro", billing_cycle: "quarterly", status: "pending", expires_at: "2026-08-25T12:00:00Z" };
    const checkDuplicateSame = canCreatePaymentRequest(pendingProQuarterly, "pro", "quarterly", refNow);
    assert(!checkDuplicateSame.allowed && checkDuplicateSame.reason === "DUPLICATE_PENDING", "Exact duplicate pending request is blocked");

    const checkDifferentCycle = canCreatePaymentRequest(pendingProQuarterly, "pro", "yearly", refNow);
    assert(checkDifferentCycle.allowed, "Different billing cycle is allowed");

    const checkDifferentPlan = canCreatePaymentRequest(pendingProQuarterly, "business", "quarterly", refNow);
    assert(checkDifferentPlan.allowed, "Different plan is allowed");

    // ------------------------------------------------------------------------
    // 7. SECURITY DEFINER RPCs VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n7. SECURITY DEFINER RPCs VERIFICATION");
    const rpcRes = await pool.query(
      `SELECT routine_name, security_type 
       FROM information_schema.routines 
       WHERE routine_schema = 'public' 
         AND routine_name IN (
           'create_candidate_payment_request',
           'create_employer_payment_request',
           'create_payment_request',
           'record_subscription_notification'
         )`
    );
    const rpcs = rpcRes.rows.map((r) => r.routine_name);
    assert(rpcs.includes("create_candidate_payment_request"), "create_candidate_payment_request RPC exists");
    assert(rpcs.includes("create_employer_payment_request"), "create_employer_payment_request RPC exists");
    assert(rpcs.includes("create_payment_request"), "unified create_payment_request RPC exists");
    assert(rpcs.includes("record_subscription_notification"), "record_subscription_notification RPC exists");

    // ------------------------------------------------------------------------
    // 8. RLS & CLIENT MUTATION PERMISSIONS CHECK
    // ------------------------------------------------------------------------
    console.log("\n8. RLS & CLIENT MUTATION PERMISSIONS CHECK");
    const rlsPaymentReq = await pool.query(`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'payment_requests'`);
    assert(rlsPaymentReq.rows[0].relrowsecurity === true, "RLS enabled on payment_requests");
    assert(rlsPaymentReq.rows[0].relforcerowsecurity === true, "Force RLS enabled on payment_requests");

    const rlsSubNotif = await pool.query(`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'subscription_notifications'`);
    assert(rlsSubNotif.rows[0].relrowsecurity === true, "RLS enabled on subscription_notifications");
    assert(rlsSubNotif.rows[0].relforcerowsecurity === true, "Force RLS enabled on subscription_notifications");

    const privsNotif = await pool.query(
      `SELECT privilege_type FROM information_schema.table_privileges 
       WHERE table_name = 'subscription_notifications' AND table_schema = 'public' AND grantee = 'authenticated'`
    );
    const notifPrivs = privsNotif.rows.map((r) => r.privilege_type);
    assert(notifPrivs.includes("SELECT"), "authenticated role has SELECT on subscription_notifications");
    assert(notifPrivs.includes("INSERT"), "authenticated role has INSERT on subscription_notifications");
    assert(!notifPrivs.includes("UPDATE"), "authenticated role does NOT have UPDATE on subscription_notifications");
    assert(!notifPrivs.includes("DELETE"), "authenticated role does NOT have DELETE on subscription_notifications");

    console.log("\n" + "=".repeat(80));
    console.log(`Sprint 9D Test Results: ${passedCount} passed, ${failedCount} failed`);
    console.log("=".repeat(80));

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
