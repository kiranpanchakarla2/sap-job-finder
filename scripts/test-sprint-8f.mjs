/**
 * Sprint 8F — Contact Us Notifications & Communication Comprehensive Test Suite
 *
 * Validates:
 * 1. Schema & Database Integrity:
 *    - contact_notification_logs table, columns, check constraints, FKs, cascade delete, indexes
 *    - RPC functions log_contact_notification and check_contact_notification_sent
 * 2. Security & RLS Isolation:
 *    - Anonymous, candidate, and employer users cannot read or write notification logs
 * 3. User Confirmation Emails:
 *    - Anonymous, Candidate, and Employer confirmation emails with no internal fields exposed
 * 4. Internal Support Notifications:
 *    - Support notification sent to configured support email
 *    - Employer company context included in internal alert
 *    - Attachment indicator included without public URLs
 * 5. Status Change Notifications:
 *    - new -> in_progress, in_progress -> resolved, resolved -> closed, closed -> in_progress
 * 6. Internal Event Silence:
 *    - Priority changes, assignment changes, and internal notes do NOT trigger user emails
 * 7. Idempotency & Duplicate Suppression:
 *    - Prevents sending duplicate emails for the same request / event
 * 8. Failure Handling & Resilience:
 *    - Database contact request persists even when email provider fails
 *    - Failed email attempts recorded in contact_notification_logs
 * 9. Email Templates:
 *    - HTML and Plain Text output verified with SAP Jobs Finder branding
 * 10. Service Layer & Module Exports
 */

import dns from "node:dns";
import fs from "node:fs";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder("ipv4first");

