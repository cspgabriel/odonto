const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const sql = postgres(process.env.DIRECT_DATABASE_URL, {
    ssl: 'require',
    connect_timeout: 10,
  });

  try {
    console.log('Connecting to:', process.env.DIRECT_DATABASE_URL.replace(/:[^:]+@/, ':****@'));
    const res = await sql`SELECT NOW()`;
    console.log('Connected successfully!', res[0]);
    await sql.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

test();

