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

  const tables = ['subscription_plans', 'subscriptions', 'candidate_plans', 'candidate_subscriptions'];

  for (const table of tables) {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    console.log(`\n=== TABLE: ${table} ===`);
    console.table(cols.rows);

    const rows = await client.query(`SELECT * FROM public.${table};`);
    console.log(`--- Data (${rows.rowCount} rows) ---`);
    console.table(rows.rows);
  }

  // Check if any payment_requests table exists
  const payTables = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%payment%';
  `);
  console.log("\n=== PAYMENT TABLES ===");
  console.table(payTables.rows);

  await client.end();
}

run().catch(console.error);
