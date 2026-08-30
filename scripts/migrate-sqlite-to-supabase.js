/*
Migrate SQLite tables/rows to Postgres (Supabase).
Usage (from project root):
  PGHOST=... PGPORT=5432 PGDATABASE=postgres PGUSER=postgres PGPASSWORD=your_service_key node scripts/migrate-sqlite-to-supabase.js

This script creates simple text-based columns in Postgres and inserts rows.
*/

const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

async function main() {
  const sqlitePath = path.resolve(__dirname, '..', 'db', 'data.sqlite');
  console.log('Opening sqlite:', sqlitePath);
  const db = new Database(sqlitePath, { readonly: true });

  const pgClient = new Client({
    host: process.env.PGHOST || process.env.SUPABASE_HOST,
    port: parseInt(process.env.PGPORT || process.env.SUPABASE_PORT || '5432', 10),
    database: process.env.PGDATABASE || process.env.SUPABASE_DB,
    user: process.env.PGUSER || process.env.SUPABASE_USER,
    password: process.env.PGPASSWORD || process.env.SUPABASE_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await pgClient.connect();
  console.log('Connected to Postgres');

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all();
  for (const t of tables) {
    const table = t.name;
    console.log('\nProcessing table:', table);
    const cols = db.prepare(`PRAGMA table_info(\'${table}\')`).all();
    if (!cols || cols.length === 0) {
      console.log('  no columns, skipping');
      continue;
    }
    const colNames = cols.map(c => c.name);
    // create table with all text columns
    const createCols = colNames.map(c => `"${c}" text`).join(', ');
    const createSql = `CREATE TABLE IF NOT EXISTS "${table}" (${createCols});`;
    await pgClient.query(createSql);
    console.log('  created table (if not exists)');

    // fetch rows from sqlite
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    if (!rows || rows.length === 0) {
      console.log('  no rows to insert');
      continue;
    }

    // insert rows in a transaction
    const colList = colNames.map(c => `"${c}"`).join(', ');
    const paramPlaceholders = colNames.map((_, i) => `$${i + 1}`).join(', ');
    const insertSql = `INSERT INTO "${table}" (${colList}) VALUES (${paramPlaceholders})`;

    try {
      await pgClient.query('BEGIN');
      for (const r of rows) {
        const vals = colNames.map(c => {
          const v = r[c];
          if (v === null || v === undefined) return null;
          // Convert Buffer (BLOB) to base64 string
          if (Buffer.isBuffer(v)) return v.toString('base64');
          return v.toString();
        });
        await pgClient.query(insertSql, vals);
      }
      await pgClient.query('COMMIT');
      console.log(`  inserted ${rows.length} rows`);
    } catch (err) {
      await pgClient.query('ROLLBACK');
      console.error('  insert failed:', err.message);
    }
  }

  await pgClient.end();
  db.close();
  console.log('\nMigration complete');
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
