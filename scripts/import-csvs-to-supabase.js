const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function parseCSVLine(line) {
  const res = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      res.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  res.push(cur);
  return res.map(v => (v === '' ? null : v));
}

async function importCsvs() {
  const exportsDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) {
    console.error('exports directory not found:', exportsDir);
    process.exit(1);
  }

  const client = new Client();
  await client.connect();
  console.log('Connected to Postgres, importing CSVs from', exportsDir);

  const files = fs.readdirSync(exportsDir).filter(f => f.endsWith('.csv'));
  for (const file of files) {
    const full = path.join(exportsDir, file);
    const table = path.basename(file, '.csv');
    console.log('Processing', file, '=> table', table);

    // read header
    const data = fs.readFileSync(full, 'utf8');
    const lines = data.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      console.log('  empty file, skipping');
      continue;
    }
    const headers = parseCSVLine(lines[0]).map(h => h ? h.trim() : 'col');
    // sanitize headers to remove empty names
    for (let i=0;i<headers.length;i++) if (!headers[i]) headers[i] = `col_${i+1}`;

    // create table with text columns
    const colsSql = headers.map(h => `"${h.replace(/"/g,'') }" text`).join(', ');
    const createSql = `CREATE TABLE IF NOT EXISTS "${table}" (${colsSql})`;
    try {
      await client.query(createSql);
      console.log('  created/verified table', table);
    } catch (err) {
      console.error('  create table failed:', err.message);
      continue;
    }

    // batch insert
    const batchSize = 200;
    let rowCount = 0;
    let batch = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      // pad row to headers length
      while (row.length < headers.length) row.push(null);
      batch.push(row);
      if (batch.length >= batchSize) {
        try {
          await insertBatch(client, table, headers, batch);
          rowCount += batch.length;
          batch = [];
        } catch (err) {
          console.error('  insert batch failed:', err.message);
          process.exitCode = 1;
        }
      }
    }
    if (batch.length) {
      try {
        await insertBatch(client, table, headers, batch);
        rowCount += batch.length;
      } catch (err) {
        console.error('  final insert batch failed:', err.message);
        process.exitCode = 1;
      }
    }
    console.log(`  imported ${rowCount} rows into ${table}`);
  }

  await client.end();
  console.log('All done.');
}

async function insertBatch(client, table, headers, rows) {
  const flat = [];
  const rowPlaceholders = rows.map((r, ri) => {
    const placeholders = r.map((_, ci) => {
      flat.push(r[ci]);
      return `$${flat.length}`;
    });
    return `(${placeholders.join(',')})`;
  }).join(',');

  const cols = headers.map(h => `"${h.replace(/"/g,'')}"`).join(',');
  const sql = `INSERT INTO "${table}" (${cols}) VALUES ${rowPlaceholders}`;
  await client.query(sql, flat);
}

importCsvs().catch(err => { console.error(err); process.exit(1); });
