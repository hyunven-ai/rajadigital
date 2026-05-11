-- Migration: Tambah kolom payment_proof ke tabel transactions
-- Jalankan di Supabase SQL Editor

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_proof TEXT DEFAULT NULL;

-- (Opsional) Buat bucket storage untuk bukti transfer
-- Jalankan di Supabase Dashboard → Storage → New Bucket
-- Nama bucket: payment-proofs
-- Public: true
