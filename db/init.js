import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('ERROR: DATABASE_URL is not set.');
  console.error('Make sure a .env file exists in the project root with DATABASE_URL set.');
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected to database.');

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await client.query(schema);
  console.log('Schema applied.');

  if (process.argv.includes('--seed')) {
    const seed = readFileSync(join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seed);
    console.log('Seed data inserted.');
  }

  await client.end();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Database init failed:', err.message);
  process.exit(1);
});
