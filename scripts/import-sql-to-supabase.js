const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.resolve(__dirname, '..', 'exports', 'sqlite_dump.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL dump not found at', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '6543', 10),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Postgres, starting import...');

  // Split statements by semicolon followed by newline. This is simple but works for generated dump.
  const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
  console.log(`Found ${statements.length} statements`);

  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      process.stdout.write(`Executing ${i + 1}/${statements.length}... `);
      try {
        await client.query(stmt);
        console.log('ok');
      } catch (err) {
        console.error('failed:', err.message);
        // Continue on errors but report
      }
    }
    console.log('Import finished');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Import error:', err);
  process.exit(1);
});
