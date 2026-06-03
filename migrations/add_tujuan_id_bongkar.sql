-- Migration: Add tujuan_id_bongkar to games table
-- Jalankan file ini di Supabase SQL Editor

ALTER TABLE games
ADD COLUMN IF NOT EXISTS tujuan_id_bongkar TEXT DEFAULT NULL;
