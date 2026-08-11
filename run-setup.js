// run-setup.js
// Usage (PowerShell):
//  $env:DATABASE_URL = "postgresql://postgres:YOUR_ENCODED_PASSWORD@db.lumwkrkffqjjeiruurpd.supabase.co:5432/postgres"
//  node run-setup.js
// Or (cmd.exe):
//  set DATABASE_URL=postgresql://postgres:YOUR_ENCODED_PASSWORD@db.lumwkrkffqjjeiruurpd.supabase.co:5432/postgres
//  node run-setup.js

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.join(__dirname, 'supabase-setup.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('supabase-setup.sql not found in project root.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL environment variable not set.');
    console.error('Set it to your Supabase postgres connection string (percent-encode special characters in the password).');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Executing SQL from supabase-setup.sql...');

    // Run as a single query block. If the SQL file is large or contains multiple statements,
    // Postgres client will execute them together. If you run into issues, split on ";\n".
    await client.query(sql);

    console.log('SQL executed successfully.');
  } catch (err) {
    console.error('Error executing SQL:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
