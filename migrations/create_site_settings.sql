-- Migration: Buat tabel site_settings untuk menyimpan konfigurasi aplikasi
-- Termasuk: running text config, dan konfigurasi lainnya
-- Jalankan di Supabase SQL Editor: https://supabase.com/dashboard/project/kjpupnjfltltsdkrvnze/sql/new

-- 1. Buat tabel site_settings (jika belum ada)
CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tambah kolom special_image ke products (jika belum ada)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS special_image TEXT DEFAULT NULL;

-- 3. Index untuk performa lookup by key
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings (key);

-- 4. Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
