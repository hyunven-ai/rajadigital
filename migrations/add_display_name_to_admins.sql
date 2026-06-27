-- Tambah kolom display_name ke tabel admins
-- display_name: nama tampilan custom admin (contoh: "Budi OP", "CS Lisa")
-- Jika NULL, fallback ke username

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS display_name TEXT NULL;

-- Tambah komentar untuk dokumentasi
COMMENT ON COLUMN admins.display_name IS 'Nama tampilan admin (opsional). Jika kosong, username digunakan sebagai fallback.';
