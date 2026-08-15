import dns from "node:dns";
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dns.setDefaultResultOrder("ipv4first");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function projectRefFromPublicUrl() {
  const publicUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "https://jhoaaijrwigvuxhtoadx.supabase.co";
  return new URL(publicUrl).hostname.split(".")[0];
}

const password = process.env.SUPABASE_DB_PASSWORD?.trim() || "lrVrTg9ddwxuCWTR";
const ref = projectRefFromPublicUrl();
const encoded = encodeURIComponent(password);
const connectionString = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`;

const client = new pg.Client({ connectionString });

async function run() {
  await client.connect();
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260816150000_employer_delete_account_rpc.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying migration 20260816150000_employer_delete_account_rpc.sql...');
  await client.query(sql);
  console.log('Successfully applied delete_employer_account migration.');
  await client.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
