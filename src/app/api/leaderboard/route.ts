import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const revalidate = 0;

function getPeriodRange(period: string): { from: string; to: string } {
  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibNow = new Date(now.getTime() + wibOffset);

  let from: Date;
  const to: Date = new Date(wibNow.getTime() - wibOffset);

  if (period === "daily") {
    from = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()) - wibOffset);
  } else if (period === "weekly") {
    const wibStart = new Date(wibNow);
    wibStart.setUTCDate(wibNow.getUTCDate() - 6);
    from = new Date(Date.UTC(wibStart.getUTCFullYear(), wibStart.getUTCMonth(), wibStart.getUTCDate()) - wibOffset);
  } else {
    const wibStart = new Date(wibNow);
    wibStart.setUTCDate(wibNow.getUTCDate() - 29);
    from = new Date(Date.UTC(wibStart.getUTCFullYear(), wibStart.getUTCMonth(), wibStart.getUTCDate()) - wibOffset);
  }

  return { from: from.toISOString(), to: to.toISOString() };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "daily";

    const { from, to } = getPeriodRange(period);
    const db = createServerSupabase();

    // Ambil transaksi sukses — ambil game_name
    const { data: transactions, error } = await db
      .from("transactions")
      .select("game_name, product_price, created_at")
      .eq("status", "selesai")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Agregasi per nama game
    const map: Record<string, {
      game_name: string;
      total: number;
      count: number;
    }> = {};

    for (const tx of transactions ?? []) {
      const gname = tx.game_name?.trim() || "Unknown Game";
      if (!map[gname]) {
        map[gname] = { game_name: gname, total: 0, count: 0 };
      }
      map[gname].total += Number(tx.product_price ?? 0);
      map[gname].count += 1;
    }

    // Urutkan & ambil top 10
    const leaderboard = Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((entry, i) => ({
        rank: i + 1,
        display_name: entry.game_name,
        total_purchase: entry.total,
        transaction_count: entry.count,
        games: [entry.game_name],
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
