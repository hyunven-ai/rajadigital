/**
 * setup-gallery.mjs
 * Jalankan: node scripts/setup-gallery.mjs
 * 
 * Script ini akan:
 * 1. Membuat tabel gallery_images di Supabase (via SQL)
 * 2. Membuat storage bucket "gallery" (public)
 * 3. Mengatur storage policies
 */

import { createClient } from "@supabase/supabase-js";

// Baca dari .env.local secara manual
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

// Parse .env.local
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  if (key) env[key.trim()] = rest.join("=").trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log("🚀 Memulai setup gallery...");
console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

// ── Step 1: Buat tabel gallery_images ─────────────────────────────────────
async function createTable() {
  console.log("📋 Step 1: Membuat tabel gallery_images...");

  const sql = `
    -- Buat tabel gallery_images
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

    -- Index
    CREATE INDEX IF NOT EXISTS idx_gallery_folder     ON gallery_images(folder);
    CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery_images(created_at DESC);

    -- RLS
    ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

    -- Policies
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gallery_images' AND policyname = 'Gallery viewable by everyone'
      ) THEN
        CREATE POLICY "Gallery viewable by everyone"
          ON gallery_images FOR SELECT USING (TRUE);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gallery_images' AND policyname = 'Gallery managed by service role'
      ) THEN
        CREATE POLICY "Gallery managed by service role"
          ON gallery_images FOR ALL USING (auth.role() = 'service_role');
      END IF;
    END $$;
  `;

  // Verifikasi tabel sudah ada dengan query langsung
  const { error: checkErr } = await db
    .from("gallery_images")
    .select("id")
    .limit(1);

  if (checkErr && checkErr.code === "42P01") {
    // Tabel belum ada — tidak bisa auto-create tanpa SQL Editor
    console.log("⚠️  Tabel gallery_images belum ada.");
    console.log("   Silakan jalankan SQL berikut di Supabase Dashboard > SQL Editor:\n");
    console.log("─".repeat(60));
    console.log(`
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

CREATE INDEX IF NOT EXISTS idx_gallery_folder     ON gallery_images(folder);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery_images(created_at DESC);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery viewable by everyone"
  ON gallery_images FOR SELECT USING (TRUE);

CREATE POLICY "Gallery managed by service role"
  ON gallery_images FOR ALL USING (auth.role() = 'service_role');
    `);
    console.log("─".repeat(60));
    return false;
  } else if (!checkErr) {
    console.log("✅ Tabel gallery_images sudah ada!\n");
    return true;
  } else {
    console.log(`⚠️  Status tabel: ${checkErr.message}\n`);
    return false;
  }
}

// ── Step 2: Buat bucket gallery ────────────────────────────────────────────
async function createBucket() {
  console.log("🗂️  Step 2: Membuat storage bucket 'gallery'...");

  // Cek apakah bucket sudah ada
  const { data: buckets, error: listErr } = await db.storage.listBuckets();

  if (listErr) {
    console.log(`   ❌ Gagal list bucket: ${listErr.message}`);
    return false;
  }

  const exists = buckets?.some((b) => b.id === "gallery");

  if (exists) {
    console.log("   ✅ Bucket 'gallery' sudah ada!\n");
    return true;
  }

  // Buat bucket baru
  const { error: createErr } = await db.storage.createBucket("gallery", {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/jpg"],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  });

  if (createErr) {
    console.log(`   ❌ Gagal membuat bucket: ${createErr.message}`);
    console.log("   💡 Buat manual di Supabase Dashboard > Storage > New Bucket");
    console.log("      Name: gallery | Public: YES\n");
    return false;
  }

  console.log("   ✅ Bucket 'gallery' berhasil dibuat!\n");
  return true;
}

// ── Step 3: Test upload ────────────────────────────────────────────────────
async function testUpload() {
  console.log("🧪 Step 3: Test upload file kecil...");

  // Buat dummy PNG (1x1 pixel)
  const pngData = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const { error: uploadErr } = await db.storage
    .from("gallery")
    .upload("test/setup-test.png", pngData, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadErr) {
    console.log(`   ❌ Test upload gagal: ${uploadErr.message}`);
    return false;
  }

  // Get public URL
  const { data: urlData } = db.storage.from("gallery").getPublicUrl("test/setup-test.png");
  console.log(`   ✅ Test upload berhasil!`);
  console.log(`   🔗 URL: ${urlData.publicUrl}\n`);

  // Hapus file test
  await db.storage.from("gallery").remove(["test/setup-test.png"]);
  console.log("   🗑️  File test dihapus.\n");

  return true;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const tableOk  = await createTable();
  const bucketOk = await createBucket();

  if (bucketOk) {
    await testUpload();
  }

  console.log("═".repeat(60));
  console.log("📊 HASIL SETUP:");
  console.log(`   Tabel gallery_images : ${tableOk  ? "✅ OK" : "❌ Perlu dibuat manual"}`);
  console.log(`   Bucket storage       : ${bucketOk ? "✅ OK" : "❌ Perlu dibuat manual"}`);
  console.log("═".repeat(60));

  if (!tableOk || !bucketOk) {
    console.log("\n📌 Langkah selanjutnya:");
    if (!tableOk) {
      console.log("   1. Buka https://supabase.com/dashboard");
      console.log("   2. Pilih project rajadigital");
      console.log("   3. Klik SQL Editor > New Query");
      console.log("   4. Copy-paste SQL di atas, lalu Run");
    }
    if (!bucketOk) {
      console.log("   5. Klik Storage > New Bucket");
      console.log("   6. Name: gallery, centang Public, Save");
    }
  } else {
    console.log("\n🎉 Setup selesai! Fitur upload gallery siap digunakan.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
