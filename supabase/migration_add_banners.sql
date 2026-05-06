-- =====================================================
-- MIGRATION: Tambah tabel banners untuk carousel beranda
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- =====================================================

-- 1. Buat tabel banners
CREATE TABLE IF NOT EXISTS banners (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT NOT NULL,
  link_url    TEXT,
  link_label  TEXT,
  badge_text  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger auto-update updated_at
CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_banners_is_active   ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order  ON banners(sort_order);

-- 4. RLS Policies
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are viewable by everyone"
  ON banners FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Banners managed by service role"
  ON banners FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Seed: Banner default
INSERT INTO banners (title, subtitle, image_url, link_url, link_label, badge_text, is_active, sort_order) VALUES
  (
    'Top-Up Royal Dream Terpercaya',
    'Diamond dan Koin tersedia dengan harga terbaik. Proses cepat, aman, 24 jam online.',
    '/games/royal-dream.png',
    '#games',
    'Top Up Sekarang',
    '🔥 Promo Hari Ini',
    TRUE,
    1
  ),
  (
    'PUBG Mobile — Top-Up UC Murah',
    'UC PUBG Mobile tersedia mulai harga terjangkau. Proses instan via WhatsApp.',
    '/games/pubg-mobile.png',
    '/games/pubg-mobile',
    'Beli UC Sekarang',
    '🎖️ UC Tersedia',
    TRUE,
    2
  ),
  (
    'Mobile Legends — Diamond Resmi',
    'Top-up Diamond ML harga kompetitif. Server ID otomatis, proses hitungan menit.',
    '/games/mobile-legends.png',
    '/games/mobile-legends',
    'Top Up Diamond',
    '💎 Harga Terbaik',
    TRUE,
    3
  )
ON CONFLICT DO NOTHING;

SELECT 'Migration selesai! Tabel banners sudah dibuat.' AS status;
