import pg from 'pg';
const { Pool } = pg;

// Reuse pool across warm serverless invocations
let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Required for Neon/Vercel Postgres and most hosted PG providers
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 2, // Keep small for serverless — avoid exhausting connections
    });
  }
  return pool;
}

export async function query(sql, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}
