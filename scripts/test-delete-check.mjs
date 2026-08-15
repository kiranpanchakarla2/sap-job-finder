import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

async function test() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Testing user creation & deletion capability in Postgres...");
  
  // 1. Create a test candidate in auth.users
  const userRes = await client.query(`
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'test-delete-candidate-check@example.com',
      crypt('Secret123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"candidate","first_name":"TestDelete","last_name":"Candidate"}',
      now(),
      now()
    )
    RETURNING id;
  `);
  const testUserId = userRes.rows[0].id;
  console.log("Created test user:", testUserId);

  // Check profile created by trigger
  const prof = await client.query(`SELECT * FROM public.profiles WHERE user_id = $1`, [testUserId]);
  console.log("Profile created:", prof.rows[0]);

  const cand = await client.query(`SELECT * FROM public.candidate_profiles WHERE user_id = $1`, [testUserId]);
  console.log("Candidate profile created:", cand.rows[0]);

  // Test deleting directly from auth.users
  const del = await client.query(`DELETE FROM auth.users WHERE id = $1`, [testUserId]);
  console.log("Deleted from auth.users:", del.rowCount);

  // Verify profile and candidate_profile are gone due to ON DELETE CASCADE
  const profAfter = await client.query(`SELECT * FROM public.profiles WHERE user_id = $1`, [testUserId]);
  console.log("Profile after deletion (should be 0 rows):", profAfter.rows.length);

  const candAfter = await client.query(`SELECT * FROM public.candidate_profiles WHERE user_id = $1`, [testUserId]);
  console.log("Candidate profile after deletion (should be 0 rows):", candAfter.rows.length);

  await client.end();
}

test().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
