-- Run this once against your PostgreSQL database before starting the app.
-- Works with Neon (Vercel Postgres), local Docker Postgres, or any hosted PG.

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  description TEXT           NOT NULL DEFAULT '',
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock       INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_email       ON users    (email);
CREATE INDEX IF NOT EXISTS idx_products_name     ON products (name);
CREATE INDEX IF NOT EXISTS idx_users_created     ON users    (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_created  ON products (created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER        NOT NULL REFERENCES users(id),
  status     VARCHAR(50)    NOT NULL DEFAULT 'pending',
  total      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER        NOT NULL REFERENCES products(id),
  quantity   INTEGER        NOT NULL CHECK (quantity > 0),
  price      NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders      (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders      (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
