import { query } from '../lib/db.js';
import { httpRequestsTotal, httpRequestDurationSeconds } from '../lib/metrics.js';

export default async function handler(req, res) {
  const end = httpRequestDurationSeconds.startTimer({ method: req.method, route: '/api/products' });

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM products ORDER BY created_at DESC LIMIT 100');
      httpRequestsTotal.inc({ method: 'GET', route: '/api/products', status_code: 200 });
      end();
      return res.status(200).json({ products: result.rows });
    }

    if (req.method === 'POST') {
      const { name, description, price, stock } = req.body;
      if (!name || price === undefined) {
        httpRequestsTotal.inc({ method: 'POST', route: '/api/products', status_code: 400 });
        end();
        return res.status(400).json({ error: 'name and price are required' });
      }
      const result = await query(
        'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description || '', price, stock || 0]
      );
      httpRequestsTotal.inc({ method: 'POST', route: '/api/products', status_code: 201 });
      end();
      return res.status(201).json({ product: result.rows[0] });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    httpRequestsTotal.inc({ method: req.method, route: '/api/products', status_code: 500 });
    end();
    res.status(500).json({ error: err.message });
  }
}
