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
    SELECT
      c.conname,
      src_ns.nspname AS src_schema,
      src_tbl.relname AS src_table,
      tgt_ns.nspname AS tgt_schema,
      tgt_tbl.relname AS tgt_table,
      c.confdeltype,
      pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class src_tbl ON src_tbl.oid = c.conrelid
    JOIN pg_namespace src_ns ON src_ns.oid = src_tbl.relnamespace
    JOIN pg_class tgt_tbl ON tgt_tbl.oid = c.confrelid
    JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_tbl.relnamespace
    WHERE tgt_ns.nspname = 'auth' AND tgt_tbl.relname = 'users';
  `);
  console.log("=== DIRECT PG_CONSTRAINT REFERENCES TO AUTH.USERS ===");
  for (const row of constraints.rows) {
    const action = {
      'a': 'NO ACTION',
      'r': 'RESTRICT',
      'c': 'CASCADE',
      'n': 'SET NULL',
      'd': 'SET DEFAULT'
    }[row.confdeltype] || row.confdeltype;
    console.log(`${row.src_table} | ${row.conname} | ON DELETE ${action} | ${row.def}`);
  }

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
