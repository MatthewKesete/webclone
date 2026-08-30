const path = require('path');
const fs = require('fs');

const defaultDbPath = path.resolve(__dirname, '../db/data.sqlite');
const dbPath = process.env.DB_PATH || defaultDbPath;

console.log(`[Database] Initializing connection targeting: ${dbPath}`);

let db = null;
let mode = 'none';

// If DATABASE_URL isn't provided via Netlify site settings, embed a fallback
// connection for deployments where setting site envs is difficult. Replace
// or remove this for production security if you prefer using Netlify UI.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres.pgpvfxagkeexvnmzrsty:MattyMeda890@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';
  console.log('[Database] Embedded fallback DATABASE_URL configured.');
}

// If Postgres env is present, prefer Postgres (for Supabase)
if (process.env.DATABASE_URL || process.env.PGHOST || process.env.SUPABASE_URL) {
  try {
    const { Pool } = require('pg');
    const poolConfig = {};
    if (process.env.DATABASE_URL) {
      poolConfig.connectionString = process.env.DATABASE_URL;
      poolConfig.ssl = { rejectUnauthorized: false };
    } else {
      poolConfig.host = process.env.PGHOST || (process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname.replace(/^/, 'db.') : undefined);
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

// If Postgres wasn't used, attempt SQLite initialization
if (!db) {
  try {
    const Database = require('better-sqlite3');
    db = new Database(dbPath);
    // Enable WAL mode for concurrent performance if supported
    try { db.pragma('journal_mode = WAL'); } catch (e) {}
    mode = 'better-sqlite3';
    console.log('[Database] Connected using better-sqlite3 engine.');
  } catch (err) {
    console.warn('[Database] better-sqlite3 failed to initialize, falling back to sqlite3:', err.message);
    try {
      const sqlite3 = require('sqlite3').verbose();
      const rawDb = new sqlite3.Database(dbPath);
      mode = 'sqlite3';
      db = rawDb;
      console.log('[Database] Connected using sqlite3 engine.');
    } catch (err2) {
      console.error('[Database] Failed to initialize SQLite drivers:', err2.message);
    }
  }
}

// If Postgres env is present, prefer Postgres (for Supabase)
if (!db && (process.env.DATABASE_URL || process.env.PGHOST || process.env.SUPABASE_URL)) {
  try {
    const { Pool } = require('pg');
    const poolConfig = {};
    if (process.env.DATABASE_URL) {
      poolConfig.connectionString = process.env.DATABASE_URL;
      poolConfig.ssl = { rejectUnauthorized: false };
    } else {
      poolConfig.host = process.env.PGHOST || (process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname.replace(/^/, 'db.') : undefined);
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

/**
 * Standard parameterized query interface.
 * Uses standard `?` positional parameters for portability.
 */

function all(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    return db.prepare(sql).all(...params);
  } else {
    if (mode === 'sqlite3') {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
      });
    }
    // pg
    if (mode === 'pg') {
      return db.query(sql, params).then(res => res.rows);
    }
    return Promise.reject(new Error('Unsupported DB mode'));
  }
}

function get(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    return db.prepare(sql).get(...params);
  } else {
    if (mode === 'sqlite3') {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
      });
    }
    if (mode === 'pg') {
      return db.query(sql, params).then(res => res.rows[0] || null);
    }
    return Promise.reject(new Error('Unsupported DB mode'));
  }
}

function run(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    const result = db.prepare(sql).run(...params);
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  } else {
    if (mode === 'sqlite3') {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) return reject(err);
          resolve({ changes: this.changes, lastInsertRowid: this.lastID });
        });
      });
    }
    if (mode === 'pg') {
      return db.query(sql, params).then(res => ({ changes: res.rowCount }));
    }
    return Promise.reject(new Error('Unsupported DB mode'));
  }
}

module.exports = {
  db,
  mode,
  all,
  get,
  run,
  query: all
};
