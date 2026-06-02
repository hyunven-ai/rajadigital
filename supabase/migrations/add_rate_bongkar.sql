-- ============================================================
-- MIGRATION: Tambah Kolom rate_bongkar ke tabel games
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS rate_bongkar INTEGER DEFAULT NULL;
