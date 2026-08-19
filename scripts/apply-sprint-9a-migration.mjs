import fs from "node:fs";
import pg from "pg";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment.");
  process.exit(1);
}

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const sql = fs.readFileSync("supabase/migrations/20260819120000_subscription_foundation_sprint9a.sql", "utf-8");
  console.log("Executing migration 20260819120000_subscription_foundation_sprint9a.sql...");
  await client.query(sql);
  console.log("Migration 20260819120000_subscription_foundation_sprint9a.sql executed successfully!");

  await client.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
