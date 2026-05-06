import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Map Supabase row (snake_case) → Game object (camelCase) */
function rowToGame(row: Record<string, unknown>) {
  return {
    id:              row.id,
    slug:            row.slug,
    name:            row.name,
    publisher:       row.publisher ?? "",
    description:     row.description ?? "",
    cover:           row.cover ?? "",
    emoji:           row.emoji ?? "🎮",
    currency:        row.currency,
    currencyIcon:    row.currency_icon ?? "💎",
    extraCurrencies: row.extra_currencies ?? [],
    color:           row.color ?? "#fbbf24",
    gradient:        row.gradient ?? "linear-gradient(135deg,#7c3aed,#4c1d95)",
    isActive:        row.is_active ?? true,
    isHot:           row.is_hot ?? false,
    isNew:           row.is_new ?? false,
    sortOrder:       row.sort_order ?? 0,
  };
}

export async function GET() {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const games = (data ?? []).map(rowToGame);
    return NextResponse.json({ games }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[GET /api/games]", err);
    return NextResponse.json({ games: [] });
  }
}
