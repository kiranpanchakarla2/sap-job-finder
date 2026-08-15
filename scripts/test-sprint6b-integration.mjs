/**
 * Sprint 6 Phase B: Supabase Integration & RLS Security Test Suite
 * Tests Candidate Messages end-to-end against real Supabase database.
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

  console.log("================================================================");
  console.log("SPRINT 6 PHASE B — CANDIDATE MESSAGES SUPABASE INTEGRATION TEST");
  console.log("================================================================\n");

  let testAppIdA = null;
  let testAppIdB = null;
  let testConvIdA = null;
  let candidateA = null;
  let candidateB = null;
  let employerUser = null;
  let testJobA = null;
  let testJobB = null;

  try {
    // ------------------------------------------------------------------------
    // 1. Setup Candidate A, Candidate B, Employer, and Test Jobs / Applications
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
        last_name: 'Candidate'
      };
    } else {
      candidateA = candidatesRes.rows[0];
      candidateB = candidatesRes.rows[1];
    }

    console.log(`✓ Candidate A: ${candidateA.first_name} ${candidateA.last_name} (${candidateA.user_id})`);
    console.log(`✓ Candidate B: ${candidateB.first_name} ${candidateB.last_name} (${candidateB.user_id})`);

    // Get an employer user
    const employerRes = await pgClient.query(`
      select cp.id as company_id, cp.user_id, cp.company_name
      from company_profiles cp
      limit 1;
    `);
    employerUser = employerRes.rows[0];
    console.log(`✓ Employer: ${employerUser.company_name} (${employerUser.user_id})\n`);

    // Get jobs for application setup
    const jobsRes = await pgClient.query(`
      select j.id, j.title, j.company_id, cp.company_name
      from jobs j
      join company_profiles cp on cp.id = j.company_id
      where j.status = 'active'
      limit 2;
    `);

    testJobA = jobsRes.rows[0];
    testJobB = jobsRes.rows[1] || jobsRes.rows[0];

    // Ensure Candidate A has an application for Job A
    const appARes = await pgClient.query(`
      insert into job_applications (job_id, candidate_id, status)
      values ($1, $2, 'applied')
      on conflict (job_id, candidate_id) do update set status = 'applied'
      returning id;
    `, [testJobA.id, candidateA.candidate_id]);
    testAppIdA = appARes.rows[0].id;

    // Ensure Candidate B has an application for Job B
    const appBRes = await pgClient.query(`
      insert into job_applications (job_id, candidate_id, status)
      values ($1, $2, 'applied')
      on conflict (job_id, candidate_id) do update set status = 'applied'
      returning id;
    `, [testJobB.id, candidateB.candidate_id]);
    testAppIdB = appBRes.rows[0].id;

    console.log(`✓ Application A for Candidate A (App ID: ${testAppIdA})`);
    console.log(`✓ Application B for Candidate B (App ID: ${testAppIdB})\n`);

    // Clean up any stale conversation data from previous interrupted runs
    await pgClient.query(`delete from public.messages where conversation_id in (select id from public.conversations where application_id in ($1, $2));`, [testAppIdA, testAppIdB]);
    await pgClient.query(`delete from public.conversations where application_id in ($1, $2);`, [testAppIdA, testAppIdB]);

    // ------------------------------------------------------------------------
    // 2. Conversation Creation & Authorization
    // ------------------------------------------------------------------------
    console.log("[2. CONVERSATION CREATION & AUTHORIZATION]");

    // Candidate A creates/gets conversation for Application A
    await asCandidate(candidateA.user_id);
    const convARes = await pgClient.query(`
      select * from public.get_or_create_conversation($1);
    `, [testAppIdA]);

    testConvIdA = convARes.rows[0].id;
    report(Boolean(testConvIdA), `Candidate A created/retrieved conversation ${testConvIdA}`);

    // Candidate B tries to create/get conversation for Application A (should fail authorization)
    await asCandidate(candidateB.user_id);
    let candidateBBlocked = false;
    try {
      await pgClient.query(`
        select * from public.get_or_create_conversation($1);
      `, [testAppIdA]);
    } catch (err) {
      candidateBBlocked = err.message.includes("Not authorized");
    }
    report(candidateBBlocked, "Candidate B is blocked from creating conversation for Candidate A's application");

    // ------------------------------------------------------------------------
    // 3. Message Creation & Database-Generated Timestamps
    // ------------------------------------------------------------------------
    console.log("\n[3. MESSAGE CREATION & TIMESTAMP VERIFICATION]");

    // Candidate A sends a message
    await asCandidate(candidateA.user_id);
    const msg1Res = await pgClient.query(`
      insert into public.messages (conversation_id, sender_id, content)
      values ($1, $2, $3)
      returning id, sender_id, content, created_at, read_at;
    `, [testConvIdA, candidateA.user_id, "Hello, I am very interested in this SAP position."]);

    const msg1 = msg1Res.rows[0];
    report(msg1.content === "Hello, I am very interested in this SAP position.", "Candidate message inserted successfully");
    report(msg1.sender_id === candidateA.user_id, "Sender identity matches authenticated Candidate A");
    report(Boolean(msg1.created_at), `Message has server-generated timestamp: ${msg1.created_at.toISOString()}`);
    report(msg1.read_at === null, "New message starts with read_at = null");

    // Check conversation updated_at was bumped
    const convCheck1 = await pgClient.query(`
      select updated_at from public.conversations where id = $1;
    `, [testConvIdA]);
    report(Boolean(convCheck1.rows[0].updated_at), "Conversation updated_at automatically maintained");

    // ------------------------------------------------------------------------
    // 4. Employer Reply & Unread Tracking
    // ------------------------------------------------------------------------
    console.log("\n[4. EMPLOYER REPLY & UNREAD CALCULATION]");

    // Employer sends reply
    await asCandidate(employerUser.user_id);
    const msg2Res = await pgClient.query(`
      insert into public.messages (conversation_id, sender_id, content)
      values ($1, $2, $3)
      returning id, sender_id, content, created_at, read_at;
    `, [testConvIdA, employerUser.user_id, "Thank you for applying! When are you free for a call?"]);

    const msg2 = msg2Res.rows[0];
    report(msg2.sender_id === employerUser.user_id, "Employer message inserted successfully");

    // Candidate A queries unread count
    await asCandidate(candidateA.user_id);
    const unreadRes = await pgClient.query(`
      select count(*) as unread_count
      from public.messages m
      where m.conversation_id = $1
        and m.sender_id <> $2
        and m.read_at is null;
    `, [testConvIdA, candidateA.user_id]);

    report(Number(unreadRes.rows[0].unread_count) === 1, "Candidate A sees exactly 1 unread message from employer");

    // ------------------------------------------------------------------------
    // 5. Mark Conversation as Read
    // ------------------------------------------------------------------------
    console.log("\n[5. MARK CONVERSATION AS READ & PERSISTENCE]");

    // Candidate A marks incoming messages as read
    await asCandidate(candidateA.user_id);
    const markReadRes = await pgClient.query(`
      update public.messages
      set read_at = now()
      where conversation_id = $1
        and sender_id <> $2
        and read_at is null
      returning id, read_at;
    `, [testConvIdA, candidateA.user_id]);

    report(markReadRes.rows.length === 1, "Candidate A marked 1 incoming message as read");
    report(Boolean(markReadRes.rows[0].read_at), "Message read_at persisted with timestamp");

    // Verify unread count is now 0
    const unreadAfterRes = await pgClient.query(`
      select count(*) as unread_count
      from public.messages m
      where m.conversation_id = $1
        and m.sender_id <> $2
        and m.read_at is null;
    `, [testConvIdA, candidateA.user_id]);

    report(Number(unreadAfterRes.rows[0].unread_count) === 0, "Unread count decreased to 0 after marking conversation read");

    // ------------------------------------------------------------------------
    // 6. RLS Cross-User Security Isolation (Candidate A vs Candidate B)
    // ------------------------------------------------------------------------
    console.log("\n[6. RLS CROSS-USER SECURITY ISOLATION]");

    // Candidate B attempts to select Candidate A's conversation
    await asCandidate(candidateB.user_id);
    const bSelectConv = await pgClient.query(`
      select * from public.conversations where id = $1;
    `, [testConvIdA]);
    report(bSelectConv.rows.length === 0, "Candidate B cannot SELECT Candidate A's conversation (0 rows returned via RLS)");

    // Candidate B attempts to select Candidate A's messages
    const bSelectMsgs = await pgClient.query(`
      select * from public.messages where conversation_id = $1;
    `, [testConvIdA]);
    report(bSelectMsgs.rows.length === 0, "Candidate B cannot SELECT messages from Candidate A's conversation (0 rows)");

    // Candidate B attempts to insert message into Candidate A's conversation
    let bInsertBlocked = false;
    try {
      await pgClient.query(`
        insert into public.messages (conversation_id, sender_id, content)
        values ($1, $2, $3);
      `, [testConvIdA, candidateB.user_id, "Infiltrator message"]);
    } catch (err) {
      bInsertBlocked = err.message.includes("row-level security");
    }
    report(bInsertBlocked, "Candidate B is blocked by RLS when trying to INSERT message into Candidate A's conversation");

    // Candidate A attempts to spoof sender_id as Candidate B
    await asCandidate(candidateA.user_id);
    let spoofBlocked = false;
    try {
      await pgClient.query(`
        insert into public.messages (conversation_id, sender_id, content)
        values ($1, $2, $3);
      `, [testConvIdA, candidateB.user_id, "Spoofed sender message"]);
    } catch (err) {
      spoofBlocked = err.message.includes("row-level security");
    }
    report(spoofBlocked, "Candidate A cannot spoof sender_id as another user (blocked by RLS check)");

    // Candidate A (sender) attempts to edit sent message content (RLS blocks updating own message)
    const updateOwnRes = await pgClient.query(`
      update public.messages
      set content = 'Tampered content'
      where id = $1;
    `, [msg1.id]);
    report(updateOwnRes.rowCount === 0, "Sender cannot edit their own sent message content (0 rows modified by RLS)");

    // Employer (recipient) attempts to edit Candidate A's message content (Trigger protects content)
    await asCandidate(employerUser.user_id);
    let triggerBlocked = false;
    try {
      await pgClient.query(`
        update public.messages
        set content = 'Employer tampered candidate content'
        where id = $1;
      `, [msg1.id]);
    } catch (err) {
      triggerBlocked = err.message.includes("message content cannot be changed");
    }
    report(triggerBlocked, "Recipient cannot modify message content (blocked by database trigger)");

    // ------------------------------------------------------------------------
    // 7. Full Join Query (Candidate View)
    // ------------------------------------------------------------------------
    console.log("\n[7. CANDIDATE CONVERSATION RELATIONAL QUERY]");
    await asCandidate(candidateA.user_id);

    const fullConvRes = await pgClient.query(`
      select
        c.id,
        c.application_id,
        c.created_at,
        c.updated_at,
        ja.status as application_status,
        j.id as job_id,
        j.title as job_title,
        j.location as job_location,
        cp.id as company_id,
        cp.company_name,
        cp.logo_url as company_logo_url
      from public.conversations c
      join public.job_applications ja on ja.id = c.application_id
      join public.jobs j on j.id = ja.job_id
      left join public.company_profiles cp on cp.id = j.company_id
      where c.id = $1;
    `, [testConvIdA]);

    const convDetail = fullConvRes.rows[0];
    report(convDetail.company_name === employerUser.company_name, `Company name properly resolved: ${convDetail.company_name}`);
    report(convDetail.job_title === testJobA.title, `Job title properly resolved: ${convDetail.job_title}`);
    report(convDetail.application_id === testAppIdA, `Application context properly resolved: ${convDetail.application_id}`);

    // Fetch ordered messages
    const msgsRes = await pgClient.query(`
      select id, sender_id, content, created_at, read_at
      from public.messages
      where conversation_id = $1
      order by created_at asc;
    `, [testConvIdA]);

    report(msgsRes.rows.length === 2, `Chronological messages list returned: ${msgsRes.rows.length} messages`);
    report(msgsRes.rows[0].content === msg1.content, "Oldest message is first in thread");
    report(msgsRes.rows[1].content === msg2.content, "Newest message is last in thread");

  } finally {
    // ------------------------------------------------------------------------
    // Cleanup Test Data
    // ------------------------------------------------------------------------
    console.log("\n[8. CLEANUP]");
    await asServiceRole();
    if (testConvIdA) {
      await pgClient.query(`delete from public.messages where conversation_id = $1;`, [testConvIdA]);
      await pgClient.query(`delete from public.conversations where id = $1;`, [testConvIdA]);
      console.log(`✓ Cleaned up test conversation ${testConvIdA}`);
    }
    await pgClient.end();
  }

  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
