-- Dwano core schema. ADDITIVE ONLY: every statement is IF NOT EXISTS; nothing is dropped, truncated or rewritten.
-- Review, then run once in your Postgres SQL editor (Neon/Supabase). Safe to re-run.
-- Requires PostgreSQL 13+ (gen_random_uuid) and the pg_trgm extension.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ───────────── Pharmacies & subscriptions ─────────────
CREATE TABLE IF NOT EXISTS pharmacies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  owner_name    text NOT NULL,
  phone         text NOT NULL,
  whatsapp      text,
  email         text,
  governorate_id text NOT NULL DEFAULT 'gov-fayoum',
  district_id   text,
  area_id       text,
  address       text,
  hours         text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected')),
  source        text NOT NULL DEFAULT 'registered' CHECK (source IN ('registered','manual')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pharmacies_status_idx ON pharmacies (status);

CREATE TABLE IF NOT EXISTS warehouses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  phone         text NOT NULL,
  whatsapp      text,
  address       text NOT NULL,
  governorate   text NOT NULL DEFAULT 'الفيوم',
  district_id   text,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin','pharmacy','warehouse')),
  display_name  text,
  pharmacy_id   uuid REFERENCES pharmacies(id) ON DELETE RESTRICT,
  warehouse_id  uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  CHECK ((role = 'pharmacy' AND pharmacy_id IS NOT NULL) OR (role = 'warehouse' AND warehouse_id IS NOT NULL) OR role = 'admin')
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (lower(username));
CREATE INDEX IF NOT EXISTS users_pharmacy_idx ON users (pharmacy_id);
CREATE INDEX IF NOT EXISTS users_warehouse_idx ON users (warehouse_id);

CREATE TABLE IF NOT EXISTS pharmacy_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id   uuid NOT NULL UNIQUE REFERENCES pharmacies(id) ON DELETE RESTRICT,
  monthly_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (monthly_amount >= 0),
  start_date    date,
  end_date      date,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id   uuid NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
  amount        numeric(10,2) NOT NULL CHECK (amount > 0),
  paid_at       date NOT NULL DEFAULT CURRENT_DATE,
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  method        text,
  note          text,
  recorded_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS subscription_payments_pharmacy_idx ON subscription_payments (pharmacy_id, paid_at DESC);

-- ───────────── Medicine requests & prescriptions ─────────────
CREATE TABLE IF NOT EXISTS medicine_requests (
  id            text PRIMARY KEY,
  medicine_id   text,
  medicine_name text NOT NULL,
  full_name     text NOT NULL,
  phone         text NOT NULL,
  whatsapp      text NOT NULL,
  governorate   text NOT NULL DEFAULT 'الفيوم',
  district_id   text,
  district_name text,
  area_id       text,
  area_name     text,
  address       text,
  lat           double precision CHECK (lat BETWEEN -90 AND 90),
  lng           double precision CHECK (lng BETWEEN -180 AND 180),
  accuracy_m    integer,
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_review','contacted','closed')),
  seen          boolean NOT NULL DEFAULT false,
  ip_hash       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medicine_requests_created_idx ON medicine_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS medicine_requests_ip_idx ON medicine_requests (ip_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS prescriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    text NOT NULL UNIQUE REFERENCES medicine_requests(id) ON DELETE CASCADE,
  storage_url   text NOT NULL,          -- object-storage URL of the ENCRYPTED file (never exposed to clients)
  content_type  text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  size_bytes    integer NOT NULL CHECK (size_bytes > 0),
  sha256        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ───────────── Souqak (marketplace) ─────────────
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id   uuid NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
  name          text NOT NULL,
  name_norm     text NOT NULL,
  description   text,
  category      text NOT NULL CHECK (category IN ('cosmetics','skincare','haircare','personal_care')),
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  quantity      integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  is_active     boolean NOT NULL DEFAULT true,
  image_url     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_pharmacy_idx ON products (pharmacy_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category) WHERE is_active;
CREATE INDEX IF NOT EXISTS products_name_trgm ON products USING gin (name_norm gin_trgm_ops);

CREATE TABLE IF NOT EXISTS product_orders (
  id            text PRIMARY KEY,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  pharmacy_id   uuid NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
  product_name  text NOT NULL,
  quantity      integer NOT NULL CHECK (quantity > 0),
  unit_price    numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  customer_name text NOT NULL,
  phone         text NOT NULL,
  address       text,
  notes         text,
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','delivered','cancelled')),
  ip_hash       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_orders_pharmacy_idx ON product_orders (pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS product_orders_ip_idx ON product_orders (ip_hash, created_at DESC);

-- ───────────── Warehouse medicine catalogue ─────────────
CREATE TABLE IF NOT EXISTS warehouse_medicines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id  uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name          text NOT NULL,
  name_norm     text NOT NULL,
  strength      text NOT NULL DEFAULT '',
  form          text NOT NULL DEFAULT '',
  availability  text NOT NULL DEFAULT 'available' CHECK (availability IN ('available','limited','out')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS warehouse_medicines_uq ON warehouse_medicines (warehouse_id, name_norm, strength, form);
CREATE INDEX IF NOT EXISTS warehouse_medicines_name_trgm ON warehouse_medicines USING gin (name_norm gin_trgm_ops);

-- ───────────── Internal operations (admin only) ─────────────
CREATE TABLE IF NOT EXISTS ops_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id   uuid NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
  tx_date       date NOT NULL DEFAULT CURRENT_DATE,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','partial','fulfilled','cancelled')),
  notes         text,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ops_transactions_date_idx ON ops_transactions (tx_date DESC);
CREATE INDEX IF NOT EXISTS ops_transactions_pharmacy_idx ON ops_transactions (pharmacy_id, tx_date DESC);

CREATE TABLE IF NOT EXISTS ops_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES ops_transactions(id) ON DELETE CASCADE,
  product_name  text NOT NULL,
  requested_qty integer NOT NULL CHECK (requested_qty > 0),
  fulfilled_qty integer NOT NULL DEFAULT 0 CHECK (fulfilled_qty >= 0),
  unit_price    numeric(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  notes         text,
  CHECK (fulfilled_qty <= requested_qty)
);
CREATE INDEX IF NOT EXISTS ops_items_tx_idx ON ops_items (transaction_id);

-- history is kept: transactions are cancelled, never deleted
CREATE TABLE IF NOT EXISTS ops_audit (
  id            bigserial PRIMARY KEY,
  transaction_id uuid REFERENCES ops_transactions(id) ON DELETE SET NULL,
  actor_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  before_data   jsonb,
  after_data    jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ops_audit_tx_idx ON ops_audit (transaction_id, created_at DESC);

COMMIT;
