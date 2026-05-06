-- =====================================================
-- MIGRATION: Tambah Tabel bongkar_chip_requests
-- Jalankan di Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS bongkar_chip_requests (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id     TEXT NOT NULL UNIQUE,
  player_id      TEXT NOT NULL,
  nominal_bongkar INTEGER NOT NULL,      -- dalam satuan B (misal: 2 = 2B)
  bank           TEXT NOT NULL,
  nomor_rekening TEXT NOT NULL,
  nama_rekening  TEXT NOT NULL,
  whatsapp       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'diproses', 'selesai', 'batal')),
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger auto-update updated_at
CREATE TRIGGER bongkar_chip_updated_at
  BEFORE UPDATE ON bongkar_chip_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bongkar_invoice   ON bongkar_chip_requests(invoice_id);
CREATE INDEX IF NOT EXISTS idx_bongkar_status    ON bongkar_chip_requests(status);
CREATE INDEX IF NOT EXISTS idx_bongkar_created   ON bongkar_chip_requests(created_at DESC);

-- RLS
ALTER TABLE bongkar_chip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit bongkar chip request"
  ON bongkar_chip_requests FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Bongkar chip managed by service role"
  ON bongkar_chip_requests FOR ALL
  USING (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bongkar_chip_requests;
