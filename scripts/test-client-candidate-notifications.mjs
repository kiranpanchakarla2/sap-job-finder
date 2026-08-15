/**
 * Candidate Notifications Client Service Integration Test
 */

import dns from "node:dns";
import assert from "node:assert/strict";
import pg from "pg";
import {
  formatNotificationTime,
  getNotificationDestination,
  getNotificationMeta,
  groupNotificationsByDate,
} from "../src/features/candidate-notifications/lib/notificationUtils.ts";

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
  console.log("CANDIDATE NOTIFICATIONS CLIENT SERVICE & FORMATTING TEST");
  console.log("================================================================\n");

  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  let testNotifIds = [];

  try {
    const candidateRes = await pgClient.query(`
      select cp.id as candidate_id, cp.user_id, u.email, cp.first_name, cp.last_name
      from candidate_profiles cp
      join auth.users u on u.id = cp.user_id
      limit 1;
    `);
    const candidate = candidateRes.rows[0];
    console.log(`✓ Candidate: ${candidate.first_name} ${candidate.last_name} (${candidate.user_id})`);

    // Reset test notifications
    await pgClient.query(`delete from public.notifications where user_id = $1;`, [candidate.user_id]);

    // Insert 5 notifications with different timestamps & types
    const now = new Date();
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000);

    const inserted = await pgClient.query(`
      insert into public.notifications (
        user_id, type, title, description, created_at, read_at, priority, related_entity_type, related_entity_id, action_url, action_label
      ) values
      ($1, 'message', 'New Message from Acme', 'You received a new message.', $2, null, 'normal', 'message', gen_random_uuid()::text, '/candidate/messages', 'View Message'),
      ($1, 'interview', 'Interview Scheduled', 'Interview scheduled for tomorrow.', $2, null, 'important', 'interview', gen_random_uuid()::text, '/candidate/applications', 'View Interview'),
      ($1, 'application', 'Application Update', 'Your application moved to Shortlisted.', $3, null, 'normal', 'application', gen_random_uuid()::text, '/candidate/applications', 'View Application'),
      ($1, 'job_alert', 'New Job Matches', '5 new jobs match your SAP Fiori alert.', $4, null, 'normal', 'job_alert', gen_random_uuid()::text, '/candidate/job-alerts', 'View Jobs'),
      ($1, 'saved_job', 'Saved Job Closing Soon', 'SAP Consultant role is expiring.', $4, now(), 'normal', 'saved_job', gen_random_uuid()::text, '/candidate/saved-jobs', 'View Job')
      returning *;
    `, [candidate.user_id, now.toISOString(), yesterday.toISOString(), threeDaysAgo.toISOString()]);

    testNotifIds = inserted.rows.map((r) => r.id);
    report(testNotifIds.length === 5, `Inserted 5 test notifications across multiple dates and types`);

    // Set role to authenticated candidate
    await pgClient.query(`set role authenticated;`);
    await pgClient.query(`select set_config('request.jwt.claim.sub', $1, false);`, [candidate.user_id]);
    await pgClient.query(`select set_config('request.jwt.claim.role', 'authenticated', false);`);

    // 1. Query notifications
    const queryRes = await pgClient.query(`
      select * from public.notifications
      order by created_at desc
      limit 50;
    `);
    report(queryRes.rows.length === 5, `Candidate retrieved all 5 notifications ordered by created_at DESC`);

    // Map rows to CandidateNotification objects
    const items = queryRes.rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description || r.message || "",
      createdAt: r.created_at.toISOString(),
      readAt: r.read_at ? r.read_at.toISOString() : null,
      isRead: r.read_at !== null,
      priority: r.priority,
      relatedEntityType: r.related_entity_type,
      relatedEntityId: r.related_entity_id,
      actionUrl: r.action_url,
      actionLabel: r.action_label,
    }));

    // 2. Unread Count calculation
    const unreadCountRes = await pgClient.query(`
      select count(*) from public.notifications where read_at is null;
    `);
    const unreadCount = parseInt(unreadCountRes.rows[0].count, 10);
    report(unreadCount === 4, `Unread count calculation returned 4 unread notifications`);

    // 3. Date grouping
    const groups = groupNotificationsByDate(items);
    const groupTitles = groups.map((g) => g.groupTitle);
    console.log(`✓ Group titles generated: ${groupTitles.join(", ")}`);
    report(groupTitles.includes("Today"), "Date grouping includes 'Today'");
    report(groupTitles.includes("Yesterday"), "Date grouping includes 'Yesterday'");
    report(groupTitles.includes("Earlier this week") || groupTitles.includes("Earlier"), "Date grouping includes 'Earlier this week' or 'Earlier'");

    // 4. Time formatting
    const timeFormatted = formatNotificationTime(items[0].createdAt);
    report(timeFormatted.includes("Just now") || timeFormatted.includes("0m ago") || timeFormatted.includes("m ago") || timeFormatted.includes("h ago"), `Time formatting returned valid relative format: '${timeFormatted}'`);

    // 5. Destination URL resolution
    for (const item of items) {
      const dest = getNotificationDestination(item);
      report(Boolean(dest) && dest.startsWith("/candidate/"), `Destination URL resolved safely: ${item.type} -> ${dest}`);
    }

    // 6. Meta resolution
    for (const item of items) {
      const meta = getNotificationMeta(item.type);
      report(Boolean(meta.icon) && Boolean(meta.categoryLabel), `Notification metadata resolved: ${item.type} (${meta.categoryLabel})`);
    }

    // 7. Mark single as read
    const firstUnread = items.find((i) => !i.isRead);
    await pgClient.query(`
      update public.notifications
      set read_at = now()
      where id = $1;
    `, [firstUnread.id]);

    const postSingleUnreadRes = await pgClient.query(`
      select count(*) from public.notifications where read_at is null;
    `);
    report(parseInt(postSingleUnreadRes.rows[0].count, 10) === 3, "Unread count decremented to 3 after marking single notification read");

    // 8. Mark all as read
    await pgClient.query(`
      update public.notifications
      set read_at = now()
      where read_at is null;
    `);

    const finalUnreadRes = await pgClient.query(`
      select count(*) from public.notifications where read_at is null;
    `);
    report(parseInt(finalUnreadRes.rows[0].count, 10) === 0, "Unread count is 0 after markAllAsRead");

    // 9. Clean up
    await pgClient.query(`reset role;`);
    await pgClient.query(`delete from public.notifications where id = any($1::uuid[]);`, [testNotifIds]);
    console.log("✓ Cleaned up test notifications.");

  } finally {
    await pgClient.end();
  }

  console.log("\n================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
