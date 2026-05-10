import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

/* ── PATCH update banner ──────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = createServerSupabase();

    // Whitelist field yang boleh diupdate — hindari error jika kolom belum ada
    const allowed: Record<string, unknown> = {};
    const fields = [
      "title", "subtitle", "image_url", "link_url", "link_label",
      "badge_text", "is_active", "sort_order", "show_title",
    ] as const;
    for (const f of fields) {
      if (f in body) allowed[f] = body[f];
    }

    // show_title: coba simpan, kalau kolom belum ada di DB ignore error gracefully
    let updateData = { ...allowed };
    const { error } = await db.from("banners").update(updateData).eq("id", id);

    if (error) {
      // Jika error karena kolom show_title belum ada, coba tanpa field itu
      if (error.message?.includes("show_title") || error.code === "42703") {
        const { show_title: _, ...withoutShowTitle } = updateData as typeof updateData & { show_title?: unknown };
        const { error: err2 } = await db.from("banners").update(withoutShowTitle).eq("id", id);
        if (err2) throw err2;
      } else {
        throw error;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update banner error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── DELETE banner ────────────────────────────────────────── */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = createServerSupabase();
    const { error } = await db.from("banners").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete banner error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

