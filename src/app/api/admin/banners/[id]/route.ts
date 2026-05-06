import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

/* ── PATCH update banner ──────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = createServerSupabase();
    const { error } = await db.from("banners").update(body).eq("id", id);
    if (error) throw error;
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
