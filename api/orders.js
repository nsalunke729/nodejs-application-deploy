import { getPool } from '../lib/db.js';

export default async function handler(req, res) {
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT
            o.id, o.status, o.total, o.created_at,
            u.name AS user_name, u.email AS user_email,
            COALESCE(
              json_agg(
                json_build_object(
                  'product_id', oi.product_id,
                  'product_name', p.name,
                  'quantity', oi.quantity,
                  'price', oi.price
                ) ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL),
              '[]'
            ) AS items
          FROM orders o
          JOIN users u ON u.id = o.user_id
          LEFT JOIN order_items oi ON oi.order_id = o.id
          LEFT JOIN products p ON p.id = oi.product_id
          GROUP BY o.id, u.name, u.email
          ORDER BY o.created_at DESC
          LIMIT 100
        `);
        return res.status(200).json({ orders: result.rows });
      } finally {
        client.release();
      }
    }

    if (req.method === 'POST') {
      const { userId, items } = req.body;

      if (!userId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'userId and a non-empty items array are required' });
      }

      const client = await pool.connect();
      try {
        const productIds = items.map(i => Number(i.productId));
        const productsResult = await client.query(
          'SELECT id, price, stock FROM products WHERE id = ANY($1)',
          [productIds]
        );
        const productMap = Object.fromEntries(productsResult.rows.map(p => [p.id, p]));

        let total = 0;
        const validated = items.map(({ productId, quantity }) => {
          const pid = Number(productId);
          const qty = Number(quantity);
          const product = productMap[pid];
          if (!product) throw Object.assign(new Error(`Product ${pid} not found`), { status: 404 });
          if (product.stock < qty) throw Object.assign(new Error(`Insufficient stock for "${product.name}"`), { status: 409 });
          const price = parseFloat(product.price);
          total += price * qty;
          return { productId: pid, quantity: qty, price };
        });

        await client.query('BEGIN');

        const orderResult = await client.query(
          'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
          [userId, total.toFixed(2)]
        );
        const order = orderResult.rows[0];

        for (const { productId, quantity, price } of validated) {
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [order.id, productId, quantity, price]
          );
          await client.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [quantity, productId]
          );
        }

        await client.query('COMMIT');
        return res.status(201).json({ order });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/orders]', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
