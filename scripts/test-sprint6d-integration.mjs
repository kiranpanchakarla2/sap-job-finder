/**
 * Sprint 6 Phase D: Supabase Integration & RLS Security Test Suite
 * Tests Candidate Notifications end-to-end against real Supabase database.
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

  async function asServiceRole() {
    await pgClient.query(`reset role;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', '', false);`);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'service_role', false);`);
  }

  console.log("====================================================================");
  console.log("SPRINT 6 PHASE D — CANDIDATE NOTIFICATIONS SUPABASE INTEGRATION TEST");
  console.log("====================================================================\n");

  let candidateA = null;
  let candidateB = null;
  let employerUser = null;
  let testCompany = null;
  let testJobA = null;
  let testAppIdA = null;
  let testConvIdA = null;
  let insertedNotifIds = [];

  try {
    // ------------------------------------------------------------------------
    // 1. Participant Setup
    // ------------------------------------------------------------------------
    console.log("[1. ENVIRONMENT & PARTICIPANT SETUP]");
    await asServiceRole();

    const candidatesRes = await pgClient.query(`
      select cp.id as candidate_id, cp.user_id, u.email, cp.first_name, cp.last_name
      from candidate_profiles cp
      join auth.users u on u.id = cp.user_id
      order by cp.created_at asc
      limit 2;
    `);

    if (candidatesRes.rows.length < 2) {
      const candAUser = candidatesRes.rows[0];
      const newBobUser = await pgClient.query(`
        insert into auth.users (id, email, raw_user_meta_data)
        values (gen_random_uuid(), 'bob.candidate@example.com', '{"role":"candidate","first_name":"Bob","last_name":"Candidate"}'::jsonb)
        returning id, email;
      `);
      const bobUserId = newBobUser.rows[0].id;
      const bobProfile = await pgClient.query(`
        insert into candidate_profiles (user_id, first_name, last_name)
        values ($1, 'Bob', 'Candidate')
        returning id, user_id, first_name, last_name;
      `, [bobUserId]);
      candidateA = candAUser;
      candidateB = {
        candidate_id: bobProfile.rows[0].id,
        user_id: bobUserId,
        email: newBobUser.rows[0].email,
        first_name: 'Bob',
        last_name: 'Candidate',
      };
    } else {
      candidateA = candidatesRes.rows[0];
      candidateB = candidatesRes.rows[1];
    }

    const employerRes = await pgClient.query(`
      select ep.id as employer_id, ep.user_id, cp.id as company_id, cp.company_name
      from employer_profiles ep
      left join company_profiles cp on cp.user_id = ep.user_id
      limit 1;
    `);
    employerUser = employerRes.rows[0];
    testCompany = { id: employerUser.company_id, company_name: employerUser.company_name };

    // Get an active job
    const jobRes = await pgClient.query(`
      select id, title, company_id
      from public.jobs
      where status = 'active'
      limit 1;
    `);
    testJobA = jobRes.rows[0];

    // Ensure Candidate A has an application for test job
    const appRes = await pgClient.query(`
      select id from public.job_applications
      where candidate_id = $1 and job_id = $2
      limit 1;
    `, [candidateA.candidate_id, testJobA.id]);

    if (appRes.rows.length > 0) {
      testAppIdA = appRes.rows[0].id;
    } else {
      const newApp = await pgClient.query(`
        insert into public.job_applications (candidate_id, job_id, status, applied_at)
        values ($1, $2, 'applied', now())
        returning id;
      `, [candidateA.candidate_id, testJobA.id]);
      testAppIdA = newApp.rows[0].id;
    }

    // Get or create conversation for application
    const convRes = await pgClient.query(`
      select id from public.conversations where application_id = $1;
    `, [testAppIdA]);
    if (convRes.rows.length > 0) {
      testConvIdA = convRes.rows[0].id;
    } else {
      const newConv = await pgClient.query(`
        insert into public.conversations (application_id, created_by)
        values ($1, $2)
        returning id;
      `, [testAppIdA, employerUser.user_id]);
      testConvIdA = newConv.rows[0].id;
    }

    console.log(`✓ Candidate A: ${candidateA.first_name} ${candidateA.last_name} (${candidateA.user_id})`);
    console.log(`✓ Candidate B: ${candidateB.first_name} ${candidateB.last_name} (${candidateB.user_id})`);
    console.log(`✓ Employer: ${testCompany.company_name} (${employerUser.user_id})`);
    console.log(`✓ Test Application: ${testAppIdA}, Test Conversation: ${testConvIdA}`);

    // ------------------------------------------------------------------------
    // 2. Schema and Column Verification
    // ------------------------------------------------------------------------
    console.log("\n[2. SCHEMA & COLUMN VERIFICATION]");
    const colRes = await pgClient.query(`
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public' and table_name = 'notifications'
      order by column_name;
    `);
    const cols = colRes.rows.map((c) => c.column_name);

    report(cols.includes("id"), "Column 'id' exists on public.notifications");
    report(cols.includes("user_id"), "Column 'user_id' exists on public.notifications");
    report(cols.includes("type"), "Column 'type' exists on public.notifications");
    report(cols.includes("title"), "Column 'title' exists on public.notifications");
    report(cols.includes("description"), "Column 'description' exists on public.notifications");
    report(cols.includes("read_at"), "Column 'read_at' exists on public.notifications");
    report(cols.includes("priority"), "Column 'priority' exists on public.notifications");
    report(cols.includes("related_entity_type"), "Column 'related_entity_type' exists on public.notifications");
    report(cols.includes("related_entity_id"), "Column 'related_entity_id' exists on public.notifications");
    report(cols.includes("action_url"), "Column 'action_url' exists on public.notifications");
    report(cols.includes("action_label"), "Column 'action_label' exists on public.notifications");
    report(cols.includes("metadata"), "Column 'metadata' exists on public.notifications");

    // Check indexes
    const idxRes = await pgClient.query(`
      select indexname
      from pg_indexes
      where schemaname = 'public' and tablename = 'notifications';
    `);
    const idxNames = idxRes.rows.map((i) => i.indexname);
    report(idxNames.includes("notifications_user_created_idx"), "Index notifications_user_created_idx exists");
    report(idxNames.includes("notifications_user_unread_idx"), "Index notifications_user_unread_idx exists");

    // ------------------------------------------------------------------------
    // 3. Client Insert & Delete RLS Security
    // ------------------------------------------------------------------------
    console.log("\n[3. CLIENT INSERT & DELETE RLS SECURITY]");
    await asCandidate(candidateA.user_id);

    let insertBlocked = false;
    try {
      await pgClient.query(`
        insert into public.notifications (user_id, title, description, type)
        values ($1, 'Fake Notification', 'Injected by client', 'system');
      `, [candidateA.user_id]);
    } catch (err) {
      insertBlocked = true;
    }
    report(insertBlocked, "Candidate client direct INSERT is blocked by RLS/permissions");

    let deleteBlocked = false;
    try {
      const delRes = await pgClient.query(`
        delete from public.notifications where user_id = $1;
      `, [candidateA.user_id]);
      if (delRes.rowCount === 0) {
        deleteBlocked = true;
      }
    } catch {
      deleteBlocked = true;
    }
    report(deleteBlocked, "Candidate client direct DELETE is blocked by RLS/permissions");

    // ------------------------------------------------------------------------
    // 4. Message -> Notification Flow Trigger
    // ------------------------------------------------------------------------
    console.log("\n[4. MESSAGE -> NOTIFICATION FLOW]");
    await asServiceRole();

    // Clean existing test notifications for clean count
    await pgClient.query(`delete from public.notifications where user_id in ($1, $2);`, [
      candidateA.user_id,
      candidateB.user_id,
    ]);

    // Employer sends a message in conversation
    const msgRes = await pgClient.query(`
      insert into public.messages (conversation_id, sender_id, content)
      values ($1, $2, 'Hello from Employer regarding your application!')
      returning id;
    `, [testConvIdA, employerUser.user_id]);
    const employerMsgId = msgRes.rows[0].id;

    // Check notification was automatically created for Candidate A
    const notifResA = await pgClient.query(`
      select * from public.notifications
      where user_id = $1 and type = 'message'
      order by created_at desc
      limit 1;
    `, [candidateA.user_id]);

    report(notifResA.rows.length === 1, "Employer message automatically generated notification for Candidate A");
    if (notifResA.rows.length > 0) {
      const n = notifResA.rows[0];
      insertedNotifIds.push(n.id);
      report(n.title === "New Message", "Notification title is 'New Message'");
      report(n.related_entity_type === "message", "Notification related_entity_type is 'message'");
      report(n.related_entity_id === testConvIdA, "Notification related_entity_id matches conversation_id");
      report(n.read_at === null, "New notification has read_at = null (unread)");
      report(n.action_url.includes("/candidate/messages"), "Action URL points to /candidate/messages");
    }

    // Check Employer (sender) did NOT receive a notification
    const notifResEmployer = await pgClient.query(`
      select count(*) from public.notifications
      where user_id = $1 and metadata->>'message_id' = $2;
    `, [employerUser.user_id, employerMsgId]);
    report(parseInt(notifResEmployer.rows[0].count, 10) === 0, "Sender (Employer) did NOT receive a notification for their own message");

    // Candidate A sends a message in reply
    const candMsgRes = await pgClient.query(`
      insert into public.messages (conversation_id, sender_id, content)
      values ($1, $2, 'Thank you! Excited to connect.')
      returning id;
    `, [testConvIdA, candidateA.user_id]);
    const candMsgId = candMsgRes.rows[0].id;

    // Check Candidate A did NOT receive a notification for their own message
    const notifResCandSelf = await pgClient.query(`
      select count(*) from public.notifications
      where user_id = $1 and metadata->>'message_id' = $2;
    `, [candidateA.user_id, candMsgId]);
    report(parseInt(notifResCandSelf.rows[0].count, 10) === 0, "Candidate sender did NOT receive a notification for their own message");

    // ------------------------------------------------------------------------
    // 5. Application Event -> Notification Flow Trigger
    // ------------------------------------------------------------------------
    console.log("\n[5. APPLICATION STATUS -> NOTIFICATION FLOW]");
    await asServiceRole();

    // Update status to 'shortlisted'
    await pgClient.query(`
      update public.job_applications
      set status = 'shortlisted'
      where id = $1;
    `, [testAppIdA]);

    const appNotifRes = await pgClient.query(`
      select * from public.notifications
      where user_id = $1 and type = 'application' and metadata->>'new_status' = 'shortlisted'
      order by created_at desc
      limit 1;
    `, [candidateA.user_id]);

    report(appNotifRes.rows.length === 1, "Application status change to 'shortlisted' triggered notification");
    if (appNotifRes.rows.length > 0) {
      const n = appNotifRes.rows[0];
      insertedNotifIds.push(n.id);
      report(n.title === "Application Update", "Status update notification title is 'Application Update'");
      report(n.description.includes("Shortlisted"), "Description mentions 'Shortlisted'");
      report(n.read_at === null, "Notification is initially unread (read_at is null)");
    }

    // Update status to 'interview'
    await pgClient.query(`
      update public.job_applications
      set status = 'interview'
      where id = $1;
    `, [testAppIdA]);

    const interviewNotifRes = await pgClient.query(`
      select * from public.notifications
      where user_id = $1 and type = 'interview' and metadata->>'new_status' = 'interview'
      order by created_at desc
      limit 1;
    `, [candidateA.user_id]);

    report(interviewNotifRes.rows.length === 1, "Application status change to 'interview' triggered interview notification");
    if (interviewNotifRes.rows.length > 0) {
      const n = interviewNotifRes.rows[0];
      insertedNotifIds.push(n.id);
      report(n.title === "Interview Invitation", "Interview notification title is 'Interview Invitation'");
      report(n.priority === "important", "Interview notification priority is 'important'");
    }

    // ------------------------------------------------------------------------
    // 6. Interview Scheduled -> Notification Flow Trigger
    // ------------------------------------------------------------------------
    console.log("\n[6. INTERVIEW SCHEDULED -> NOTIFICATION FLOW]");
    await asServiceRole();

    const newInterview = await pgClient.query(`
      insert into public.interviews (
        application_id, scheduled_date, start_time, end_time, timezone, type, meeting_link, created_by
      ) values (
        $1, (now() + interval '3 days')::date, '10:00:00', '11:00:00', 'UTC', 'video', 'https://meet.google.com/abc-def-ghi', $2
      ) returning id;
    `, [testAppIdA, employerUser.user_id]);
    const interviewId = newInterview.rows[0].id;

    const schedNotifRes = await pgClient.query(`
      select * from public.notifications
      where user_id = $1 and metadata->>'interview_id' = $2;
    `, [candidateA.user_id, interviewId]);

    report(schedNotifRes.rows.length === 1, "Interview insert automatically created 'Interview Scheduled' notification");
    if (schedNotifRes.rows.length > 0) {
      const n = schedNotifRes.rows[0];
      insertedNotifIds.push(n.id);
      report(n.title === "Interview Scheduled", "Title is 'Interview Scheduled'");
      report(n.priority === "important", "Priority is 'important'");
    }

    // ------------------------------------------------------------------------
    // 7. RLS Cross-User Security Isolation
    // ------------------------------------------------------------------------
    console.log("\n[7. RLS CROSS-USER SECURITY ISOLATION]");
    // Candidate B queries notifications
    await asCandidate(candidateB.user_id);
    const candBNotifs = await pgClient.query(`select * from public.notifications;`);
    report(candBNotifs.rows.length === 0, "Candidate B cannot SELECT Candidate A's notifications (0 rows returned via RLS)");

    // Candidate B attempts to UPDATE Candidate A's notification
    const firstNotifId = insertedNotifIds[0];
    const candBUpdate = await pgClient.query(`
      update public.notifications
      set read_at = now()
      where id = $1;
    `, [firstNotifId]);
    report(candBUpdate.rowCount === 0, "Candidate B cannot UPDATE Candidate A's notification read_at (0 rows affected)");

    // Candidate A queries notifications
    await asCandidate(candidateA.user_id);
    const candANotifs = await pgClient.query(`select * from public.notifications order by created_at desc;`);
    report(candANotifs.rows.length >= 3, `Candidate A can SELECT their own notifications (${candANotifs.rows.length} rows returned)`);

    // Candidate A attempts to tamper with immutable columns
    let tamperBlocked = false;
    try {
      await pgClient.query(`
        update public.notifications
        set title = 'Hacked Title'
        where id = $1;
      `, [firstNotifId]);
    } catch {
      tamperBlocked = true;
    }
    report(tamperBlocked, "Candidate A is blocked by database trigger from modifying notification title/metadata");

    // ------------------------------------------------------------------------
    // 8. Mark Single Notification Read & Mark All Read
    // ------------------------------------------------------------------------
    console.log("\n[8. MARK AS READ & UNREAD COUNT CALCULATION]");
    await asCandidate(candidateA.user_id);

    // Get unread count
    const unreadBeforeRes = await pgClient.query(`
      select count(*) from public.notifications where read_at is null;
    `);
    const unreadBefore = parseInt(unreadBeforeRes.rows[0].count, 10);
    report(unreadBefore >= 3, `Initial unread notifications count is ${unreadBefore}`);

    // Mark single notification read
    const markSingleRes = await pgClient.query(`
      update public.notifications
      set read_at = now()
      where id = $1
      returning id, read_at;
    `, [firstNotifId]);
    report(markSingleRes.rowCount === 1 && markSingleRes.rows[0].read_at !== null, "Individual markAsRead populated read_at timestamp");

    // Unread count decremented
    const unreadMidRes = await pgClient.query(`
      select count(*) from public.notifications where read_at is null;
    `);
    const unreadMid = parseInt(unreadMidRes.rows[0].count, 10);
    report(unreadMid === unreadBefore - 1, `Unread count decremented to ${unreadMid}`);

    // Mark all as read
    const markAllRes = await pgClient.query(`
      update public.notifications
      set read_at = now()
      where read_at is null;
    `);
    report(markAllRes.rowCount === unreadMid, `Mark all as read updated remaining ${unreadMid} unread notifications`);

    // Final unread count is 0
    const unreadAfterRes = await pgClient.query(`
      select count(*) from public.notifications where read_at is null;
    `);
    const unreadAfter = parseInt(unreadAfterRes.rows[0].count, 10);
    report(unreadAfter === 0, "Final unread count is 0 after markAllAsRead");

    // ------------------------------------------------------------------------
    // 9. Cleanup
    // ------------------------------------------------------------------------
    console.log("\n[9. CLEANUP]");
    await asServiceRole();
    await pgClient.query(`delete from public.interviews where id = $1;`, [interviewId]);
    await pgClient.query(`delete from public.messages where id in ($1, $2);`, [employerMsgId, candMsgId]);
    await pgClient.query(`delete from public.notifications where id = any($1::uuid[]);`, [insertedNotifIds]);
    console.log("✓ Cleaned up test messages, interview, and test notifications.");

  } finally {
    await pgClient.end();
  }

  console.log("\n====================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
