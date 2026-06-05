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
      // Bulk import: body has { products: [...] }
      if (Array.isArray(req.body?.products)) {
        const rows = req.body.products;
        const valid = rows.filter(p => p.name && !isNaN(parseFloat(p.price)) && parseFloat(p.price) >= 0);
        if (valid.length === 0) {
          httpRequestsTotal.inc({ method: 'POST', route: '/api/products', status_code: 400 });
          end();
          return res.status(400).json({ error: 'No valid products in payload' });
        }
        const inserted = [];
        for (const p of valid) {
          const r = await query(
            'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
            [p.name, p.description || '', parseFloat(p.price), parseInt(p.stock, 10) || 0]
          );
          inserted.push(r.rows[0]);
        }
        httpRequestsTotal.inc({ method: 'POST', route: '/api/products', status_code: 201 });
        end();
        return res.status(201).json({ products: inserted, count: inserted.length });
      }

      // Single product
      const { name, description, price, stock } = req.body;
      const parsedPrice = parseFloat(price);
      if (!name || price === undefined || price === null || isNaN(parsedPrice) || parsedPrice < 0) {
        httpRequestsTotal.inc({ method: 'POST', route: '/api/products', status_code: 400 });
        end();
        return res.status(400).json({ error: 'name and a valid non-negative price are required' });
      }
      const result = await query(
        'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description || '', parsedPrice, stock || 0]
      );
      httpRequestsTotal.inc({ method: 'POST', route: '/api/products', status_code: 201 });
      end();
      return res.status(201).json({ product: result.rows[0] });
    }

    httpRequestsTotal.inc({ method: req.method, route: '/api/products', status_code: 405 });
    end();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/products]', err);
    httpRequestsTotal.inc({ method: req.method, route: '/api/products', status_code: 500 });
    end();
    res.status(500).json({ error: 'Internal server error' });
  }
}
