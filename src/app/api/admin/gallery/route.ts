import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

const BUCKET = "gallery";

/* ── GET: list all images ─────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const db    = createServerSupabase();
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") ?? "";
    const q      = searchParams.get("q") ?? "";

    let query = db
      .from("gallery_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (folder) query = query.eq("folder", folder);
    if (q)      query = query.ilike("name", `%${q}%`);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ images: data ?? [] });
  } catch (err) {
    console.error("Gallery GET error:", err);
    return NextResponse.json({ images: [] });
  }
}

/* ── POST: upload image ───────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const form   = await req.formData();
    const file   = form.get("file") as File | null;
    const folder = (form.get("folder") as string) ?? "general";
    const alt    = (form.get("alt")    as string) ?? "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file melebihi 5MB." }, { status: 400 });
    }

    const db        = createServerSupabase();
    const ext       = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const slug      = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const timestamp = Date.now();
    const filePath  = `${folder}/${timestamp}-${slug}.${ext}`;
    const bytes     = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadErr } = await db.storage
      .from(BUCKET)
      .upload(filePath, bytes, { contentType: file.type, upsert: false });

    if (uploadErr) throw uploadErr;

    // Get public URL
    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Save metadata to DB
    const { data: img, error: dbErr } = await db
      .from("gallery_images")
      .insert({
        name:      file.name,
        file_path: filePath,
        url:       publicUrl,
        folder,
        alt:       alt || file.name.replace(/\.[^/.]+$/, ""),
        size:      file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;
    return NextResponse.json({ image: img }, { status: 201 });
  } catch (err: any) {
    console.error("Gallery upload error:", err);
    return NextResponse.json({ error: err?.message ?? "Upload gagal" }, { status: 500 });
  }
}
