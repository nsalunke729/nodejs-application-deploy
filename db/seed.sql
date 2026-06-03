-- Optional seed data for local development.

INSERT INTO users (name, email) VALUES
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Smith',     'bob@example.com'),
  ('Carol White',   'carol@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, description, price, stock) VALUES
  ('Widget A',  'A reliable widget',      9.99,  100),
  ('Widget B',  'An advanced widget',    24.99,   50),
  ('Gadget Pro','The pro-grade gadget',  99.99,   25)
ON CONFLICT DO NOTHING;
