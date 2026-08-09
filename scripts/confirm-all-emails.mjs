/**
 * Dev helper: mark all auth users as email-confirmed.
 *
 * Usage:
 *   node --env-file=.env.local scripts/confirm-all-emails.mjs
 *
 * Requires in .env.local (server-only, never NEXT_PUBLIC_*):
 *   SUPABASE_DB_PASSWORD=...
 *   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
 * or:
 *   DATABASE_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres
 *
 * IMPORTANT for NEW signups without verification emails:
 *   Supabase Dashboard → Authentication → Providers → Email → Confirm email → OFF
 */

import dns from "node:dns";
import pg from "pg";

// Prefer IPv4 when the machine has broken IPv6 routes to Supabase.
dns.setDefaultResultOrder("ipv4first");

function projectRefFromPublicUrl() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!publicUrl) return null;
  return new URL(publicUrl).hostname.split(".")[0];
}

function candidateUrls() {
  if (process.env.DATABASE_URL?.trim()) {
    return [process.env.DATABASE_URL.trim()];
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const ref = projectRefFromPublicUrl();
  if (!password || !ref) {
    throw new Error(
      "Set DATABASE_URL or both SUPABASE_DB_PASSWORD and NEXT_PUBLIC_SUPABASE_URL in .env.local",
    );
  }

  const encoded = encodeURIComponent(password);
  const regions = [
    "ap-south-1",
    "ap-southeast-1",
    "ap-northeast-1",
    "us-east-1",
    "us-west-1",
    "eu-west-1",
    "eu-central-1",
  ];

  return [
    `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`,
    ...regions.flatMap((region) => [
      `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
      `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    ]),
  ];
}

async function confirmAll(client) {
  const before = await client.query(
    `select count(*)::int as total,
            count(*) filter (where email_confirmed_at is null)::int as unconfirmed
     from auth.users`,
  );
  console.log("Before:", before.rows[0]);

  const result = await client.query(
    `update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
     where email_confirmed_at is null
     returning id, email`,
  );

  console.log(`Confirmed ${result.rowCount} user(s).`);
  for (const row of result.rows) {
    console.log(` - ${row.email} (${row.id})`);
  }

  const after = await client.query(
    `select count(*)::int as total,
            count(*) filter (where email_confirmed_at is null)::int as unconfirmed
     from auth.users`,
  );
  console.log("After:", after.rows[0]);
}

async function main() {
  const urls = candidateUrls();
  let lastError;

  for (const connectionString of urls) {
    const host = connectionString.split("@")[1]?.split("/")[0] ?? "unknown";
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });

    try {
      await client.connect();
      console.log(`Connected via ${host}`);
      await confirmAll(client);
      await client.end();
      console.log("\nDone. You can sign in now.");
      console.log(
        "For future registrations: Dashboard → Authentication → Providers → Email → Confirm email OFF",
      );
      return;
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
      console.warn(`Failed ${host}: ${error.message}`);
    }
  }

  console.error("\nCould not reach the database from this machine.");
  console.error("Quick manual fix (Dashboard):");
  console.error("1) Authentication → Users → open the user → Confirm email");
  console.error("2) Authentication → Providers → Email → Confirm email → OFF");
  throw lastError;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
