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

  console.log("=== PROFILES SCHEMA & CONSTRAINTS ===");
  const pCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles';
  `);
  console.table(pCols.rows);

  console.log("=== CANDIDATE_PROFILES SCHEMA & CONSTRAINTS ===");
  const cpCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'candidate_profiles';
  `);
  console.table(cpCols.rows);

  console.log("=== NOTIFICATIONS SCHEMA & CONSTRAINTS ===");
  const notifCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications';
  `);
  console.table(notifCols.rows);

  console.log("=== CONVERSATIONS SCHEMA & CONSTRAINTS ===");
  const convCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations';
  `);
  console.table(convCols.rows);

  console.log("=== MESSAGES SCHEMA & CONSTRAINTS ===");
  const msgCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages';
  `);
  console.table(msgCols.rows);

  console.log("=== TRIGGERS ON ALL PUBLIC TABLES ===");
  const triggers = await client.query(`
    SELECT event_object_table, trigger_name, event_manipulation, action_statement, action_orientation, action_timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
  `);
  console.table(triggers.rows);

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
