import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const sqlPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260820010000_super_admin_candidate_employer_management_sprint10c.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf-8");
  console.log("Applying Sprint 10C migration...");
  await pool.query(sql);
  console.log("Sprint 10C migration applied successfully.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
