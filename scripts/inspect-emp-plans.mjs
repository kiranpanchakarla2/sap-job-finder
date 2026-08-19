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

  const empPlans = await client.query(`SELECT * FROM public.subscription_plans;`);
  console.log("=== subscription_plans (Employer) ===");
  console.table(empPlans.rows);

  const empSubs = await client.query(`SELECT * FROM public.subscriptions LIMIT 5;`);
  console.log("=== subscriptions (Employer) sample ===");
  console.table(empSubs.rows);

  await client.end();
}

run().catch(console.error);
