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
    const { title, subtitle, image_url, link_url, link_label, badge_text, is_active, sort_order, show_title } = body;

    if (!title || !image_url) {
      return NextResponse.json({ error: "Judul dan URL gambar wajib diisi" }, { status: 400 });
    }

    const db = createServerSupabase();
    const insertData = {
      title,
      subtitle:    subtitle    ?? null,
      image_url,
      link_url:    link_url    ?? null,
      link_label:  link_label  ?? null,
      badge_text:  badge_text  ?? null,
      is_active:   is_active   ?? true,
      sort_order:  sort_order  ?? 0,
      show_title:  show_title  ?? true,
    };

    let result = await db.from("banners").insert(insertData).select().single();

    // Jika kolom show_title belum ada di DB, coba tanpa field itu
    if (result.error && (result.error.message?.includes("show_title") || result.error.code === "42703")) {
      const { show_title: _s, ...withoutShowTitle } = insertData;
      result = await db.from("banners").insert(withoutShowTitle).select().single();
    }

    if (result.error) throw result.error;
    return NextResponse.json({ banner: result.data }, { status: 201 });
  } catch (err) {
    console.error("Create banner error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

