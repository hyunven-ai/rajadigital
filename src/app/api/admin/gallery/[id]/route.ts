import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

const BUCKET = "gallery";

type Params = { params: Promise<{ id: string }> };

/* ── DELETE image ─────────────────────────────────────────── */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = createServerSupabase();

    // Get file_path first
    const { data: img, error: fetchErr } = await db
      .from("gallery_images")
      .select("file_path")
      .eq("id", id)
      .single();

    if (fetchErr || !img) {
      return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 404 });
    }

    // Remove from storage
    await db.storage.from(BUCKET).remove([img.file_path]);

    // Remove from DB
    const { error } = await db.from("gallery_images").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete gallery image:", err);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}

/* ── PATCH: update alt text ───────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const db     = createServerSupabase();

    const { error } = await db
      .from("gallery_images")
      .update({ alt: body.alt, folder: body.folder })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Patch gallery image:", err);
    return NextResponse.json({ error: "Gagal mengupdate" }, { status: 500 });
  }
}
