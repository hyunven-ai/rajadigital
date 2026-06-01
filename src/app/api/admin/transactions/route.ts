import { NextRequest, NextResponse } from "next/server";
import { getTransactions, getDashboardStats, createServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status    = searchParams.get("status")    ?? "all";
    const limit     = parseInt(searchParams.get("limit")  ?? "200");
    const offset    = parseInt(searchParams.get("offset") ?? "0");
    const date_from = searchParams.get("date_from") ?? null;   // ISO date "2024-04-21"
    const date_to   = searchParams.get("date_to")   ?? null;

    const db = createServerSupabase();
    let q = db
      .from("transactions")
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
    if (limit)            q = q.limit(limit);
    if (offset)           q = q.range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ transactions: data ?? [], stats: null });
  } catch (err) {
    console.error("Get transactions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


/* ── POST: Buat transaksi manual ─────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { game_id, game_name, username, whatsapp, product_id, product_name, product_price, notes, status } = body;

    // Validasi field wajib
    if (!game_id || !whatsapp || !product_name || !product_price) {
      return NextResponse.json(
        { error: "Field wajib: game_id, whatsapp, product_name, product_price" },
        { status: 400 }
      );
    }

    // Generate invoice ID: RDG-XXXXXXXX-XXXX
    const chars    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rand     = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const invoice_id = `RDG-${rand(8)}-${rand(4)}`;

    const db = createServerSupabase();
    const { data, error } = await db
      .from("transactions")
      .insert({
        invoice_id,
        game_id,
        game_name:     game_name ?? game_id,
        whatsapp:      whatsapp.replace(/\D/g, ""),   // strip non-digits
        product_id:    product_id ?? null,
        product_name,
        product_price: Number(product_price),
        notes:         JSON.stringify({ username: username ?? "", notes: notes ?? "" }),
        status:        status ?? "pending",
        is_processed:  false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (err: any) {
    console.error("Create manual transaction error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal membuat transaksi" }, { status: 500 });
  }
}

