import fs from "node:fs";
import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

const SUPER_ADMINS = [
  {
    email: "ceo@bridgecoreit.com",
    firstName: "CEO",
    lastName: "Bridgecore",
    tempPass: "SuperAdmin@2026!CEO",
  },
  {
    email: "cto@bridgecoreit.com",
    firstName: "CTO",
    lastName: "Bridgecore",
    tempPass: "SuperAdmin@2026!CTO",
  },
];

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase Postgres.");

  // 1. Grant permissions
  await client.query("GRANT USAGE ON TYPE public.app_role TO anon, authenticated, service_role, postgres, supabase_admin, supabase_auth_admin;");

  // 2. Ensure super admin accounts exist in auth.users & public.profiles
  await client.query("ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_role_change;");

  try {
    for (const admin of SUPER_ADMINS) {
      console.log(`\nChecking super admin account: ${admin.email}...`);

      const metadata = JSON.stringify({
        role: "super_admin",
        first_name: admin.firstName,
        last_name: admin.lastName,
        full_name: `${admin.firstName} ${admin.lastName}`.trim(),
      });

      const userCheck = await client.query(
        `SELECT id, email FROM auth.users WHERE lower(email) = lower($1)`,
        [admin.email]
      );

      let userId;
      if (userCheck.rows.length === 0) {
        console.log(`Creating auth user for ${admin.email}...`);
        const insertUser = await client.query(
          `INSERT INTO auth.users (
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
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_current,
            email_change_token_new,
            recovery_token,
            phone_change,
            phone_change_token,
            reauthentication_token,
            is_sso_user,
            is_anonymous
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            lower($1),
            crypt($2, gen_salt('bf', 10)),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            $3::jsonb,
            now(),
            now(),
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            false,
            false
          )
          RETURNING id;`,
          [admin.email, admin.tempPass, metadata]
        );
        userId = insertUser.rows[0].id;
        console.log(`Created auth.users record: ${userId}`);
      } else {
        userId = userCheck.rows[0].id;
        console.log(`Updating existing auth.users record: ${userId}`);
        await client.query(
          `UPDATE auth.users 
           SET encrypted_password = crypt($2, gen_salt('bf', 10)),
               email_confirmed_at = coalesce(email_confirmed_at, now()),
               email_change = coalesce(email_change, ''),
               email_change_token_current = coalesce(email_change_token_current, ''),
               email_change_token_new = coalesce(email_change_token_new, ''),
               confirmation_token = coalesce(confirmation_token, ''),
               recovery_token = coalesce(recovery_token, ''),
               phone_change = coalesce(phone_change, ''),
               phone_change_token = coalesce(phone_change_token, ''),
               reauthentication_token = coalesce(reauthentication_token, ''),
               raw_user_meta_data = $3::jsonb,
               updated_at = now()
           WHERE id = $1`,
          [userId, admin.tempPass, metadata]
        );
      }

      // Ensure identity in auth.identities
      const identityCheck = await client.query(
        `SELECT id FROM auth.identities WHERE user_id = $1`,
        [userId]
      );
      if (identityCheck.rows.length === 0) {
        console.log(`Creating auth.identities record for ${admin.email}...`);
        await client.query(
          `INSERT INTO auth.identities (
            id,
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            $1::text,
            $1::uuid,
            json_build_object('sub', $1::text, 'email', lower($2), 'email_verified', true)::jsonb,
            'email',
            now(),
            now(),
            now()
          );`,
          [userId, admin.email]
        );
      }

      // Upsert into public.profiles
      const profileCheck = await client.query(
        `SELECT id, role FROM public.profiles WHERE user_id = $1`,
        [userId]
      );

      if (profileCheck.rows.length === 0) {
        console.log(`Creating profile record for ${admin.email}...`);
        await client.query(
          `INSERT INTO public.profiles (
            user_id, role, first_name, last_name, email, created_at, updated_at
          ) VALUES (
            $1, 'super_admin'::public.app_role, $2, $3, lower($4), now(), now()
          );`,
          [userId, admin.firstName, admin.lastName, admin.email]
        );
      } else {
        console.log(`Updating profile record for ${admin.email} to super_admin...`);
        await client.query(
          `UPDATE public.profiles
           SET role = 'super_admin'::public.app_role,
               first_name = coalesce($2, first_name),
               last_name = coalesce($3, last_name),
               email = lower($4),
               updated_at = now()
           WHERE user_id = $1;`,
          [userId, admin.firstName, admin.lastName, admin.email]
        );
      }
    }
  } finally {
    await client.query("ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_role_change;");
  }

  // 3. Verify final state
  console.log("\n=== VERIFYING SUPER ADMINS ===");
  const verifyRes = await client.query(`
    SELECT u.id, u.email, u.email_confirmed_at, p.role, p.first_name, p.last_name
    FROM auth.users u
    JOIN public.profiles p ON p.user_id = u.id
    WHERE p.role::text = 'super_admin';
  `);
  console.table(verifyRes.rows);

  await client.end();
  console.log("\nSuper Admin bootstrap completed successfully!");
}

run().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
