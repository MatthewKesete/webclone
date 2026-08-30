const path = require('path');
const fs = require('fs');

const defaultDbPath = path.resolve(__dirname, '../db/data.sqlite');
const dbPath = process.env.DB_PATH || defaultDbPath;

console.log(`[Database] Initializing connection targeting: ${dbPath}`);

let db = null;
let mode = 'none';

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

/**
 * Standard parameterized query interface.
 * Uses standard `?` positional parameters for portability.
 */

function all(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    return db.prepare(sql).all(...params);
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  }
}

function get(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    return db.prepare(sql).get(...params);
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
  }
}

function run(sql, params = []) {
  if (!db) throw new Error('Database connection not established.');
  if (mode === 'better-sqlite3') {
    const result = db.prepare(sql).run(...params);
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes, lastInsertRowid: this.lastID });
      });
    });
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
