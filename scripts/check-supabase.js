const { Client } = require('pg');

async function check(env) {
  const client = new Client({
    host: env.PGHOST,
    port: parseInt(env.PGPORT || '5432', 10),
    database: env.PGDATABASE || 'postgres',
    user: env.PGUSER,
    password: env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    console.log(`Connected as ${env.PGUSER}@${env.PGHOST}:${env.PGPORT}/${env.PGDATABASE}`);
    const tablesRes = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename");
    const tables = tablesRes.rows.map(r => r.tablename);
    if (tables.length === 0) {
      console.log('No tables found in public schema');
    } else {
      for (const t of tables) {
        try {
          const cnt = await client.query(`SELECT count(*) as c FROM "${t}"`);
          console.log(`${t}: ${cnt.rows[0].c} rows`);
        } catch (e) {
          console.log(`${t}: error counting rows: ${e.message}`);
        }
      }
    }
    await client.end();
    return true;
  } catch (err) {
    console.error('Connection error:', err.message);
    try { await client.end(); } catch(e){}
    return false;
  }
}

async function main() {
  const envs = [
    { PGHOST: process.env.PGHOST, PGPORT: process.env.PGPORT, PGDATABASE: process.env.PGDATABASE, PGUSER: process.env.PGUSER, PGPASSWORD: process.env.PGPASSWORD },
  ];
  // allow trying an alternate user passed as ARG
  if (process.argv[2] === 'try-alt-user') {
    envs.push({ PGHOST: process.env.PGHOST, PGPORT: process.env.PGPORT, PGDATABASE: process.env.PGDATABASE, PGUSER: process.env.PGUSER_ALT, PGPASSWORD: process.env.PGPASSWORD });
  }

  for (const e of envs) {
    console.log('--- Trying', e.PGUSER, '---');
    const ok = await check(e);
    if (ok) return;
  }
  console.error('All connection attempts failed');
}

main();
