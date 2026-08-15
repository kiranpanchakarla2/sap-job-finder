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

  console.log("=== AUTH TRIGGERS ===");
  const authTriggers = await client.query(`
    SELECT event_object_schema, event_object_table, trigger_name, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth';
  `);
  console.table(authTriggers.rows);

  console.log("\n=== FUNCTION DEFINITION FOR AUTH TRIGGER ===");
  const authFuncs = await client.query(`
    SELECT routine_name, routine_definition
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%' OR routine_name LIKE '%auth%');
  `);
  for (const f of authFuncs.rows) {
    console.log(`--- ${f.routine_name} ---`);
    console.log(f.routine_definition);
  }

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
