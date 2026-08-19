import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const connectionString = process.env.DATABASE_URL;

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const policies = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('subscription_plans', 'subscriptions', 'candidate_plans', 'candidate_subscriptions')
    ORDER BY tablename, policyname;
  `);
  console.log("=== RLS POLICIES ===");
  console.table(policies.rows);

  await client.end();
}

run().catch(console.error);
