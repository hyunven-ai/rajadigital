import { NextResponse } from "next/server";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 60;

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ banners: [] });
    }

    const db = createServerSupabase();
    const { data, error } = await db
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ banners: data ?? [] }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("Get banners error:", err);
    return NextResponse.json({ banners: [] });
  }
}
