-- Jalankan script ini di SQL Editor Supabase untuk menambahkan kolom wa2_widget ke tabel site_settings

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS wa2_widget_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS wa2_widget_label TEXT DEFAULT 'Chat Admin 2',
ADD COLUMN IF NOT EXISTS wa2_widget_enabled BOOLEAN DEFAULT false;
