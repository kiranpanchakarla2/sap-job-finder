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

  const res = await client.query(`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('applications', 'job_applications', 'resumes', 'candidate_resumes');
  `);
  console.table(res.rows);

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
