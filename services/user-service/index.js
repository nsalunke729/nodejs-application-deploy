import express from 'express';
import pg from 'pg';
import client from 'prom-client';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Prometheus setup
const register = new client.Registry();
register.setDefaultLabels({ service: 'user-service' });
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: 'user_service_http_requests_total',
  help: 'Total HTTP requests to user-service',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service', uptime: process.uptime() });
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.get('/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    httpRequests.inc({ method: 'GET', route: '/users', status_code: 200 });
    res.json({ users: result.rows });
  } catch (err) {
    httpRequests.inc({ method: 'GET', route: '/users', status_code: 500 });
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    httpRequests.inc({ method: 'POST', route: '/users', status_code: 400 });
    return res.status(400).json({ error: 'name and email are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    httpRequests.inc({ method: 'POST', route: '/users', status_code: 201 });
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    httpRequests.inc({ method: 'POST', route: '/users', status_code: 500 });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    httpRequests.inc({ method: 'DELETE', route: '/users/:id', status_code: 200 });
    res.json({ deleted: true });
  } catch (err) {
    httpRequests.inc({ method: 'DELETE', route: '/users/:id', status_code: 500 });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`user-service running on port ${PORT}`));
