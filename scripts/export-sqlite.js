/*
Export SQLite to SQL dump and per-table CSV files.
Usage: node scripts/export-sqlite.js
Outputs to ./exports/
*/
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function toCSVRow(values) {
  return values.map(v => {
    if (v === null || v === undefined) return '';
    if (Buffer.isBuffer(v)) return '"' + v.toString('base64') + '"';
    const s = v.toString();
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');
}

function main() {
  const dbPath = path.resolve(__dirname, '..', 'db', 'data.sqlite');
  console.log('Opening', dbPath);
  const db = new Database(dbPath, { readonly: true });

  const outDir = path.resolve(__dirname, '..', 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all();
  const dumpPath = path.join(outDir, 'sqlite_dump.sql');
  const dumpStream = fs.createWriteStream(dumpPath, { encoding: 'utf8' });

  for (const t of tables) {
    const table = t.name;
    const createSql = t.sql || '';
    dumpStream.write(createSql + '\n\n');

    console.log('Exporting table:', table);
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    const cols = rows.length > 0 ? Object.keys(rows[0]) : db.prepare(`PRAGMA table_info(\'${table}\')`).all().map(c => c.name);

    const csvPath = path.join(outDir, `${table}.csv`);
    const csvStream = fs.createWriteStream(csvPath, { encoding: 'utf8' });
    csvStream.write(cols.join(',') + '\n');
    for (const r of rows) {
      const vals = cols.map(c => r[c]);
      csvStream.write(toCSVRow(vals) + '\n');
    }
    csvStream.end();

    // Also write INSERT statements to dump
    for (const r of rows) {
      const vals = cols.map(c => {
        const v = r[c];
        if (v === null || v === undefined) return 'NULL';
        if (Buffer.isBuffer(v)) return `E'\\x${v.toString('hex')}'`;
        const escaped = v.toString().replace(/'/g, "''");
        return `'${escaped}'`;
      });
      dumpStream.write(`INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${vals.join(',')});\n`);
    }
    dumpStream.write('\n');
  }

  dumpStream.end();
  db.close();
  console.log('Export complete. Files in', outDir);
}

main();
