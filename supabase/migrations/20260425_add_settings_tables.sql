CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY,
  meta_title text,
  meta_description text,
  meta_keywords text,
  ga_script text,
  pixel_script text,
  widget_script text,
  wa_widget_number text,
  wa_widget_label text,
  wa_widget_enabled boolean,
  tg_widget_username text,
  tg_widget_label text,
  tg_widget_enabled boolean,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS wa_numbers (
  id text PRIMARY KEY,
  label text,
  number text,
  is_active boolean,
  sort_order integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS qris_settings (
  id text PRIMARY KEY,
  label text,
  image_url text,
  is_active boolean,
  sort_order integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
