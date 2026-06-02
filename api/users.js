import { query } from '../lib/db.js';
import { httpRequestsTotal, httpRequestDurationSeconds } from '../lib/metrics.js';

export default async function handler(req, res) {
  const end = httpRequestDurationSeconds.startTimer({ method: req.method, route: '/api/users' });

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT 100');
      httpRequestsTotal.inc({ method: 'GET', route: '/api/users', status_code: 200 });
      end();
      return res.status(200).json({ users: result.rows });
    }

    if (req.method === 'POST') {
      const { name, email } = req.body;
      if (!name || !email) {
        httpRequestsTotal.inc({ method: 'POST', route: '/api/users', status_code: 400 });
        end();
        return res.status(400).json({ error: 'name and email are required' });
      }
      const result = await query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
      );
      httpRequestsTotal.inc({ method: 'POST', route: '/api/users', status_code: 201 });
      end();
      return res.status(201).json({ user: result.rows[0] });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    httpRequestsTotal.inc({ method: req.method, route: '/api/users', status_code: 500 });
    end();
    res.status(500).json({ error: err.message });
  }
}
