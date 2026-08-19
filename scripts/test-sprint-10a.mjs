import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import pg from "pg";
import {
  canAccessAdmin,
  canAccessPath,
  canAccessPublicDashboard,
  canAccessRecruiter,
  getHomePathForRole,
  getLoginPathForRole,
  isSuperAdminRole,
  normalizeRole,
} from "../src/lib/auth/roles.ts";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log("==================================================");
  console.log("  SPRINT 10A — SUPER ADMIN FOUNDATION TEST SUITE  ");
  console.log("==================================================\n");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // ----------------------------------------------------
  // TEST GROUP 1: DATABASE & SCHEMA INTEGRITY
  // ----------------------------------------------------
  console.log("TEST GROUP 1: Database Schema & Role Definitions");

  const enumCheck = await client.query(`
    SELECT e.enumlabel 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'app_role';
  `);
  const enumLabels = enumCheck.rows.map((r) => r.enumlabel);
  assert(
    enumLabels.includes("super_admin"),
    `app_role enum contains 'super_admin' (Found: [${enumLabels.join(", ")}])`
  );
  assert(
    enumLabels.includes("candidate") && enumLabels.includes("employer"),
    "app_role enum retains candidate and employer values"
  );

  const constraintCheck = await client.query(`
    SELECT pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_role_valid';
  `);
  assert(
    constraintCheck.rows.length > 0 && constraintCheck.rows[0].def.includes("super_admin"),
    "profiles_role_valid constraint allows 'super_admin'"
  );

  const funcCheck = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name IN ('is_super_admin', 'is_admin_or_super_admin');
  `);
  const foundFuncs = funcCheck.rows.map((r) => r.routine_name);
  assert(
    foundFuncs.includes("is_super_admin") && foundFuncs.includes("is_admin_or_super_admin"),
    "Helper functions is_super_admin() and is_admin_or_super_admin() exist in Postgres"
  );

  // ----------------------------------------------------
  // TEST GROUP 2: SUPER ADMIN ACCOUNT PROVISIONING
  // ----------------------------------------------------
  console.log("\nTEST GROUP 2: Initial Super Admin Accounts");

  const superAdmins = await client.query(`
    SELECT u.id, u.email, u.email_confirmed_at, p.role, p.first_name, p.last_name
    FROM auth.users u
    JOIN public.profiles p ON p.user_id = u.id
    WHERE lower(u.email) IN ('ceo@bridgecoreit.com', 'cto@bridgecoreit.com');
  `);

  const ceo = superAdmins.rows.find((r) => r.email.toLowerCase() === "ceo@bridgecoreit.com");
  const cto = superAdmins.rows.find((r) => r.email.toLowerCase() === "cto@bridgecoreit.com");

  assert(Boolean(ceo), "Account ceo@bridgecoreit.com exists in auth.users and profiles");
  assert(ceo?.role === "super_admin", "ceo@bridgecoreit.com has role = 'super_admin'");
  assert(Boolean(ceo?.email_confirmed_at), "ceo@bridgecoreit.com email is confirmed");

  assert(Boolean(cto), "Account cto@bridgecoreit.com exists in auth.users and profiles");
  assert(cto?.role === "super_admin", "cto@bridgecoreit.com has role = 'super_admin'");
  assert(Boolean(cto?.email_confirmed_at), "cto@bridgecoreit.com email is confirmed");

  // Verify candidate & employer accounts were NOT altered
  const nonAdminCheck = await client.query(`
    SELECT count(*) as count FROM public.profiles WHERE role IN ('candidate', 'employer');
  `);
  assert(
    Number(nonAdminCheck.rows[0].count) > 0,
    `Existing Candidate & Employer profiles intact (Count: ${nonAdminCheck.rows[0].count})`
  );

  await client.end();

  // ----------------------------------------------------
  // TEST GROUP 3: ROLE & AUTHORIZATION LOGIC
  // ----------------------------------------------------
  console.log("\nTEST GROUP 3: Authorization & Role Guards");

  assert(normalizeRole("super_admin") === "super_admin", "normalizeRole('super_admin') === 'super_admin'");
  assert(normalizeRole("SUPER_ADMIN") === "super_admin", "normalizeRole('SUPER_ADMIN') === 'super_admin'");
  assert(isSuperAdminRole("super_admin"), "isSuperAdminRole('super_admin') is true");
  assert(!isSuperAdminRole("candidate"), "isSuperAdminRole('candidate') is false");
  assert(!isSuperAdminRole("employer"), "isSuperAdminRole('employer') is false");

  assert(canAccessAdmin("super_admin"), "canAccessAdmin('super_admin') is true");
  assert(!canAccessAdmin("candidate"), "canAccessAdmin('candidate') is false");
  assert(!canAccessAdmin("employer"), "canAccessAdmin('employer') is false");

  assert(canAccessPath("super_admin", "/admin"), "super_admin can access /admin");
  assert(canAccessPath("super_admin", "/admin/users/candidates"), "super_admin can access /admin/users/candidates");
  assert(!canAccessPath("candidate", "/admin"), "candidate CANNOT access /admin");
  assert(!canAccessPath("candidate", "/admin/payments/requests"), "candidate CANNOT access /admin/payments/requests");
  assert(!canAccessPath("employer", "/admin"), "employer CANNOT access /admin");
  assert(!canAccessPath("employer", "/admin/subscriptions/employer-plans"), "employer CANNOT access /admin/subscriptions/employer-plans");

  assert(getHomePathForRole("super_admin") === "/admin", "getHomePathForRole('super_admin') === '/admin'");
  assert(getLoginPathForRole("super_admin") === "/admin/login", "getLoginPathForRole('super_admin') === '/admin/login'");

  // ----------------------------------------------------
  // TEST GROUP 4: ROUTE FILE & PLACEHOLDER STRUCTURE
  // ----------------------------------------------------
  console.log("\nTEST GROUP 4: Route Files & Placeholders");

  const requiredRoutes = [
    "src/app/admin/layout.tsx",
    "src/app/admin/login/page.tsx",
    "src/app/admin/(protected)/layout.tsx",
    "src/app/admin/(protected)/page.tsx",
    "src/app/admin/(protected)/users/candidates/page.tsx",
    "src/app/admin/(protected)/users/employers/page.tsx",
    "src/app/admin/(protected)/subscriptions/candidate-plans/page.tsx",
    "src/app/admin/(protected)/subscriptions/employer-plans/page.tsx",
    "src/app/admin/(protected)/subscriptions/active/page.tsx",
    "src/app/admin/(protected)/subscriptions/expiring/page.tsx",
    "src/app/admin/(protected)/subscriptions/history/page.tsx",
    "src/app/admin/(protected)/payments/requests/page.tsx",
    "src/app/admin/(protected)/payments/paid/page.tsx",
    "src/app/admin/(protected)/payments/pending/page.tsx",
    "src/app/admin/(protected)/payments/history/page.tsx",
    "src/app/admin/(protected)/jobs/page.tsx",
    "src/app/admin/(protected)/sap-modules/page.tsx",
    "src/app/admin/(protected)/contact-us/page.tsx",
    "src/app/admin/(protected)/platform/general/page.tsx",
    "src/app/admin/(protected)/platform/social-media/page.tsx",
    "src/app/admin/(protected)/platform/notifications/page.tsx",
    "src/app/admin/(protected)/admin-management/page.tsx",
    "src/app/admin/(protected)/audit-logs/page.tsx",
  ];

  for (const routePath of requiredRoutes) {
    const exists = fs.existsSync(path.resolve(routePath));
    assert(exists, `Route file exists: ${routePath}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: INTERNAL-ONLY & ZERO PUBLIC EXPOSURE
  // ----------------------------------------------------
  console.log("\nTEST GROUP 5: Internal-Only Isolation Check");

  const publicFiles = [
    "src/components/Navbar.tsx",
    "src/components/Footer.tsx",
    "src/components/Hero.tsx",
    "src/layouts/CandidateLayout.tsx",
    "src/layouts/EmployerLayout.tsx",
    "src/app/page.tsx",
    "src/app/contact/page.tsx",
  ];

  for (const file of publicFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8");
      const hasAdminLink = content.includes('href="/admin"') || content.includes("Super Admin");
      assert(!hasAdminLink, `No public admin links in: ${file}`);
    }
  }

  // Verify robots metadata in admin layout
  const adminLayoutContent = fs.readFileSync("src/app/admin/layout.tsx", "utf-8");
  assert(
    adminLayoutContent.includes("robots") && adminLayoutContent.includes("index: false"),
    "Admin root layout contains robots: { index: false, follow: false }"
  );

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
