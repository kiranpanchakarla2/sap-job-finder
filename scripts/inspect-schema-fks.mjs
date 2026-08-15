import dns from "node:dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = "jhoaaijrwigvuxhtoadx";
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

async function inspect() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("=== ALL FOREIGN KEYS ===");
  const fks = await client.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS mechanical_kcu
      ON tc.constraint_name = mechanical_kcu.constraint_name
      AND tc.table_schema = mechanical_kcu.table_schema
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    GROUP BY tc.table_name, kcu.column_name, ccu.table_name, ccu.column_name, rc.delete_rule
    ORDER BY ccu.table_name, tc.table_name;
  `);
  for (const row of fks.rows) {
    console.log(`${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name} [ON DELETE ${row.delete_rule}]`);
  }

  console.log("\n=== AUTH.USERS FKs ===");
  const authFks = await client.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS mechanical_kcu
      ON tc.constraint_name = mechanical_kcu.constraint_name
      AND tc.table_schema = mechanical_kcu.table_schema
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_schema = 'auth'
    GROUP BY tc.table_name, kcu.column_name, ccu.table_schema, ccu.table_name, ccu.column_name, rc.delete_rule
    ORDER BY tc.table_name;
  `);
  for (const row of authFks.rows) {
    console.log(`${row.table_name}.${row.column_name} -> ${row.foreign_table_schema}.${row.foreign_table_name}.${row.foreign_column_name} [ON DELETE ${row.delete_rule}]`);
  }

  await client.end();
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
