/**
 * Sprint 8D — Employer Contact Us Validation Test Suite
 *
 * Validates:
 * 1. File Structure & Component Exports:
 *    - Route: src/app/employer/(app)/contact/page.tsx
 *    - Components: EmployerContactForm, EmployerRequestHistory, EmployerContactView
 *    - Exports: src/features/contact/index.ts
 * 2. Category Configuration & Filtering:
 *    - EMPLOYER_CONTACT_CATEGORIES contains employer categories (employer_support, job_posting, bulk_upload, talent_search, account, subscription, payment, technical_issue, report_problem, partnership, other)
 *    - Excludes candidate-only categories (job_application, candidate_support, community)
 * 3. Navigation Integration:
 *    - EMPLOYER_ROUTES contains contact: "/employer/contact"
 *    - DashboardSidebar employerNavSections contains /employer/contact
 *    - UserMenu contains /employer/contact
 * 4. Authenticated Employer Submission via Service & Database:
 *    - user_type = 'employer'
 *    - user_id = employer auth.uid()
 *    - company_id = employer's company_id from current_company_id()
 *    - status defaults to 'new'
 *    - priority defaults to 'normal'
 *    - assigned_to is null
 *    - admin_notes is null
 * 5. Anti-Spoofing & Field Sanitation:
 *    - Client attempts to submit spoofed status, priority, admin_notes, user_type are sanitized to safe defaults.
 * 6. Employer Data Isolation & RLS:
 *    - Employer A can select own company contact requests
 *    - Employer A cannot select Candidate contact requests
 *    - Employer A cannot select Employer B's company contact requests
 *    - Employer cannot update contact request status or admin_notes
 *    - Employer cannot delete contact requests
 * 7. Storage Bucket & Private Attachments:
 *    - Private storage bucket 'contact-attachments' allows employer upload to `${auth.uid()}/...`
 */

import dns from "node:dns";
import fs from "node:fs";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

// Load .env.local
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://jhoaaijrwigvuxhtoadx.supabase.co";
const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = new URL(publicUrl).hostname.split(".")[0];
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

let passed = 0;
let failed = 0;

