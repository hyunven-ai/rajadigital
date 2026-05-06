-- =====================================================
-- MIGRATION: Tambah tabel gallery_images + Supabase Storage bucket
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- =====================================================

-- 1. Buat tabel gallery_images
CREATE TABLE IF NOT EXISTS gallery_images (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  file_path   TEXT NOT NULL UNIQUE,
  url         TEXT NOT NULL,
  folder      TEXT NOT NULL DEFAULT 'general',
  alt         TEXT NOT NULL DEFAULT '',
  size        BIGINT NOT NULL DEFAULT 0,
  mime_type   TEXT NOT NULL DEFAULT 'image/jpeg',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Auto-update updated_at
CREATE TRIGGER gallery_images_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_folder     ON gallery_images(folder);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_name       ON gallery_images USING gin(to_tsvector('simple', name));

-- 4. RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery viewable by everyone"
  ON gallery_images FOR SELECT USING (TRUE);

CREATE POLICY "Gallery managed by service role"
  ON gallery_images FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- PENTING: Buat Storage Bucket di Supabase Dashboard
-- Storage > New Bucket > Name: "gallery" > Public: YES
-- =====================================================
-- Atau jalankan SQL ini (mungkin perlu dari dashboard):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Storage bucket policies (jalankan jika bucket sudah dibuat)
-- CREATE POLICY "Public gallery read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'gallery');

-- CREATE POLICY "Admin gallery write"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'gallery');

-- CREATE POLICY "Admin gallery delete"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'gallery');

SELECT 'Migration gallery_images selesai!' AS status;
