import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

async function applyMigration() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const migrationPath = path.resolve("supabase/migrations/20260816160000_subscription_bulk_upload_gating.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  console.log("Applying migration 20260816160000_subscription_bulk_upload_gating.sql...");
  await client.query(sql);
  console.log("Successfully applied subscription_bulk_upload_gating migration.");

  const plans = await client.query("select id, name, features from public.subscription_plans order by price_monthly asc;");
  console.log("\nUpdated Subscription Plans Features:");
  console.table(plans.rows);

  await client.end();
}

applyMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
