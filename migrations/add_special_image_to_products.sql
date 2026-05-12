-- Tambahkan kolom special_image ke tabel products
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS special_image TEXT DEFAULT NULL;

-- Verifikasi
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'special_image';
