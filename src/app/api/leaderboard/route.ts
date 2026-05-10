import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const revalidate = 0;

function getPeriodRange(period: string): { from: string; to: string } {
  const now = new Date();
  // Gunakan WIB (UTC+7)
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibNow = new Date(now.getTime() + wibOffset);

  let from: Date;
  let to: Date = new Date(wibNow.getTime() - wibOffset); // back to UTC

  if (period === "daily") {
    // Hari ini WIB 00:00 - sekarang
    from = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()) - wibOffset);
  } else if (period === "weekly") {
    // 7 hari terakhir
    const wibStart = new Date(wibNow);
    wibStart.setUTCDate(wibNow.getUTCDate() - 6);
    from = new Date(Date.UTC(wibStart.getUTCFullYear(), wibStart.getUTCMonth(), wibStart.getUTCDate()) - wibOffset);
  } else {
    // 30 hari terakhir
    const wibStart = new Date(wibNow);
    wibStart.setUTCDate(wibNow.getUTCDate() - 29);
    from = new Date(Date.UTC(wibStart.getUTCFullYear(), wibStart.getUTCMonth(), wibStart.getUTCDate()) - wibOffset);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/** Mask nama: "Budi Santoso" → "B***o" */
function maskName(raw: string): string {
  if (!raw || raw.trim().length === 0) return "User";
  const name = raw.trim();
  if (name.length <= 2) return name[0] + "*";
  const first = name[0];
  const last  = name[name.length - 1];
  const stars = "*".repeat(Math.min(name.length - 2, 8));
  return `${first}${stars}${last}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "daily"; // daily | weekly | monthly

    const { from, to } = getPeriodRange(period);
    const db = createServerSupabase();

    // Ambil transaksi sukses dalam periode
    const { data: transactions, error } = await db
      .from("transactions")
      .select("whatsapp, product_price, game_name, product_name, created_at")
      .eq("status", "selesai")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Agregasi per nomor WA
    const map: Record<string, {
      whatsapp: string;
      total: number;
      count: number;
      games: Set<string>;
    }> = {};

    for (const tx of transactions ?? []) {
      const wa = tx.whatsapp ?? "unknown";
      if (!map[wa]) {
        map[wa] = { whatsapp: wa, total: 0, count: 0, games: new Set() };
      }
      map[wa].total += Number(tx.product_price ?? 0);
      map[wa].count += 1;
      if (tx.game_name) map[wa].games.add(tx.game_name);
    }

    // Urutkan & ambil top 10
    const leaderboard = Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((entry, i) => ({
        rank: i + 1,
        display_name: maskName(entry.whatsapp),
        total_purchase: entry.total,
        transaction_count: entry.count,
        games: Array.from(entry.games),
      }));

    return NextResponse.json({
      period,
      from,
      to,
      updated_at: new Date().toISOString(),
      leaderboard,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
