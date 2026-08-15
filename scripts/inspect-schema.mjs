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

  console.log("=== TABLES IN PUBLIC SCHEMA ===");
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(tables.rows.map(r => r.table_name));

  console.log("\n=== FOREIGN KEYS INVOLVING ALL TABLES ===");
  const fks = await client.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS mechanical_kcu
      ON tc.constraint_name = mechanical_kcu.constraint_name
      AND tc.table_schema = mechanical_kcu.table_schema
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    GROUP BY tc.table_name, kcu.column_name, ccu.table_name, ccu.column_name, rc.delete_rule
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.table(fks.rows);

  console.log("\n=== STORAGE BUCKETS & POLICIES ===");
  const buckets = await client.query(`
    SELECT id, name, public, file_size_limit, allowed_mime_types
    FROM storage.buckets;
  `);
  console.table(buckets.rows);

  const storagePolicies = await client.query(`
    SELECT policyname, tablename, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage';
  `);
  console.table(storagePolicies.rows);

  console.log("\n=== CANDIDATE-RELATED TABLES COLUMN DEFINITIONS ===");
  const candidateTables = [
    'profiles',
    'candidate_profiles',
    'candidate_settings',
    'candidate_preferences',
    'resumes',
    'candidate_resumes',
    'candidate_skills',
    'candidate_experience',
    'candidate_education',
    'candidate_certifications',
    'candidate_career_highlights',
    'applications',
    'job_applications',
    'application_answers',
    'application_status_history',
    'job_application_questions',
    'job_alerts',
    'saved_jobs',
    'saved_searches',
    'notifications',
    'messages',
    'conversations',
    'candidate_subscriptions',
    'candidate_plans',
    'interviews',
    'interview_feedback',
    'saved_candidates',
    'employer_shortlisted_candidates',
    'talent_search_usage'
  ];

  for (const table of candidateTables) {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    if (cols.rows.length > 0) {
      console.log(`\n--- TABLE: ${table} ---`);
      console.table(cols.rows);
    }
  }

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
