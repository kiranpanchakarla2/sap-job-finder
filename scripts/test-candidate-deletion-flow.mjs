import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

async function testFullCandidateDeletion() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Cleaning up prior test user if present...");
  // Clean up any test conversations/apps first if lingering
  await client.query(`
    DELETE FROM public.job_applications 
    WHERE candidate_id IN (
      SELECT id FROM public.candidate_profiles 
      WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'full-test-delete-candidate@example.com')
    )
  `);
  await client.query(`DELETE FROM auth.users WHERE email = 'full-test-delete-candidate@example.com'`);

  console.log("=== CREATING COMPLETE CANDIDATE WITH ALL DATA ===");

  // 1. Create candidate user in auth.users
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
      'full-test-delete-candidate@example.com',
      crypt('Secret123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"candidate","first_name":"FullDelete","last_name":"Candidate"}',
      now(),
      now()
    )
    RETURNING id;
  `);
  const userId = userRes.rows[0].id;

  const cpRes = await client.query(`SELECT id FROM public.candidate_profiles WHERE user_id = $1`, [userId]);
  const candidateId = cpRes.rows[0].id;
  console.log(`Created Candidate user_id: ${userId}, candidate_id: ${candidateId}`);

  // 2. Add Candidate Settings
  await client.query(`
    INSERT INTO public.candidate_settings (candidate_id, notification_preferences, job_preferences, privacy_preferences)
    VALUES ($1, '{"jobAlerts": true}'::jsonb, '{"careerLevel": "Senior"}'::jsonb, '{"profileVisibility": "public"}'::jsonb)
    ON CONFLICT (candidate_id) DO NOTHING;
  `, [candidateId]);

  // 3. Add Resume
  const resumeRes = await client.query(`
    INSERT INTO public.candidate_resumes (candidate_id, resume_name, resume_url, is_primary, storage_path)
    VALUES ($1, 'MyResume.pdf', '${candidateId}/test-resume.pdf', true, '${candidateId}/test-resume.pdf')
    RETURNING id;
  `, [candidateId]);
  const resumeId = resumeRes.rows[0].id;

  // 4. Add Skills, Experience, Education, Certifications, Highlights
  await client.query(`
    INSERT INTO public.candidate_experience (candidate_id, designation, company, start_date, currently_working)
    VALUES ($1, 'SAP Consultant', 'TechCorp', '2023-01-01', true);
  `, [candidateId]);

  await client.query(`
    INSERT INTO public.candidate_education (candidate_id, degree, college)
    VALUES ($1, 'B.Tech', 'IIT');
  `, [candidateId]);

  await client.query(`
    INSERT INTO public.candidate_certifications (candidate_id, certificate_name)
    VALUES ($1, 'SAP Certified Associate');
  `, [candidateId]);

  await client.query(`
    INSERT INTO public.candidate_career_highlights (candidate_id, content)
    VALUES ($1, 'Led 5 S/4HANA migrations');
  `, [candidateId]);

  // 5. Add Subscription
  await client.query(`
    INSERT INTO public.candidate_subscriptions (candidate_id, plan_id, status, price_monthly)
    VALUES ($1, 'professional', 'active', 999)
    ON CONFLICT (candidate_id) DO NOTHING;
  `, [candidateId]);

  // 6. Add Job Alert & Saved Job (find an existing job)
  const jobRes = await client.query(`SELECT id FROM public.jobs LIMIT 1;`);
  if (jobRes.rows.length > 0) {
    const jobId = jobRes.rows[0].id;
    await client.query(`
      INSERT INTO public.saved_jobs (candidate_id, job_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `, [candidateId, jobId]);

    // 7. Add Job Application
    const appRes = await client.query(`
      INSERT INTO public.job_applications (job_id, candidate_id, resume_id, cover_letter, status)
      VALUES ($1, $2, $3, 'Test Cover Letter', 'applied')
      ON CONFLICT (job_id, candidate_id) DO UPDATE SET status = 'applied'
      RETURNING id;
    `, [jobId, candidateId, resumeId]);
    const appId = appRes.rows[0].id;

    // 8. Add Conversation & Message
    const convRes = await client.query(`
      INSERT INTO public.conversations (application_id, created_by)
      VALUES ($1, $2)
      ON CONFLICT (application_id) DO UPDATE SET updated_at = now()
      RETURNING id;
    `, [appId, userId]);
    const convId = convRes.rows[0].id;

    await client.query(`
      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES ($1, $2, 'Hello from candidate');
    `, [convId, userId]);
  }

  await client.query(`
    INSERT INTO public.job_alerts (candidate_id, name, is_active)
    VALUES ($1, 'My Daily Alert', true);
  `, [candidateId]);

  // 9. Add Notification
  await client.query(`
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES ($1, 'Welcome', 'Welcome to SAP Jobs Finder', 'general');
  `, [userId]);

  console.log("Candidate data populated successfully.");

  // Check counts before deletion
  const countsBefore = {
    settings: (await client.query(`SELECT count(*) FROM public.candidate_settings WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    resumes: (await client.query(`SELECT count(*) FROM public.candidate_resumes WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    experience: (await client.query(`SELECT count(*) FROM public.candidate_experience WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    education: (await client.query(`SELECT count(*) FROM public.candidate_education WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    certifications: (await client.query(`SELECT count(*) FROM public.candidate_certifications WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    highlights: (await client.query(`SELECT count(*) FROM public.candidate_career_highlights WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    subscriptions: (await client.query(`SELECT count(*) FROM public.candidate_subscriptions WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    saved_jobs: (await client.query(`SELECT count(*) FROM public.saved_jobs WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    job_alerts: (await client.query(`SELECT count(*) FROM public.job_alerts WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    applications: (await client.query(`SELECT count(*) FROM public.job_applications WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    notifications: (await client.query(`SELECT count(*) FROM public.notifications WHERE user_id = $1`, [userId])).rows[0].count,
  };
  console.log("Counts before deletion:", countsBefore);

  console.log("\nExecuting safe transactional deletion flow:");
  console.log("Step 1: Delete candidate_profiles (cascades all candidate tables & applications & convos)...");
  await client.query(`DELETE FROM public.candidate_profiles WHERE id = $1`, [candidateId]);

  console.log("Step 2: Delete auth.users (cascades profiles & notifications)...");
  await client.query(`DELETE FROM auth.users WHERE id = $1`, [userId]);

  // Check counts after deletion
  const countsAfter = {
    auth_user: (await client.query(`SELECT count(*) FROM auth.users WHERE id = $1`, [userId])).rows[0].count,
    profile: (await client.query(`SELECT count(*) FROM public.profiles WHERE user_id = $1`, [userId])).rows[0].count,
    candidate_profile: (await client.query(`SELECT count(*) FROM public.candidate_profiles WHERE id = $1`, [candidateId])).rows[0].count,
    settings: (await client.query(`SELECT count(*) FROM public.candidate_settings WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    resumes: (await client.query(`SELECT count(*) FROM public.candidate_resumes WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    experience: (await client.query(`SELECT count(*) FROM public.candidate_experience WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    education: (await client.query(`SELECT count(*) FROM public.candidate_education WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    certifications: (await client.query(`SELECT count(*) FROM public.candidate_certifications WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    highlights: (await client.query(`SELECT count(*) FROM public.candidate_career_highlights WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    subscriptions: (await client.query(`SELECT count(*) FROM public.candidate_subscriptions WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    saved_jobs: (await client.query(`SELECT count(*) FROM public.saved_jobs WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    job_alerts: (await client.query(`SELECT count(*) FROM public.job_alerts WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    applications: (await client.query(`SELECT count(*) FROM public.job_applications WHERE candidate_id = $1`, [candidateId])).rows[0].count,
    notifications: (await client.query(`SELECT count(*) FROM public.notifications WHERE user_id = $1`, [userId])).rows[0].count,
  };
  console.log("Counts after deletion:", countsAfter);

  // Check that jobs and plans still exist
  const jobsCount = (await client.query(`SELECT count(*) FROM public.jobs`)).rows[0].count;
  const plansCount = (await client.query(`SELECT count(*) FROM public.candidate_plans`)).rows[0].count;
  console.log(`Remaining jobs: ${jobsCount}, remaining candidate_plans: ${plansCount}`);

  await client.end();
}

testFullCandidateDeletion().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
