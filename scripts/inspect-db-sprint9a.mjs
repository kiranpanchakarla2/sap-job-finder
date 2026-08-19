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

  console.log("=== SUBSCRIPTION RELATED TABLES ===");
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name LIKE '%sub%' OR table_name LIKE '%plan%' OR table_name LIKE '%pay%')
    ORDER BY table_name;
  `);
  console.table(tables.rows);

  for (const row of tables.rows) {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [row.table_name]);
    console.log(`\n--- ${row.table_name} Columns ---`);
    console.table(cols.rows);

    const constraints = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE n.nspname = 'public' AND cl.relname = $1;
    `, [row.table_name]);
    console.log(`--- ${row.table_name} Constraints ---`);
    console.table(constraints.rows);

    const rows = await client.query(`SELECT * FROM public.${row.table_name} LIMIT 10;`);
    console.log(`--- ${row.table_name} Data Sample (${rows.rowCount} rows) ---`);
    console.table(rows.rows);
  }

  console.log("\n=== COMPANY / EMPLOYER TABLES ===");
  const empTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name LIKE '%company%' OR table_name LIKE '%employer%')
    ORDER BY table_name;
  `);
  console.table(empTables.rows);

  await client.end();
}

run().catch(console.error);
