import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

async function inspect() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const constraints = await client.query(`
    SELECT conname, contype, relname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public'
    ORDER BY relname, conname;
  `);
  for (const row of constraints.rows) {
    console.log(`${row.relname} | ${row.conname} | ${row.contype} | ${row.pg_get_constraintdef}`);
  }

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
