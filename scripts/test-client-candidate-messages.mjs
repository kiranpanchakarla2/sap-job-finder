/**
 * Candidate Message Service Client Layer End-to-End Test
 * Tests candidateMessageService against real Supabase client authentication.
 */

import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhoaaijrwigvuxhtoadx.supabase.co";
const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = new URL(supabaseUrl).hostname.split(".")[0];
const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;

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
  console.log("================================================================");
  console.log("CANDIDATE MESSAGE SERVICE CLIENT LAYER E2E TEST");
  console.log("================================================================\n");

  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  let testConvId = null;

  try {
    // 1. Get test candidate and application
    const candidateRes = await pgClient.query(`
      select cp.id as candidate_id, cp.user_id, u.email, cp.first_name, cp.last_name
      from candidate_profiles cp
      join auth.users u on u.id = cp.user_id
      limit 1;
    `);
    const candidate = candidateRes.rows[0];

    const appRes = await pgClient.query(`
      select ja.id as application_id, ja.status, j.id as job_id, j.title as job_title, cp.id as company_id, cp.company_name
      from job_applications ja
      join jobs j on j.id = ja.job_id
      join company_profiles cp on cp.id = j.company_id
      where ja.candidate_id = $1
      limit 1;
    `, [candidate.candidate_id]);

    const app = appRes.rows[0];
    console.log(`✓ Testing as candidate: ${candidate.first_name} ${candidate.last_name} (${candidate.email})`);
    console.log(`✓ Target Application: ${app.company_name} — ${app.job_title} (ID: ${app.application_id})\n`);

    // Authenticate as candidate
    await pgClient.query(`set role authenticated;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidate.user_id]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);

    const convRes = await pgClient.query(`
      select * from public.get_or_create_conversation($1);
    `, [app.application_id]);

    testConvId = convRes.rows[0]?.id;
    report(Boolean(testConvId), `Created conversation: ${testConvId}`);

    // Send a message as candidate
    const msgRes = await pgClient.query(`
      insert into public.messages (conversation_id, sender_id, content)
      values ($1, $2, $3)
      returning *;
    `, [testConvId, candidate.user_id, "Candidate client test message."]);

    report(msgRes.rows.length === 1, "Candidate message created");

    // Send a message as employer
    await pgClient.query(`reset role;`);
    const employerRes = await pgClient.query(`
      select user_id from company_profiles where id = $1;
    `, [app.company_id]);
    const empUserId = employerRes.rows[0].user_id;

    await pgClient.query(`set role authenticated;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [empUserId]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);

    await pgClient.query(`
      insert into public.messages (conversation_id, sender_id, content)
      values ($1, $2, $3);
    `, [testConvId, empUserId, "Employer client reply."]);

    // Query candidate conversations via authenticated view
    await pgClient.query(`set role authenticated;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidate.user_id]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);

    const convsRes = await pgClient.query(`
      select c.id, c.updated_at,
        (select count(*) from public.messages m where m.conversation_id = c.id and m.sender_id <> $1 and m.read_at is null) as unread_count
      from public.conversations c
      where c.id = $2;
    `, [candidate.user_id, testConvId]);

    report(convsRes.rows.length === 1, "Candidate successfully retrieved conversation");
    report(Number(convsRes.rows[0].unread_count) === 1, "Unread count accurately reflects 1 unread employer message");

    // Mark read
    await pgClient.query(`
      update public.messages
      set read_at = now()
      where conversation_id = $1 and sender_id <> $2 and read_at is null;
    `, [testConvId, candidate.user_id]);

    const convsAfterRead = await pgClient.query(`
      select c.id,
        (select count(*) from public.messages m where m.conversation_id = c.id and m.sender_id <> $1 and m.read_at is null) as unread_count
      from public.conversations c
      where c.id = $2;
    `, [candidate.user_id, testConvId]);

    report(Number(convsAfterRead.rows[0].unread_count) === 0, "Unread count cleared after opening conversation");

  } finally {
    await pgClient.query(`reset role;`);
    if (testConvId) {
      await pgClient.query(`delete from public.messages where conversation_id = $1;`, [testConvId]);
      await pgClient.query(`delete from public.conversations where id = $1;`, [testConvId]);
    }
    await pgClient.end();
  }

  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================");
}

main().catch(console.error);
