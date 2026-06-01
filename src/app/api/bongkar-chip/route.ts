import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

/* ── GET: List (admin) or search by invoice/player (public) ── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search    = searchParams.get("search")?.trim() ?? "";
    const status    = searchParams.get("status") ?? "all";
    const limit     = parseInt(searchParams.get("limit")  ?? "100");
    const offset    = parseInt(searchParams.get("offset") ?? "0");
    const date_from = searchParams.get("date_from") ?? null;
    const date_to   = searchParams.get("date_to")   ?? null;

    const db = createServerSupabase();

    /* ── Public search mode ── */
    if (search) {
      // Detect: BCR- prefix = invoice lookup, else = player_id lookup
      const isInvoice = search.toUpperCase().startsWith("BCR-");
      let q = db
        .from("bongkar_chip_requests")
        .select("invoice_id, player_id, nominal_bongkar, bank, nomor_rekening, nama_rekening, status, created_at, updated_at");

      if (isInvoice) q = q.eq("invoice_id", search.toUpperCase());
      else           q = q.eq("player_id", search).order("created_at", { ascending: false }).limit(10);

      const { data, error } = await q;
      if (error) throw error;
      return NextResponse.json({ requests: data ?? [] });
    }

    /* ── Admin list mode ── */
    let q = db
      .from("bongkar_chip_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      if (status.includes(",")) {
        q = q.in("status", status.split(","));
      } else {
        q = q.eq("status", status);
      }
    }
    if (date_from)        q = q.gte("created_at", `${date_from}T00:00:00.000Z`);
    if (date_to)          q = q.lte("created_at", `${date_to}T23:59:59.999Z`);
    q = q.range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    console.error("Get bongkar chip error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


/* ── POST: Submit bongkar chip request (public) ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { player_id, nominal_bongkar, bank, nomor_rekening, nama_rekening, whatsapp, game_name } = body;

    // Validasi
    if (!player_id || !nominal_bongkar || !bank || !nomor_rekening || !nama_rekening || !whatsapp) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const nominalNum = parseInt(String(nominal_bongkar));
    if (isNaN(nominalNum) || nominalNum < 1 || nominalNum > 40) {
      return NextResponse.json(
        { error: "Nominal bongkar minimal 1B, maksimal 40B dalam 1x request" },
        { status: 400 }
      );
    }

    // Generate invoice
    const chars    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rand     = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const invoice_id = `BCR-${rand(8)}-${rand(4)}`;

    const db = createServerSupabase();
    const { data, error } = await db
      .from("bongkar_chip_requests")
      .insert({
        invoice_id,
        game_name:       game_name ? String(game_name).trim() : null,
        player_id:      String(player_id).trim(),
        nominal_bongkar: nominalNum,
        bank:            String(bank).trim(),
        nomor_rekening:  String(nomor_rekening).trim(),
        nama_rekening:   String(nama_rekening).trim(),
        whatsapp:        String(whatsapp).replace(/\D/g, ""),
        status:          "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ request: data }, { status: 201 });
  } catch (err: any) {
    console.error("Bongkar chip submit error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal submit request" }, { status: 500 });
  }
}
