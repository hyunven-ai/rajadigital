import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameName = searchParams.get("game"); // filter optional

    // Jika Supabase tidak dikonfigurasi, kembalikan array kosong (frontend pakai fallback statis)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ products: [] });
    }

    // Gunakan service role agar tidak tergantung RLS anon policy
    const db = createServerSupabase();
    let query = db
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (gameName) {
      query = query.ilike("game_name", gameName);
    }

    const { data, error } = await query;
    if (error) throw error;

    const products: Product[] = data ?? [];

    return NextResponse.json({ products }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("Get public products error:", err);
    return NextResponse.json({ products: [] });
  }
}
