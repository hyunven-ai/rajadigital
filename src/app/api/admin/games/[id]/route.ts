import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/games/[id] — update game */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const db     = createServerSupabase();

    // Map camelCase body → snake_case columns
    const update: Record<string, unknown> = {};
    if (body.name            !== undefined) update.name             = body.name;
    if (body.publisher       !== undefined) update.publisher        = body.publisher;
    if (body.description     !== undefined) update.description      = body.description;
    if (body.cover           !== undefined) update.cover            = body.cover;
    if (body.emoji           !== undefined) update.emoji            = body.emoji;
    if (body.currency        !== undefined) update.currency         = body.currency;
    if (body.currencyIcon    !== undefined) update.currency_icon    = body.currencyIcon;
    if (body.currencyImage   !== undefined) update.currency_image   = body.currencyImage;
    if (body.extraCurrencies !== undefined) update.extra_currencies = body.extraCurrencies;
    if (body.color           !== undefined) update.color            = body.color;
    if (body.gradient        !== undefined) update.gradient         = body.gradient;
    if (body.isActive        !== undefined) update.is_active        = body.isActive;
    if (body.isHot           !== undefined) update.is_hot           = body.isHot;
    if (body.isNew           !== undefined) update.is_new           = body.isNew;
    if (body.sortOrder       !== undefined) update.sort_order       = body.sortOrder;
    if (body.rateBongkar     !== undefined) update.rate_bongkar     = body.rateBongkar;
    if (body.tujuanIdBongkar !== undefined) update.tujuan_id_bongkar = body.tujuanIdBongkar;

    const { data, error } = await db
      .from("games")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ game: data });
  } catch (err) {
    console.error("[PATCH /api/admin/games/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/admin/games/[id] — hapus game */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db     = createServerSupabase();

    const { error } = await db.from("games").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/games/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
