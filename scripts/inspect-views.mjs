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

  const views = await client.query(`
    SELECT table_name, view_definition
    FROM information_schema.views 
    WHERE table_schema = 'public';
  `);
  for (const v of views.rows) {
    console.log(`\n=== VIEW: ${v.table_name} ===`);
    console.log(v.view_definition);
  }

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
