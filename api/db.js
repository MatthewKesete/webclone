const path = require('path');
const fs = require('fs');

const defaultDbPath = path.resolve(__dirname, '../db/data.sqlite');
const dbPath = process.env.DB_PATH || defaultDbPath;

console.log(`[Database] Initializing connection targeting: ${dbPath}`);

let db = null;
let mode = 'none';

// If DATABASE_URL is explicitly set in env, use Postgres (Supabase)
if (process.env.DATABASE_URL || process.env.PGHOST || process.env.SUPABASE_URL) {
  try {
    const { Pool } = require('pg');
    const poolConfig = {};
    if (process.env.DATABASE_URL) {
      poolConfig.connectionString = process.env.DATABASE_URL;
      poolConfig.ssl = { rejectUnauthorized: false };
    } else {
      poolConfig.host = process.env.PGHOST;
      poolConfig.port = parseInt(process.env.PGPORT || '5432', 10);
      poolConfig.database = process.env.PGDATABASE || 'postgres';
      poolConfig.user = process.env.PGUSER || 'postgres';
      poolConfig.password = process.env.PGPASSWORD || process.env.SUPABASE_SECRET_KEY;
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    const pool = new Pool(poolConfig);
    db = pool;
    mode = 'pg';
    console.log('[Database] Connected using Postgres (pg) engine.');
  } catch (e) {
    console.error('[Database] Failed to initialize Postgres driver:', e.message);
  }
}

// If Postgres was not initialized or fails, fall back to SQLite
if (!db) {
  try {
    const Database = require('better-sqlite3');
    db = new Database(dbPath);
    try { db.pragma('journal_mode = WAL'); } catch (e) {}
    mode = 'better-sqlite3';
    console.log('[Database] Connected using better-sqlite3 engine.');
  } catch (err) {
    console.warn('[Database] better-sqlite3 failed to initialize, falling back to sqlite3:', err.message);
    try {
      const sqlite3 = require('sqlite3').verbose();
      db = new sqlite3.Database(dbPath);
      mode = 'sqlite3';
      console.log('[Database] Connected using sqlite3 engine.');
    } catch (err2) {
      console.error('[Database] Failed to initialize SQLite drivers:', err2.message);
    }
  }
}

// Convert SQLite-style ? placeholders to Postgres $1, $2, ... placeholders
function formatPgSql(sql, params = []) {
  let idx = 1;
  let formattedSql = sql.replace(/\?/g, () => `$${idx++}`);
  if (formattedSql.trim().toUpperCase().startsWith('INSERT INTO') && !formattedSql.toUpperCase().includes('RETURNING')) {
    formattedSql += ' RETURNING *';
  }
  return formattedSql;
}

async function all(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    return db.prepare(sql).all(...params);
  } else if (mode === 'sqlite3') {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  } else if (mode === 'pg') {
    try {
      const pgSql = formatPgSql(sql, params);
      const res = await db.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.error('[Database PG Error]:', err.message);
      throw err;
    }
  }
  throw new Error('Unsupported DB mode');
}

async function get(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    return db.prepare(sql).get(...params);
  } else if (mode === 'sqlite3') {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
  } else if (mode === 'pg') {
    try {
      const pgSql = formatPgSql(sql, params);
      const res = await db.query(pgSql, params);
      return res.rows[0] || null;
    } catch (err) {
      console.error('[Database PG Error]:', err.message);
      throw err;
    }
  }
  throw new Error('Unsupported DB mode');
}

async function run(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    const result = db.prepare(sql).run(...params);
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  } else if (mode === 'sqlite3') {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes, lastInsertRowid: this.lastID });
      });
    });
  } else if (mode === 'pg') {
    try {
      const pgSql = formatPgSql(sql, params);
      const res = await db.query(pgSql, params);
      const insertedId = res.rows?.[0]?.ID || res.rows?.[0]?.id || null;
      return { changes: res.rowCount, lastInsertRowid: insertedId };
    } catch (err) {
      console.error('[Database PG Error]:', err.message);
      throw err;
    }
  }
  throw new Error('Unsupported DB mode');
}

module.exports = {
  db,
  mode,
  all,
  get,
  run,
  query: all
};