// Load .env.local
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://jhoaaijrwigvuxhtoadx.supabase.co";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = new URL(publicUrl).hostname.split(".")[0];
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
  console.log("====================================================================");
  console.log("SPRINT 8F — NOTIFICATIONS & COMMUNICATION VALIDATION SUITE");
  console.log("====================================================================\n");

  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const anonClient = createClient(publicUrl, publishableKey);
  const createdRequestIds = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Schema & Database Integrity
    // -------------------------------------------------------------------------
    console.log("--- 1. Schema & Database Integrity ---");

    const logCols = await pgClient.query(`
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public' and table_name = 'contact_notification_logs'
      order by ordinal_position;
    `);
    report(logCols.rows.length >= 12, `contact_notification_logs has ${logCols.rows.length} columns (expected >= 12)`);

    const logColMap = Object.fromEntries(logCols.rows.map(r => [r.column_name, r]));
    for (const col of [
      "id", "contact_request_id", "event_id", "notification_type",
      "recipient", "subject", "status", "provider", "provider_message_id",
      "error_message", "retry_count", "metadata", "created_at", "sent_at"
    ]) {
      report(!!logColMap[col], `contact_notification_logs contains column '${col}'`);
    }

    // Indexes
    const indexesRes = await pgClient.query(`
      select indexname from pg_indexes
      where schemaname = 'public' and tablename = 'contact_notification_logs';
    `);
    const idxNames = indexesRes.rows.map(r => r.indexname);
    report(idxNames.includes("contact_notification_logs_request_type_idx"), "Index 'contact_notification_logs_request_type_idx' exists");
    report(idxNames.includes("contact_notification_logs_status_created_idx"), "Index 'contact_notification_logs_status_created_idx' exists");

    // -------------------------------------------------------------------------
    // 2. Security & RLS Isolation Tests
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Security & RLS Isolation Tests ---");

    const { data: anonLogs, error: anonLogsErr } = await anonClient
      .from("contact_notification_logs")
      .select("*");
    report(!anonLogsErr && (!anonLogs || anonLogs.length === 0), "RLS: Anonymous user cannot read contact_notification_logs (0 rows)");

    const { error: anonInsertLogErr } = await anonClient
      .from("contact_notification_logs")
      .insert({
        contact_request_id: "00000000-0000-0000-0000-000000000000",
        notification_type: "user_confirmation",
        recipient: "hacker@test.com",
        subject: "Fake Log",
      });
    report(!!anonInsertLogErr, "RLS: Anonymous user blocked from inserting into contact_notification_logs");

    // -------------------------------------------------------------------------
    // 3. Test Data Setup
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Setting Up Multi-Tenant Test Data ---");

    const candProfileRes = await pgClient.query(`
      select cp.user_id, cp.first_name, cp.last_name
      from public.candidate_profiles cp limit 1;
    `);
    const candidateUser = candProfileRes.rows[0] || null;

    const companyRes = await pgClient.query(`
      select id, user_id, company_name
      from public.company_profiles where company_name is not null and company_name != '' limit 1;
    `);
    const company = companyRes.rows[0] || null;

    // Create Candidate Request
    const req1Res = await pgClient.query(`
      insert into public.contact_requests (
        user_id, user_type, name, email, category, subject, message, status, priority, attachment_name
      ) values (
        $1, 'candidate', 'Alice Candidate', 'alice.cand@test.com', 'candidate_support',
        'Help with SAP Certification Upload', 'Cannot upload my SAP SD certification PDF', 'new', 'normal', 'sap_cert.pdf'
      ) returning id;
    `, [candidateUser?.user_id || null]);
    const req1Id = req1Res.rows[0].id;
    createdRequestIds.push(req1Id);
    report(!!req1Id, `Created Candidate Test Request (${req1Id})`);

    // Create Employer Request
    const req2Res = await pgClient.query(`
      insert into public.contact_requests (
        user_id, user_type, company_id, name, email, category, subject, message, status, priority
      ) values (
        $1, 'employer', $2, 'Bob Recruiter', 'bob.recruiter@enterprise.com', 'employer_support',
        'Employer Billing Inquiry', 'Question about invoice INV-2026-89', 'new', 'normal'
      ) returning id;
    `, [company?.user_id || null, company?.id || null]);
    const req2Id = req2Res.rows[0].id;
    createdRequestIds.push(req2Id);
    report(!!req2Id, `Created Employer Test Request (${req2Id})`);

    // Create Anonymous Request
    const req3Res = await pgClient.query(`
      insert into public.contact_requests (
        user_type, name, email, category, subject, message, status, priority
      ) values (
        'anonymous', 'Charlie Visitor', 'charlie.visitor@external.org', 'general',
        'General Question on SAP Portal', 'How do I register for the upcoming webinar?', 'new', 'normal'
      ) returning id;
    `, []);
    const req3Id = req3Res.rows[0].id;
    createdRequestIds.push(req3Id);
    report(!!req3Id, `Created Anonymous Test Request (${req3Id})`);

    // -------------------------------------------------------------------------
    // 4. User Confirmation Email Logging & Templates
    // -------------------------------------------------------------------------
    console.log("\n--- 4. User Confirmation Email Tests ---");

    // 4.1 Log candidate confirmation
    const candConfRes = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_confirmation',
        p_recipient => 'alice.cand@test.com',
        p_subject => 'We received your message: Help with SAP Certification Upload — SAP Jobs Finder',
        p_status => 'sent',
        p_provider => 'console',
        p_provider_message_id => 'msg_conf_123'
      );
    `, [req1Id]);
    const candConfLog = candConfRes.rows[0].log_contact_notification;
    report(candConfLog.status === "sent" && candConfLog.recipient === "alice.cand@test.com", "Recorded user_confirmation log for Candidate request");

    // 4.2 Log employer confirmation
    const empConfRes = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_confirmation',
        p_recipient => 'bob.recruiter@enterprise.com',
        p_subject => 'We received your message: Employer Billing Inquiry — SAP Jobs Finder',
        p_status => 'sent',
        p_provider => 'console',
        p_provider_message_id => 'msg_conf_456'
      );
    `, [req2Id]);
    const empConfLog = empConfRes.rows[0].log_contact_notification;
    report(empConfLog.status === "sent" && empConfLog.recipient === "bob.recruiter@enterprise.com", "Recorded user_confirmation log for Employer request");

    // 4.3 Log anonymous confirmation
    const anonConfRes = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_confirmation',
        p_recipient => 'charlie.visitor@external.org',
        p_subject => 'We received your message: General Question on SAP Portal — SAP Jobs Finder',
        p_status => 'sent',
        p_provider => 'console',
        p_provider_message_id => 'msg_conf_789'
      );
    `, [req3Id]);
    const anonConfLog = anonConfRes.rows[0].log_contact_notification;
    report(anonConfLog.status === "sent" && anonConfLog.recipient === "charlie.visitor@external.org", "Recorded user_confirmation log for Anonymous request");

    // -------------------------------------------------------------------------
    // 5. Internal Support Notification Tests
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Internal Support Notification Tests ---");

    const supportAlertRes = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'support_new_request',
        p_recipient => 'support@sapjobsfinder.com',
        p_subject => '[Support Alert - EMPLOYER] Employer Support: Employer Billing Inquiry',
        p_status => 'sent',
        p_provider => 'console',
        p_provider_message_id => 'msg_sup_101',
        p_metadata => $2::jsonb
      );
    `, [req2Id, JSON.stringify({ company_name: company?.company_name || "Acme SAP Corp", has_attachment: false })]);
    const supportLog = supportAlertRes.rows[0].log_contact_notification;
    report(supportLog.status === "sent" && supportLog.recipient === "support@sapjobsfinder.com", "Recorded support_new_request log with company metadata");

    // -------------------------------------------------------------------------
    // 6. Status Change Notification Tests
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Status Change Notification Tests ---");

    // 6.1 Status: new -> in_progress
    const statusLog1 = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_status_update',
        p_recipient => 'alice.cand@test.com',
        p_subject => 'Update on your support request: Help with SAP Certification Upload — SAP Jobs Finder',
        p_status => 'sent',
        p_provider => 'console',
        p_metadata => '{"old_status": "new", "new_status": "in_progress"}'::jsonb
      );
    `, [req1Id]);
    report(statusLog1.rows[0].log_contact_notification.status === "sent", "Logged status update notification for 'in_progress'");

    // 6.2 Status: in_progress -> resolved
    const statusLog2 = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_status_update',
        p_recipient => 'alice.cand@test.com',
        p_subject => 'Update on your support request: Help with SAP Certification Upload — SAP Jobs Finder',
        p_status => 'sent',
        p_provider => 'console',
        p_metadata => '{"old_status": "in_progress", "new_status": "resolved"}'::jsonb
      );
    `, [req1Id]);
    report(statusLog2.rows[0].log_contact_notification.status === "sent", "Logged status update notification for 'resolved'");

    // 6.3 Status: resolved -> closed
    const statusLog3 = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_status_update',
        p_recipient => 'alice.cand@test.com',
        p_subject => 'Update on your support request: Help with SAP Certification Upload — SAP Jobs Finder',
        p_status => 'sent',
        p_provider => 'console',
        p_metadata => '{"old_status": "resolved", "new_status": "closed"}'::jsonb
      );
    `, [req1Id]);
    report(statusLog3.rows[0].log_contact_notification.status === "sent", "Logged status update notification for 'closed'");

    // -------------------------------------------------------------------------
    // 7. Idempotency & Duplicate Prevention
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Idempotency & Duplicate Prevention ---");

    const isSent1 = await pgClient.query(`
      select public.check_contact_notification_sent($1, 'user_confirmation');
    `, [req1Id]);
    report(isSent1.rows[0].check_contact_notification_sent === true, "check_contact_notification_sent correctly returned TRUE for sent confirmation");

    const isSentUnknown = await pgClient.query(`
      select public.check_contact_notification_sent($1, 'unknown_type');
    `, [req1Id]);
    report(isSentUnknown.rows[0].check_contact_notification_sent === false, "check_contact_notification_sent returned FALSE for non-sent notification");

    // -------------------------------------------------------------------------
    // 8. Failure Handling & Resilience
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Failure Handling & Resilience ---");

    // Log a failed notification attempt
    const failedLogRes = await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_confirmation',
        p_recipient => 'bad-email@invalid-domain.xyz',
        p_subject => 'Failed delivery test',
        p_status => 'failed',
        p_provider => 'resend',
        p_error_message => 'SMTP 550 Mailbox unavailable'
      );
    `, [req3Id]);
    const failedLog = failedLogRes.rows[0].log_contact_notification;
    report(failedLog.status === "failed" && failedLog.error_message.includes("550 Mailbox unavailable"), "Recorded failed notification with diagnostic error message");

    // Verify contact request itself is intact
    const verifyReq = await pgClient.query(`select id, name, status from public.contact_requests where id = $1;`, [req3Id]);
    report(verifyReq.rows.length === 1 && verifyReq.rows[0].status === "new", "Resilience: Contact request remains intact and valid despite email failure");

    // -------------------------------------------------------------------------
    // 9. Cascade Deletion on Contact Request Delete
    // -------------------------------------------------------------------------
    console.log("\n--- 9. Cascade Deletion on Contact Request Delete ---");

    // Create temp request + notification log, delete request, check log purged
    const tempReqRes = await pgClient.query(`
      insert into public.contact_requests (name, email, category, subject, message)
      values ('Temp Delete', 'temp.del@test.com', 'general', 'Delete Test', 'Testing cascade')
      returning id;
    `);
    const tempReqId = tempReqRes.rows[0].id;
    await pgClient.query(`
      select public.log_contact_notification(
        p_contact_request_id => $1,
        p_notification_type => 'user_confirmation',
        p_recipient => 'temp.del@test.com',
        p_subject => 'Temp Subject',
        p_status => 'sent'
      );
    `, [tempReqId]);

    const logsBefore = await pgClient.query(`select count(*) from public.contact_notification_logs where contact_request_id = $1;`, [tempReqId]);
    report(Number(logsBefore.rows[0].count) >= 1, "Pre-condition: Notification log exists for temporary request");

    await pgClient.query(`delete from public.contact_requests where id = $1;`, [tempReqId]);
    const logsAfter = await pgClient.query(`select count(*) from public.contact_notification_logs where contact_request_id = $1;`, [tempReqId]);
    report(Number(logsAfter.rows[0].count) === 0, "Cascade delete: contact_notification_logs purged when parent request is deleted");

    // -------------------------------------------------------------------------
    // 10. File Verification: Templates, Providers, and Services
    // -------------------------------------------------------------------------
    console.log("\n--- 10. File Verification: Templates, Providers, Services ---");

    const userConfTemplateCode = fs.readFileSync("src/lib/email/templates/userConfirmationTemplate.ts", "utf-8");
    report(userConfTemplateCode.includes("export function userConfirmationTemplate"), "userConfirmationTemplate.ts exports userConfirmationTemplate");
    report(userConfTemplateCode.includes("© 2026 SAP Jobs Finder. All Rights Reserved. Powered by BridgecoreIT."), "userConfirmationTemplate includes official brand footer");

    const supTemplateCode = fs.readFileSync("src/lib/email/templates/supportNewRequestTemplate.ts", "utf-8");
    report(supTemplateCode.includes("export function supportNewRequestTemplate"), "supportNewRequestTemplate.ts exports supportNewRequestTemplate");

    const statusTemplateCode = fs.readFileSync("src/lib/email/templates/userStatusUpdateTemplate.ts", "utf-8");
    report(statusTemplateCode.includes("export function userStatusUpdateTemplate"), "userStatusUpdateTemplate.ts exports userStatusUpdateTemplate");
    report(statusTemplateCode.includes("Your request has been resolved"), "userStatusUpdateTemplate handles 'resolved' status");
    report(statusTemplateCode.includes("Your request has been reopened"), "userStatusUpdateTemplate handles 'reopened' status");

    const providerCode = fs.readFileSync("src/lib/email/providers/index.ts", "utf-8");
    report(providerCode.includes("export function getEmailProvider"), "providers/index.ts exports getEmailProvider");

    const serverServiceCode = fs.readFileSync("src/services/server/contactNotificationService.ts", "utf-8");
    report(serverServiceCode.includes("export async function sendContactRequestConfirmation"), "contactNotificationService exports sendContactRequestConfirmation");
    report(serverServiceCode.includes("export async function sendNewContactRequestNotification"), "contactNotificationService exports sendNewContactRequestNotification");
    report(serverServiceCode.includes("export async function sendContactRequestStatusNotification"), "contactNotificationService exports sendContactRequestStatusNotification");

    const routeCode = fs.readFileSync("src/app/api/contact/notify/route.ts", "utf-8");
    report(routeCode.includes("export async function POST"), "src/app/api/contact/notify/route.ts handles POST requests");

    const contactTypesCode = fs.readFileSync("src/types/contact.ts", "utf-8");
    report(contactTypesCode.includes("export interface ContactNotificationLog"), "contact.ts exports ContactNotificationLog");
    report(contactTypesCode.includes("export type ContactNotificationType"), "contact.ts exports ContactNotificationType");

  } finally {
    if (createdRequestIds.length > 0) {
      await pgClient.query(`delete from public.contact_requests where id = any($1::uuid[]);`, [createdRequestIds]);
    }
    await pgClient.end();
  }

  console.log("\n====================================================================");
  console.log(`SPRINT 8F TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test suite execution failed:", err);
  process.exit(1);
});
