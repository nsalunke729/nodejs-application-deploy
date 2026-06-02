import { register } from '../lib/metrics.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    res.setHeader('Content-Type', register.contentType);
    res.status(200).send(await register.metrics());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
