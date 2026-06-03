import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Map Supabase row → camelCase Game */
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
    currencyImage:   row.currency_image ?? "",
    extraCurrencies: row.extra_currencies ?? [],
    color:           row.color ?? "#fbbf24",
    gradient:        row.gradient ?? "linear-gradient(135deg,#7c3aed,#4c1d95)",
    isActive:        row.is_active ?? true,
    isHot:           row.is_hot ?? false,
    isNew:           row.is_new ?? false,
    sortOrder:       row.sort_order ?? 0,
    rateBongkar:     row.rate_bongkar ?? null,
    tujuanIdBongkar: row.tujuan_id_bongkar ?? null,
  };
}

/** GET /api/admin/games — semua game (termasuk non-aktif) */
export async function GET() {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("games")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ games: (data ?? []).map(rowToGame) });
  } catch (err) {
    console.error("[GET /api/admin/games]", err);
    return NextResponse.json({ games: [] });
  }
}

/** POST /api/admin/games — tambah game baru */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, publisher, description, emoji, currency, currencyIcon,
      extraCurrencies, color, gradient, isActive, isHot, isNew,
      sortOrder, cover, rateBongkar, tujuanIdBongkar,
    } = body;

    if (!name || !currency) {
      return NextResponse.json({ error: "Nama dan mata uang wajib diisi" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const db   = createServerSupabase();

    // Cek duplikat slug
    const { data: existing } = await db.from("games").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Game dengan nama ini sudah ada" }, { status: 409 });
    }

    const { data: countData } = await db.from("games").select("id", { count: "exact", head: true });
    const count = (countData as unknown as number) ?? 0;

    const insert = {
      id:               slug,
      slug,
      name,
      publisher:        publisher ?? "",
      description:      description ?? "",
      cover:            cover ?? `/games/${slug}.png`,
      emoji:            emoji ?? "🎮",
      currency,
      currency_icon:    currencyIcon ?? "💎",
      extra_currencies: extraCurrencies ?? [],
      color:            color ?? "#fbbf24",
      gradient:         gradient ?? "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
      is_active:        isActive ?? true,
      is_hot:           isHot ?? false,
      is_new:           isNew ?? false,
      sort_order:       sortOrder ?? count + 1,
      rate_bongkar:     rateBongkar ?? null,
      tujuan_id_bongkar: tujuanIdBongkar ?? null,
    };

    const { data, error } = await db.from("games").insert(insert).select().single();
    if (error) throw error;

    return NextResponse.json({ game: rowToGame(data as Record<string, unknown>) }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/admin/games]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