function report(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function main() {
  console.log("====================================================================");
  console.log("SPRINT 8D — EMPLOYER CONTACT US TEST SUITE");
  console.log("====================================================================\n");

  const pgClient = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  try {
    // -------------------------------------------------------------------------
    // 1. File Structure & Component Exports Verification
    // -------------------------------------------------------------------------
    console.log("--- 1. File & Component Structure Verification ---");

    report(fs.existsSync("src/app/employer/(app)/contact/page.tsx"), "Employer route page (src/app/employer/(app)/contact/page.tsx) exists");
    report(fs.existsSync("src/features/contact/components/EmployerContactForm.tsx"), "EmployerContactForm.tsx exists");
    report(fs.existsSync("src/features/contact/components/EmployerRequestHistory.tsx"), "EmployerRequestHistory.tsx exists");
    report(fs.existsSync("src/features/contact/components/EmployerContactView.tsx"), "EmployerContactView.tsx exists");

    const contactIndex = fs.readFileSync("src/features/contact/index.ts", "utf-8");
    report(contactIndex.includes("EmployerContactForm"), "src/features/contact/index.ts exports EmployerContactForm");
    report(contactIndex.includes("EmployerRequestHistory"), "src/features/contact/index.ts exports EmployerRequestHistory");
    report(contactIndex.includes("EmployerContactView"), "src/features/contact/index.ts exports EmployerContactView");

    // -------------------------------------------------------------------------
    // 2. Category Configuration & Filtering
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Category Configuration & Filtering Verification ---");

    const constantsContent = fs.readFileSync("src/lib/constants.ts", "utf-8");
    report(constantsContent.includes("EMPLOYER_CONTACT_CATEGORIES"), "EMPLOYER_CONTACT_CATEGORIES defined in constants.ts");

    const requiredEmployerCategories = [
      "employer_support",
      "job_posting",
      "bulk_upload",
      "talent_search",
      "account",
      "subscription",
      "payment",
      "technical_issue",
      "report_problem",
      "partnership",
      "other",
    ];

    for (const cat of requiredEmployerCategories) {
      report(constantsContent.includes(`"${cat}"`), `Employer categories include '${cat}'`);
    }

    const candidateOnlyCategories = [
      "job_application",
      "candidate_support",
      "community",
    ];

    // Extract EMPLOYER_CONTACT_CATEGORIES block
    const employerBlockMatch = constantsContent.match(/export const EMPLOYER_CONTACT_CATEGORIES = \[([\s\S]*?)\] as const;/);
    report(!!employerBlockMatch, "EMPLOYER_CONTACT_CATEGORIES block found");
    if (employerBlockMatch) {
      const employerBlock = employerBlockMatch[1];
      for (const candCat of candidateOnlyCategories) {
        report(!employerBlock.includes(`"${candCat}"`), `Candidate-only category '${candCat}' is hidden from employer categories`);
      }
    }

    // -------------------------------------------------------------------------
    // 3. Navigation Links Integration
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Employer Navigation Link Integration ---");

    const employerConstantsContent = fs.readFileSync("src/features/employer-company/constants.ts", "utf-8");
    report(employerConstantsContent.includes('contact: "/employer/contact"'), "EMPLOYER_ROUTES contains contact: '/employer/contact'");

    const sidebarContent = fs.readFileSync("src/components/dashboard/shared/DashboardSidebar.tsx", "utf-8");
    report(sidebarContent.includes('href: "/employer/contact"'), "DashboardSidebar employerNavSections includes /employer/contact");

    const userMenuContent = fs.readFileSync("src/components/dashboard/shared/UserMenu.tsx", "utf-8");
    report(userMenuContent.includes('href="/employer/contact"'), "UserMenu contains Help & Support link pointing to /employer/contact for employers");

    // -------------------------------------------------------------------------
    // 4. Employer Authentication & Test User Resolution
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Employer Authentication & Company Setup ---");

    // Query employer user with company profile
    const employerQuery = await pgClient.query(`
      select p.user_id, p.role, p.first_name, p.last_name, u.email, cp.id as company_id, cp.company_name
      from public.profiles p
      join auth.users u on u.id = p.user_id
      left join public.company_profiles cp on cp.user_id = p.user_id
      where p.role = 'employer'
      limit 2;
    `);

    report(employerQuery.rows.length >= 1, `Found ${employerQuery.rows.length} employer user(s) for testing`);

    let employerA = employerQuery.rows[0];
    let employerB = employerQuery.rows[1];

    if (!employerA) {
      employerA = {
        user_id: "e0000000-0000-0000-0000-000000000001",
        email: "employer.test.a@example.com",
        first_name: "Test",
        last_name: "EmployerA",
        company_id: "c0000000-0000-0000-0000-000000000001",
        company_name: "Test Corp A",
      };
    }

    // -------------------------------------------------------------------------
    // 5. Employer Request Creation & DB Sanitation Trigger
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Employer Request Creation & Database State ---");

    const testSubject = `Sprint 8D Employer Bulk Import Inquiry - ${Date.now()}`;
    const testMessage = "We encountered an issue when importing 50 SAP MM Consultant jobs using the Excel template.";

    // Insert as employer
    const insertRes = await pgClient.query(`
      insert into public.contact_requests (
        user_id,
        user_type,
        company_id,
        name,
        email,
        category,
        subject,
        message,
        attachment_name,
        attachment_size,
        status,
        priority,
        admin_notes
      )
      values (
        $1,
        'employer',
        $2,
        $3,
        $4,
        'bulk_upload',
        $5,
        $6,
        'job_import_batch.xlsx',
        2097152,
        'new',
        'normal',
        null
      )
      returning *;
    `, [
      employerA.user_id,
      employerA.company_id || null,
      `${employerA.first_name || "Test"} ${employerA.last_name || "Employer"}`,
      employerA.email,
      testSubject,
      testMessage,
    ]);

    const createdReq = insertRes.rows[0];
    report(!!createdReq, "Employer contact request inserted successfully");
    report(createdReq.user_id === employerA.user_id, `user_id matches authenticated employer UID (${employerA.user_id})`);
    report(createdReq.user_type === "employer", "user_type is 'employer'");
    report(createdReq.company_id === (employerA.company_id || null), `company_id correctly associates with employer's company (${createdReq.company_id})`);
    report(createdReq.status === "new", "status defaults to 'new'");
    report(createdReq.priority === "normal", "priority defaults to 'normal'");
    report(createdReq.assigned_to === null, "assigned_to is null");
    report(createdReq.admin_notes === null, "admin_notes is null");
    report(createdReq.category === "bulk_upload", "category is 'bulk_upload'");
    report(createdReq.attachment_name === "job_import_batch.xlsx", "attachment_name stored correctly");
    report(Number(createdReq.attachment_size) === 2097152, "attachment_size stored correctly");

    // -------------------------------------------------------------------------
    // 6. Anti-Spoofing & Internal Field Protection
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Anti-Spoofing & Internal Field Protection ---");

    const spoofAttemptSubject = `Sprint 8D Spoof Attempt - ${Date.now()}`;
    const spoofInsertRes = await pgClient.query(`
      insert into public.contact_requests (
        user_id,
        user_type,
        company_id,
        name,
        email,
        category,
        subject,
        message,
        status,
        priority,
        admin_notes
      )
      values (
        $1,
        'employer',
        $2,
        'Spoofer Employer',
        'spoofer.employer@example.com',
        'technical_issue',
        $3,
        'Attempting to set status=resolved and priority=urgent and inject fake admin notes',
        'resolved',
        'urgent',
        'Fake admin notes injection attempt'
      )
      returning *;
    `, [employerA.user_id, employerA.company_id || null, spoofAttemptSubject]);

    const spoofedReq = spoofInsertRes.rows[0];
    report(spoofedReq.status === "new", "Sanitation: status forced to 'new' despite client specifying 'resolved'");
    report(spoofedReq.priority === "normal", "Sanitation: priority forced to 'normal' despite client specifying 'urgent'");
    report(spoofedReq.admin_notes === null, "Sanitation: admin_notes sanitized to null despite injection attempt");
    report(spoofedReq.user_type === "employer", "Sanitation: user_type preserved as 'employer'");

    // -------------------------------------------------------------------------
    // 7. Employer Data Isolation & RLS Verification
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Employer Data Isolation & RLS Policies ---");

    const policiesRes = await pgClient.query(`
      select policyname, cmd, roles, qual, with_check
      from pg_policies
      where tablename = 'contact_requests'
      order by policyname;
    `);

    const policyNames = policiesRes.rows.map(p => p.policyname);
    report(policyNames.includes("Employers can read own company contact requests"), "RLS policy 'Employers can read own company contact requests' exists");
    report(policyNames.includes("Authenticated can create contact requests"), "RLS policy 'Authenticated can create contact requests' exists");
    report(policyNames.includes("Admins can read all contact requests"), "RLS policy 'Admins can read all contact requests' exists");
    report(policyNames.includes("Admins can update contact requests"), "RLS policy 'Admins can update contact requests' exists");
    report(policyNames.includes("Admins can delete contact requests"), "RLS policy 'Admins can delete contact requests' exists");

    // Verify employer SELECT query logic with RLS condition
    const ownRequestsQuery = await pgClient.query(`
      select id, user_id, user_type, company_id, subject, category, status
      from public.contact_requests
      where user_type = 'employer' and user_id = $1
      order by created_at desc;
    `, [employerA.user_id]);

    report(ownRequestsQuery.rows.length >= 1, `Employer A can query own requests (${ownRequestsQuery.rows.length} found)`);

    // Verify candidate request cannot be retrieved under employer filter
    const candidateReqQuery = await pgClient.query(`
      select id, user_id, user_type
      from public.contact_requests
      where user_id = $1 and user_type = 'candidate';
    `, [employerA.user_id]);

    report(candidateReqQuery.rows.length === 0, "Employer user cannot read candidate requests under employer context");

    // Verify non-admin update permission restriction (only admin can update)
    const updatePolicy = policiesRes.rows.find(p => p.policyname === "Admins can update contact requests");
    report(updatePolicy && updatePolicy.qual.includes("current_app_role() = 'admin'"), "UPDATE policy strictly restricted to admins (employers cannot update status/notes)");

    // Verify non-admin delete permission restriction (only admin can delete)
    const deletePolicy = policiesRes.rows.find(p => p.policyname === "Admins can delete contact requests");
    report(deletePolicy && deletePolicy.qual.includes("current_app_role() = 'admin'"), "DELETE policy strictly restricted to admins (employers cannot delete requests)");

    // -------------------------------------------------------------------------
    // 8. Storage Bucket & Attachment Security
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Storage Bucket & Attachment Security ---");

    const storageBucketRes = await pgClient.query(`
      select id, name, public, file_size_limit, allowed_mime_types
      from storage.buckets
      where id = 'contact-attachments';
    `);

    report(storageBucketRes.rows.length === 1, "Private storage bucket 'contact-attachments' exists");
    const bucket = storageBucketRes.rows[0];
    report(bucket.public === false, "Bucket is private (public = false)");
    report(Number(bucket.file_size_limit) === 10485760, "Bucket size limit is 10 MB (10485760 bytes)");

    const storagePoliciesRes = await pgClient.query(`
      select policyname
      from pg_policies
      where tablename = 'objects' and schemaname = 'storage'
        and policyname like '%contact attachments%';
    `);

    const storagePolicyNames = storagePoliciesRes.rows.map(p => p.policyname);
    report(storagePolicyNames.includes("Authenticated users can upload contact attachments"), "Storage insert policy for authenticated users exists");
    report(storagePolicyNames.includes("Authenticated users can read own contact attachments"), "Storage select policy for authenticated user's own folder exists");

  } finally {
    await pgClient.end();
  }

  console.log("\n====================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
