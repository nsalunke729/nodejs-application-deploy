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
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 100');
    httpRequests.inc({ method: 'GET', route: '/products', status_code: 200 });
    res.json({ products: result.rows });
  } catch (err) {
    console.error('[product-service GET /products]', err);
    httpRequests.inc({ method: 'GET', route: '/products', status_code: 500 });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/products', async (req, res) => {
  const { name, description, price, stock } = req.body;
  const parsedPrice = parseFloat(price);
  if (!name || price === undefined || price === null || isNaN(parsedPrice) || parsedPrice < 0) {
    httpRequests.inc({ method: 'POST', route: '/products', status_code: 400 });
    return res.status(400).json({ error: 'name and a valid non-negative price are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', parsedPrice, stock || 0]
    );
    httpRequests.inc({ method: 'POST', route: '/products', status_code: 201 });
    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error('[product-service POST /products]', err);
    httpRequests.inc({ method: 'POST', route: '/products', status_code: 500 });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      httpRequests.inc({ method: 'DELETE', route: '/products/:id', status_code: 404 });
      return res.status(404).json({ error: 'Product not found' });
    }
    httpRequests.inc({ method: 'DELETE', route: '/products/:id', status_code: 200 });
    res.json({ deleted: true });
  } catch (err) {
    console.error('[product-service DELETE /products/:id]', err);
    httpRequests.inc({ method: 'DELETE', route: '/products/:id', status_code: 500 });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`product-service running on port ${PORT}`));
