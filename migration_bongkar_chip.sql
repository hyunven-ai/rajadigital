-- Jalankan SQL ini di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

ALTER TABLE bongkar_chip_requests
  ADD COLUMN IF NOT EXISTS game_name TEXT,
  ADD COLUMN IF NOT EXISTS nominal_pembayaran BIGINT;
