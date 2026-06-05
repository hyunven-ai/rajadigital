-- =====================================================
-- Migration: Tambah field DOKU ke tabel transactions
-- Jalankan SQL ini di Supabase SQL Editor
-- =====================================================

-- Field tambahan untuk integrasi DOKU QRIS Dinamis
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doku_invoice_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doku_qr_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doku_qr_content TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doku_external_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doku_reference_no TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doku_paid_at TIMESTAMPTZ;

-- Metode pembayaran: 'qris_static' (default, gambar manual) atau 'qris_doku' (dinamis)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'qris_static';

-- Index untuk lookup cepat berdasarkan invoice DOKU
CREATE INDEX IF NOT EXISTS idx_transactions_doku_invoice_id
  ON transactions(doku_invoice_id);

CREATE INDEX IF NOT EXISTS idx_transactions_doku_external_id
  ON transactions(doku_external_id);

-- Kolom processed_by dan processed_at (jika belum ada)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_by TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
