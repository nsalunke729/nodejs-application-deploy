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
