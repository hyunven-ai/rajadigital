-- =====================================================
-- RAJA DIGITAL — Supabase PostgreSQL Schema
-- Jalankan file ini di Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste > Run
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABEL PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  game_name     TEXT NOT NULL DEFAULT 'Royal Dream',
  price         INTEGER NOT NULL CHECK (price > 0),
  original_price INTEGER,
  description   TEXT,
  amount        TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABEL TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id     TEXT NOT NULL UNIQUE,
  game_id        TEXT NOT NULL,
  game_name      TEXT NOT NULL DEFAULT 'Royal Dream',
  whatsapp       TEXT NOT NULL,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name   TEXT NOT NULL,
  product_price  INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selesai', 'batal')),
  is_processed   BOOLEAN NOT NULL DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_game_id    ON transactions(game_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status     ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- =====================================================
-- 3. TABEL WA_NUMBERS (WhatsApp Load Balancing)
-- =====================================================
CREATE TABLE IF NOT EXISTS wa_numbers (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  label        TEXT NOT NULL,
  number       TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. TABEL ADMINS
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. TABEL SEO_SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_settings (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meta_title       TEXT NOT NULL DEFAULT 'RAJA DIGITAL — Top-Up Royal Dream',
  meta_description TEXT NOT NULL DEFAULT 'Platform top-up game terpercaya.',
  meta_keywords    TEXT,
  og_image         TEXT,
  ga_script        TEXT,
  pixel_script     TEXT,
  widget_script    TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. TABEL ACTIVITY_LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_username TEXT,
  action         TEXT NOT NULL,
  details        TEXT,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Products: public read, admin write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Products are manageable by service role"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

-- Transactions: public insert, admin read/update
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a transaction"
  ON transactions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Transactions managed by service role"
  ON transactions FOR ALL
  USING (auth.role() = 'service_role');

-- WA Numbers: public select active, admin manage
ALTER TABLE wa_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active WA numbers are public"
  ON wa_numbers FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "WA numbers managed by service role"
  ON wa_numbers FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: service role only
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins managed by service role only"
  ON admins FOR ALL
  USING (auth.role() = 'service_role');

-- SEO Settings: public read
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO settings are public"
  ON seo_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "SEO settings managed by service role"
  ON seo_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Activity logs: service role only
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity logs by service role only"
  ON activity_logs FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- ENABLE REALTIME (untuk alarm dashboard admin)
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- =====================================================
-- SEED DATA — Produk Awal
-- =====================================================
INSERT INTO products (name, category, game_name, price, amount, is_active, is_popular, sort_order) VALUES
  ('86 Diamond',   'diamond', 'Royal Dream',  19000, '86',   TRUE, FALSE, 1),
  ('172 Diamond',  'diamond', 'Royal Dream',  36000, '172',  TRUE, FALSE, 2),
  ('257 Diamond',  'diamond', 'Royal Dream',  53000, '257',  TRUE, TRUE,  3),
  ('344 Diamond',  'diamond', 'Royal Dream',  70000, '344',  TRUE, FALSE, 4),
  ('429 Diamond',  'diamond', 'Royal Dream',  85000, '429',  TRUE, FALSE, 5),
  ('514 Diamond',  'diamond', 'Royal Dream',  99000, '514',  TRUE, TRUE,  6),
  ('600 Diamond',  'diamond', 'Royal Dream', 115000, '600',  TRUE, FALSE, 7),
  ('706 Diamond',  'diamond', 'Royal Dream', 135000, '706',  TRUE, FALSE, 8),
  ('878 Diamond',  'diamond', 'Royal Dream', 165000, '878',  TRUE, FALSE, 9),
  ('963 Diamond',  'diamond', 'Royal Dream', 180000, '963',  TRUE, FALSE, 10),
  ('2195 Diamond', 'diamond', 'Royal Dream', 400000, '2195', TRUE, TRUE,  11),
  ('5532 Diamond', 'diamond', 'Royal Dream', 999000, '5532', TRUE, FALSE, 12),
  ('100 Koin',    'koin',    'Royal Dream',  15000, '100',  TRUE, FALSE, 13),
  ('500 Koin',    'koin',    'Royal Dream',  70000, '500',  TRUE, TRUE,  14),
  ('1000 Koin',   'koin',    'Royal Dream', 130000, '1000', TRUE, FALSE, 15),
  ('2500 Koin',   'koin',    'Royal Dream', 310000, '2500', TRUE, FALSE, 16),
  ('5000 Koin',   'koin',    'Royal Dream', 600000, '5000', TRUE, FALSE, 17)
ON CONFLICT DO NOTHING;

-- Seed: Default WA number (ganti dengan nomor kamu)
INSERT INTO wa_numbers (label, number, is_active, sort_order) VALUES
  ('Admin Utama',  '6281234567890', TRUE, 1),
  ('Admin Backup', '6281234567891', TRUE, 2)
ON CONFLICT DO NOTHING;

-- Seed: Default SEO settings
INSERT INTO seo_settings (meta_title, meta_description, meta_keywords) VALUES
  (
    'RAJA DIGITAL — Top-Up Royal Dream Terpercaya',
    'Platform top-up Diamond dan Koin Royal Dream terpercaya. Harga terjangkau, proses cepat, layanan 24 jam.',
    'raja digital, top up royal dream, diamond royal dream, koin royal dream, top up game murah'
  )
ON CONFLICT DO NOTHING;

-- Seed: Default superadmin
-- ⚠️  PENTING: Ganti password_hash ini sebelum production!
-- Generate hash dengan: SELECT crypt('password_kamu', gen_salt('bf')) dari Supabase
INSERT INTO admins (username, email, password_hash, role) VALUES
  ('superadmin', 'admin@rajadigital.com', '$2a$10$placeholder_change_this_in_production', 'superadmin')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VIEWS (untuk dashboard statistics)
-- =====================================================

-- View: Daily transaction stats
CREATE OR REPLACE VIEW v_transaction_stats AS
SELECT
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                    AS total_today,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW()))       AS total_week,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))      AS total_month,
  COALESCE(SUM(product_price) FILTER (WHERE created_at >= CURRENT_DATE AND status = 'selesai'), 0)               AS revenue_today,
  COALESCE(SUM(product_price) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW()) AND status = 'selesai'), 0)  AS revenue_week,
  COALESCE(SUM(product_price) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) AND status = 'selesai'), 0) AS revenue_month,
  COUNT(*) FILTER (WHERE status = 'pending')                            AS pending_count,
  COUNT(*) FILTER (WHERE status = 'selesai')                            AS completed_count,
  COUNT(*) FILTER (WHERE status = 'batal')                              AS cancelled_count
FROM transactions;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Get next WA number (round-robin)
CREATE OR REPLACE FUNCTION get_next_wa_number()
RETURNS TABLE(id UUID, label TEXT, number TEXT) AS $$
DECLARE
  v_wa wa_numbers%ROWTYPE;
BEGIN
  -- Get least recently used active number
  SELECT * INTO v_wa
  FROM wa_numbers
  WHERE is_active = TRUE
  ORDER BY COALESCE(last_used_at, '1970-01-01'::TIMESTAMPTZ) ASC, sort_order ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active WhatsApp numbers available';
  END IF;

  -- Update last_used_at
  UPDATE wa_numbers SET last_used_at = NOW() WHERE wa_numbers.id = v_wa.id;

  RETURN QUERY SELECT v_wa.id, v_wa.label, v_wa.number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
