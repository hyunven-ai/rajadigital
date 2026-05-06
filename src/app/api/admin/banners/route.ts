import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

/* ── GET all banners (admin) ──────────────────────────────── */
export async function GET() {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ banners: data ?? [] });
  } catch (err) {
    console.error("Admin get banners:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── POST create banner ───────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, subtitle, image_url, link_url, link_label, badge_text, is_active, sort_order } = body;

    if (!title || !image_url) {
      return NextResponse.json({ error: "Judul dan URL gambar wajib diisi" }, { status: 400 });
    }

    const db = createServerSupabase();
    const { data, error } = await db
      .from("banners")
      .insert({
        title,
        subtitle:    subtitle    ?? null,
        image_url,
        link_url:    link_url    ?? null,
        link_label:  link_label  ?? null,
        badge_text:  badge_text  ?? null,
        is_active:   is_active   ?? true,
        sort_order:  sort_order  ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ banner: data }, { status: 201 });
  } catch (err) {
    console.error("Create banner error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
