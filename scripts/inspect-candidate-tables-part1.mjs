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

  const tablesToCheck = [
    'profiles',
    'candidate_profiles',
    'candidate_settings',
    'candidate_resumes',
    'candidate_skills',
    'candidate_experience',
    'candidate_education',
    'candidate_certifications',
    'candidate_career_highlights',
    'candidate_subscriptions',
    'candidate_plans',
    'saved_jobs',
    'job_alerts',
    'notifications',
    'job_applications',
    'application_answers',
    'application_status_history'
  ];

  for (const tbl of tablesToCheck) {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tbl]);
    console.log(`\n================== ${tbl} ==================`);
    for (const c of cols.rows) {
      console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable}, default: ${c.column_default})`);
    }
  }

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
