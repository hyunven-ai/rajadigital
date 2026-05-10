-- Migration: tambah kolom show_title ke tabel banners
-- Jalankan di Supabase Dashboard > SQL Editor

ALTER TABLE banners
ADD COLUMN IF NOT EXISTS show_title BOOLEAN NOT NULL DEFAULT TRUE;

-- Verifikasi
SELECT id, title, show_title FROM banners LIMIT 5;
