-- =====================================================
-- MIGRATION: Expand product categories
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- =====================================================

-- 1. Hapus constraint CHECK lama yang membatasi category
--    (nama constraint-nya mungkin berbeda, kita hapus semua yang mungkin ada)
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

-- 2. (Opsional) Verifikasi constraint sudah hilang
-- SELECT conname FROM pg_constraint WHERE conrelid = 'products'::regclass;

-- 3. Update produk lama yang salah kategori
--    Jika ada produk "50 Voucher" untuk Ragnarok yang tersimpan sebagai 'diamond', perbaiki:
UPDATE products
  SET category = 'voucher'
  WHERE game_name = 'Ragnarok Origin'
    AND category = 'diamond'
    AND (name ILIKE '%voucher%');

UPDATE products
  SET category = 'uc'
  WHERE game_name = 'PUBG Mobile'
    AND category IN ('diamond', 'item');

UPDATE products
  SET category = 'chip'
  WHERE game_name = 'Higgs Domino'
    AND name ILIKE '%chip%';

-- 4. Tambahkan index pada kolom category untuk performa query
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_game_name ON products(game_name);

-- 5. Selesai — kategori sekarang bebas: diamond, koin, uc, voucher, chip, dll.
SELECT 'Migration selesai! Kategori bebas sudah aktif.' AS status;
