import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

async function testRpc() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Cleaning up previous test user if any...");
  await client.query(`DELETE FROM auth.users WHERE email = 'rpc-test-candidate@example.com'`);

  console.log("Creating test RPC delete_candidate_account...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.delete_candidate_account()
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, auth, pg_temp
    AS $$
    DECLARE
      v_user_id uuid;
      v_role public.app_role;
      v_candidate_id uuid;
      v_resume_paths text[];
    BEGIN
      v_user_id := auth.uid();
      IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED' USING errcode = '42501';
      END IF;

      -- Check role in profiles
      SELECT role INTO v_role FROM public.profiles WHERE user_id = v_user_id;
      IF v_role IS DISTINCT FROM 'candidate' THEN
        RAISE EXCEPTION 'FORBIDDEN_NOT_A_CANDIDATE' USING errcode = '42501';
      END IF;

      -- Get candidate_id
      SELECT id INTO v_candidate_id FROM public.candidate_profiles WHERE user_id = v_user_id;
      IF v_candidate_id IS NULL THEN
        RAISE EXCEPTION 'CANDIDATE_NOT_FOUND' USING errcode = 'P0002';
      END IF;

      -- Collect resume storage paths
      SELECT COALESCE(array_agg(COALESCE(storage_path, resume_url)), ARRAY[]::text[])
      INTO v_resume_paths
      FROM public.candidate_resumes
      WHERE candidate_id = v_candidate_id;

      -- Perform clean cascaded removal
      DELETE FROM public.candidate_settings WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_subscriptions WHERE candidate_id = v_candidate_id;
      DELETE FROM public.job_alerts WHERE candidate_id = v_candidate_id;
      DELETE FROM public.saved_jobs WHERE candidate_id = v_candidate_id;
      DELETE FROM public.notifications WHERE user_id = v_user_id;
      DELETE FROM public.saved_candidates WHERE candidate_id = v_candidate_id;
      DELETE FROM public.employer_shortlisted_candidates WHERE candidate_id = v_candidate_id;
      DELETE FROM public.talent_search_usage WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_career_highlights WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_certifications WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_education WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_experience WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_skills WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_resumes WHERE candidate_id = v_candidate_id;
      DELETE FROM public.job_applications WHERE candidate_id = v_candidate_id;
      DELETE FROM public.candidate_profiles WHERE id = v_candidate_id;
      DELETE FROM public.profiles WHERE user_id = v_user_id;
      DELETE FROM auth.users WHERE id = v_user_id;

      RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'candidate_id', v_candidate_id,
        'resume_paths', v_resume_paths
      );
    END;
    $$;

    REVOKE EXECUTE ON FUNCTION public.delete_candidate_account() FROM public, anon;
    GRANT EXECUTE ON FUNCTION public.delete_candidate_account() TO authenticated;
  `);

  console.log("RPC created. Now creating test candidate...");
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
      'rpc-test-candidate@example.com',
      crypt('Secret123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"candidate","first_name":"RpcCandidate","last_name":"User"}',
      now(),
      now()
    )
    RETURNING id;
  `);
  const userId = userRes.rows[0].id;
  const cpRes = await client.query(`SELECT id FROM public.candidate_profiles WHERE user_id = $1`, [userId]);
  const candidateId = cpRes.rows[0].id;

  // Add resume
  await client.query(`
    INSERT INTO public.candidate_resumes (candidate_id, resume_name, resume_url, storage_path)
    VALUES ($1, 'resume.pdf', 'https://example.com/resume.pdf', '${candidateId}/resume.pdf');
  `, [candidateId]);

  console.log("Testing calling RPC as candidate...");
  await client.query(`SET ROLE authenticated;`);
  await client.query(`SELECT set_config('request.jwt.claim.sub', $1, false);`, [userId]);
  await client.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', false);`);

  const rpcRes = await client.query(`SELECT public.delete_candidate_account() as result;`);
  console.log("RPC Result:", rpcRes.rows[0].result);

  await client.query(`RESET ROLE;`);

  const authUserCheck = await client.query(`SELECT count(*) FROM auth.users WHERE id = $1`, [userId]);
  console.log("Auth user count after RPC:", authUserCheck.rows[0].count);

  await client.end();
}

testRpc().catch(err => {
  console.error("RPC test error:", err);
  process.exit(1);
});
