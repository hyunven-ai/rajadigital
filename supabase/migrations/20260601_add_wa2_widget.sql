-- Migration: Add wa2_widget settings to site_settings
-- Jalankan di Supabase SQL Editor

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS wa2_widget_number text,
ADD COLUMN IF NOT EXISTS wa2_widget_label text,
ADD COLUMN IF NOT EXISTS wa2_widget_enabled boolean;
