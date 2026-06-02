import express from 'express';
import pg from 'pg';
import client from 'prom-client';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3002;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Prometheus setup
const register = new client.Registry();
register.setDefaultLabels({ service: 'product-service' });
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: 'product_service_http_requests_total',
  help: 'Total HTTP requests to product-service',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'product-service', uptime: process.uptime() });
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.get('/products', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    httpRequests.inc({ method: 'GET', route: '/products', status_code: 200 });
    res.json({ products: result.rows });
  } catch (err) {
    httpRequests.inc({ method: 'GET', route: '/products', status_code: 500 });
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  const { name, description, price, stock } = req.body;
  if (!name || price === undefined) {
    httpRequests.inc({ method: 'POST', route: '/products', status_code: 400 });
    return res.status(400).json({ error: 'name and price are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', price, stock || 0]
    );
    httpRequests.inc({ method: 'POST', route: '/products', status_code: 201 });
    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    httpRequests.inc({ method: 'POST', route: '/products', status_code: 500 });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    httpRequests.inc({ method: 'DELETE', route: '/products/:id', status_code: 200 });
    res.json({ deleted: true });
  } catch (err) {
    httpRequests.inc({ method: 'DELETE', route: '/products/:id', status_code: 500 });
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`product-service running on port ${PORT}`));
