/**
 * Comprehensive Integration & Security Test Suite for Sprint 9D
 * Shared Manual Payment Request Workflow
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
// Re-implement / wrap shared calculation & lifecycle utilities for pure node execution
// ----------------------------------------------------------------------------
const DEFAULT_PAYMENT_REQUEST_EXPIRY_DAYS = 7;

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
      description: "This payment request is no longer valid. You can submit a new request.",
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
  console.log("Running Sprint 9D: Shared Manual Payment Request Workflow Test Suite");
  console.log("=".repeat(80));

  try {
    // ------------------------------------------------------------------------
    // 1. DATABASE SCHEMA & COLUMNS CHECK
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
    // 2. INDEXES CHECK
    // ------------------------------------------------------------------------
    console.log("\n2. PERFORMANCE & LOOKUP INDEXES IN PAYMENT_REQUESTS");
    const indexesRes = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'payment_requests' AND schemaname = 'public'`
    );
    const indexNames = indexesRes.rows.map((r) => r.indexname);

    assert(indexNames.includes("idx_payment_requests_expires_at"), "idx_payment_requests_expires_at exists");
    assert(indexNames.includes("idx_payment_requests_candidate_active_lookup"), "idx_payment_requests_candidate_active_lookup exists");
    assert(indexNames.includes("idx_payment_requests_company_active_lookup"), "idx_payment_requests_company_active_lookup exists");
    assert(indexNames.includes("idx_payment_requests_status_expires"), "idx_payment_requests_status_expires exists");

    // ------------------------------------------------------------------------
    // 3. DYNAMIC EXPIRATION LOGIC & DERIVED STATES
    // ------------------------------------------------------------------------
    console.log("\n3. DYNAMIC EXPIRATION LOGIC & DERIVED STATES");
    const now = new Date("2026-08-19T12:00:00Z");

    const activeReq = {
      status: "pending",
      requested_at: "2026-08-18T12:00:00Z",
      expires_at: "2026-08-25T12:00:00Z",
    };
    assert(!isPaymentRequestExpired(activeReq, now), "Request within 7 days is not expired");

    const activeDisplay = getPaymentRequestDisplayStatus(activeReq, now);
    assert(activeDisplay.status === "pending" && !activeDisplay.isExpired, "Active request displays 'Payment Request Pending'");
    assert(activeDisplay.label === "Payment Request Pending", "Label matches 'Payment Request Pending'");

    const expiredReq = {
      status: "pending",
      requested_at: "2026-08-01T12:00:00Z",
      expires_at: "2026-08-08T12:00:00Z",
    };
    assert(isPaymentRequestExpired(expiredReq, now), "Request past 7 days is marked expired");

    const expiredDisplay = getPaymentRequestDisplayStatus(expiredReq, now);
    assert(expiredDisplay.status === "expired" && expiredDisplay.isExpired, "Expired request displays 'Payment Request Expired'");
    assert(expiredDisplay.label === "Payment Request Expired", "Label matches 'Payment Request Expired'");
    assert(expiredDisplay.isActionable === true, "Expired request is actionable (allows requesting new link)");

    // Concluded statuses (payment_received, cancelled) should not be marked active expired
    const receivedReq = {
      status: "payment_received",
      requested_at: "2026-08-01T12:00:00Z",
      expires_at: "2026-08-08T12:00:00Z",
    };
    assert(!isPaymentRequestExpired(receivedReq, now), "payment_received request is not flagged as expired");
    const receivedDisplay = getPaymentRequestDisplayStatus(receivedReq, now);
    assert(receivedDisplay.status === "payment_received", "payment_received request displays 'Payment Received'");

    const cancelledReq = {
      status: "cancelled",
      requested_at: "2026-08-01T12:00:00Z",
      expires_at: "2026-08-08T12:00:00Z",
    };
    assert(!isPaymentRequestExpired(cancelledReq, now), "cancelled request is not flagged as active expired");
    const cancelledDisplay = getPaymentRequestDisplayStatus(cancelledReq, now);
    assert(cancelledDisplay.status === "cancelled", "cancelled request displays 'Payment Request Cancelled'");
    assert(cancelledDisplay.isActionable === true, "Cancelled request allows user to request again");

    // ------------------------------------------------------------------------
    // 4. DUPLICATE REQUEST LOGIC & PREVENTION
    // ------------------------------------------------------------------------
    console.log("\n4. DUPLICATE REQUEST LOGIC & PREVENTION");
    const pendingProQuarterly = {
      plan_id: "pro",
      billing_cycle: "quarterly",
      status: "pending",
      expires_at: "2026-08-25T12:00:00Z",
    };

    // Same plan and cycle -> Blocked as duplicate
    const checkDuplicateSame = canCreatePaymentRequest(pendingProQuarterly, "pro", "quarterly", now);
    assert(!checkDuplicateSame.allowed && checkDuplicateSame.reason === "DUPLICATE_PENDING", "Exact duplicate pending request is blocked");

    // Different billing cycle (e.g. Pro Yearly) -> Allowed
    const checkDifferentCycle = canCreatePaymentRequest(pendingProQuarterly, "pro", "yearly", now);
    assert(checkDifferentCycle.allowed, "Different billing cycle is allowed");

    // Different plan (e.g. Business Quarterly) -> Allowed
    const checkDifferentPlan = canCreatePaymentRequest(pendingProQuarterly, "business", "quarterly", now);
    assert(checkDifferentPlan.allowed, "Different plan is allowed");

    // Expired pending request -> Allowed to create new request
    const expiredPendingPro = {
      plan_id: "pro",
      billing_cycle: "quarterly",
      status: "pending",
      expires_at: "2026-08-08T12:00:00Z",
    };
    const checkExpiredAllowed = canCreatePaymentRequest(expiredPendingPro, "pro", "quarterly", now);
    assert(checkExpiredAllowed.allowed && checkExpiredAllowed.reason === "EXPIRED_ALLOWED", "Expired pending request allows creating new request");

    // ------------------------------------------------------------------------
    // 5. DATABASE INSERTION & SNAPSHOT INTEGRITY (CANDIDATE & EMPLOYER)
    // ------------------------------------------------------------------------
    console.log("\n5. DATABASE INSERTION & SNAPSHOT INTEGRITY");

    // Fetch sample candidate and company
    const candidateProfileRes = await pool.query(`SELECT id, user_id, first_name, last_name FROM candidate_profiles LIMIT 1`);
    const companyProfileRes = await pool.query(`SELECT id, user_id, company_name FROM company_profiles LIMIT 1`);

    if (candidateProfileRes.rows.length > 0) {
      const cand = candidateProfileRes.rows[0];
      const candName = [cand.first_name, cand.last_name].filter(Boolean).join(" ") || "Test Candidate";
      const testExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const insertCandReq = await pool.query(
        `INSERT INTO payment_requests (
          account_type,
          user_id,
          candidate_id,
          plan_id,
          plan_name,
          billing_cycle,
          amount,
          currency,
          customer_name,
          email,
          whatsapp_number,
          status,
          expires_at
        ) VALUES (
          'candidate',
          $1,
          $2,
          'professional',
          'Professional Plan',
          'quarterly',
          1349.00,
          'INR',
          $3,
          'candidate@test.com',
          '+919876543210',
          'pending',
          $4
        ) RETURNING *`,
        [cand.user_id, cand.id, candName, testExpiresAt]
      );

      const insertedCand = insertCandReq.rows[0];
      assert(insertedCand.account_type === "candidate", "Candidate request account_type is 'candidate'");
      assert(Number(insertedCand.amount) === 1349, "Candidate request snapshotted amount is 1349");
      assert(insertedCand.plan_name === "Professional Plan", "Candidate request snapshotted plan_name is preserved");
      assert(insertedCand.billing_cycle === "quarterly", "Candidate request billing_cycle is 'quarterly'");
      assert(insertedCand.expires_at !== null, "Candidate request has expires_at set");

      // Clean up test row
      await pool.query(`DELETE FROM payment_requests WHERE id = $1`, [insertedCand.id]);
    }

    if (companyProfileRes.rows.length > 0) {
      const comp = companyProfileRes.rows[0];
      const compName = comp.company_name || comp.name || "Test Employer";
      const testExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const insertEmpReq = await pool.query(
        `INSERT INTO payment_requests (
          account_type,
          user_id,
          company_id,
          plan_id,
          plan_name,
          billing_cycle,
          amount,
          currency,
          customer_name,
          email,
          whatsapp_number,
          company_name,
          status,
          expires_at
        ) VALUES (
          'employer',
          $1,
          $2,
          'pro',
          'Pro Plan',
          'yearly',
          19199.00,
          'INR',
          'Employer Admin',
          'employer@test.com',
          '+919876543211',
          $3,
          'pending',
          $4
        ) RETURNING *`,
        [comp.user_id, comp.id, compName, testExpiresAt]
      );

      const insertedEmp = insertEmpReq.rows[0];
      assert(insertedEmp.account_type === "employer", "Employer request account_type is 'employer'");
      assert(Number(insertedEmp.amount) === 19199, "Employer request snapshotted amount is 19199");
      assert(insertedEmp.plan_name === "Pro Plan", "Employer request snapshotted plan_name is preserved");
      assert(insertedEmp.company_name === compName, "Employer request snapshotted company_name is preserved");
      assert(insertedEmp.billing_cycle === "yearly", "Employer request billing_cycle is 'yearly'");
      assert(insertedEmp.expires_at !== null, "Employer request has expires_at set");

      // Clean up test row
      await pool.query(`DELETE FROM payment_requests WHERE id = $1`, [insertedEmp.id]);
    }

    // ------------------------------------------------------------------------
    // 6. SECURITY DEFINER RPCs VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n6. RPC EXISTENCE & SECURITY DEFINER GRANTS");
    const rpcRes = await pool.query(
      `SELECT routine_name, security_type 
       FROM information_schema.routines 
       WHERE routine_schema = 'public' 
         AND routine_name IN ('create_candidate_payment_request', 'create_employer_payment_request', 'create_payment_request')`
    );
    const rpcs = rpcRes.rows;
    assert(rpcs.some((r) => r.routine_name === "create_candidate_payment_request"), "create_candidate_payment_request RPC exists");
    assert(rpcs.some((r) => r.routine_name === "create_employer_payment_request"), "create_employer_payment_request RPC exists");
    assert(rpcs.some((r) => r.routine_name === "create_payment_request"), "unified create_payment_request RPC exists");

    // ------------------------------------------------------------------------
    // 7. RLS & CLIENT MUTATION PERMISSIONS CHECK
    // ------------------------------------------------------------------------
    console.log("\n7. RLS & CLIENT MUTATION PERMISSIONS");
    const rlsRes = await pool.query(
      `SELECT relname, relrowsecurity, relforcerowsecurity 
       FROM pg_class 
       WHERE relname = 'payment_requests'`
    );
    assert(rlsRes.rows[0].relrowsecurity === true, "RLS is enabled on payment_requests");
    assert(rlsRes.rows[0].relforcerowsecurity === true, "Force RLS is enabled on payment_requests");

    const privsRes = await pool.query(
      `SELECT privilege_type, grantee 
       FROM information_schema.table_privileges 
       WHERE table_name = 'payment_requests' AND table_schema = 'public' AND grantee = 'authenticated'`
    );
    const privTypes = privsRes.rows.map((r) => r.privilege_type);
    assert(privTypes.includes("SELECT"), "authenticated role has SELECT permission on payment_requests");
    assert(privTypes.includes("INSERT"), "authenticated role has INSERT permission on payment_requests");
    assert(!privTypes.includes("UPDATE"), "authenticated role does NOT have UPDATE permission on payment_requests (protected from client mutation)");
    assert(!privTypes.includes("DELETE"), "authenticated role does NOT have DELETE permission on payment_requests (protected from client deletion)");

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
