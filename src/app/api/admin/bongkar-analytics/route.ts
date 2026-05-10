import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const revalidate = 0;

function getDateRange(period: string) {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  if (period === "7d") {
    from = new Date(now); from.setDate(from.getDate() - 6);
  } else if (period === "30d") {
    from = new Date(now); from.setDate(from.getDate() - 29);
  } else {
    // today
    from = new Date(now); from.setHours(0, 0, 0, 0);
  }
  return { from: from.toISOString(), to };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "7d";
    const game   = searchParams.get("game") ?? ""; // filter by game_name
    const { from, to } = getDateRange(period);

    const db = createServerSupabase();
    let query = db
      .from("bongkar_chip_requests")
      .select("id, nominal_bongkar, nominal_pembayaran, bank, player_id, game_name, status, created_at, updated_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true });

    if (game) query = query.eq("game_name", game);

    const { data: rows, error } = await query;

    if (error) throw error;
    const all = rows ?? [];

    /* ── KPI ── */
    const total        = all.length;
    const totalNominal = all.reduce((s, r) => s + (r.nominal_bongkar ?? 0), 0);
    const selesai        = all.filter(r => r.status === "selesai").length;
    const pending        = all.filter(r => r.status === "pending").length;
    const diproses       = all.filter(r => r.status === "diproses").length;
    const batal          = all.filter(r => r.status === "batal").length;
    const nominalSelesai = all.filter(r => r.status === "selesai").reduce((s, r) => s + (r.nominal_bongkar ?? 0), 0);
    const totalPembayaran = all.reduce((s, r) => s + (r.nominal_pembayaran ?? 0), 0);

    /* ── Tren harian ── */
    const dayMap: Record<string, { date: string; requests: number; nominal: number; selesai: number }> = {};
    all.forEach(r => {
      const d = r.created_at.slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { date: d, requests: 0, nominal: 0, selesai: 0 };
      dayMap[d].requests++;
      dayMap[d].nominal += r.nominal_bongkar ?? 0;
      if (r.status === "selesai") dayMap[d].selesai++;
    });
    const dailyTrend = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    /* ── Top Bank ── */
    const bankMap: Record<string, { bank: string; count: number; nominal: number }> = {};
    all.forEach(r => {
      const b = r.bank ?? "Lainnya";
      if (!bankMap[b]) bankMap[b] = { bank: b, count: 0, nominal: 0 };
      bankMap[b].count++;
      bankMap[b].nominal += r.nominal_bongkar ?? 0;
    });
    const topBanks = Object.values(bankMap).sort((a, b) => b.count - a.count).slice(0, 8);

    /* ── Top Player ── */
    const playerMap: Record<string, { player_id: string; count: number; nominal: number }> = {};
    all.forEach(r => {
      const p = r.player_id ?? "-";
      if (!playerMap[p]) playerMap[p] = { player_id: p, count: 0, nominal: 0 };
      playerMap[p].count++;
      playerMap[p].nominal += r.nominal_bongkar ?? 0;
    });
    const topPlayers = Object.values(playerMap).sort((a, b) => b.nominal - a.nominal).slice(0, 10);

    /* ── Status distribution ── */
    const statusDist = [
      { status: "Selesai",  value: selesai,  color: "#10b981" },
      { status: "Pending",  value: pending,  color: "#f59e0b" },
      { status: "Diproses", value: diproses, color: "#6366f1" },
      { status: "Batal",    value: batal,    color: "#ef4444" },
    ];

    /* ── Avg processing time (pending→selesai) ── */
    const processed = all.filter(r => r.status === "selesai" && r.updated_at);
    const avgMs = processed.length > 0
      ? processed.reduce((s, r) => {
          const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
          return s + Math.max(0, diff);
        }, 0) / processed.length
      : 0;
    const avgMinutes = Math.round(avgMs / 60000);

    return NextResponse.json({
      period, from, to, game,
      kpi: { total, totalNominal, selesai, pending, diproses, batal, nominalSelesai, totalPembayaran, avgMinutes },
      dailyTrend,
      topBanks,
      topPlayers,
      statusDist,
    });
  } catch (err) {
    console.error("Bongkar analytics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
