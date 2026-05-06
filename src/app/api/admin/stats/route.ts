import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────────────
   GET /api/admin/stats?period=day|week|month
   Menghitung transaksi & revenue langsung dari tabel
   ───────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const db = createServerSupabase();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "week"; // day | week | month

    /* Tentukan range waktu */
    const now   = new Date();
    const start = new Date(now);

    if (period === "day") {
      start.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else {
      // month: 30 hari terakhir
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    const isoStart = start.toISOString();

    /* Ambil semua transaksi dalam range */
    const { data: txs, error } = await db
      .from("transactions")
      .select("id, product_price, status, created_at")
      .gte("created_at", isoStart)
      .order("created_at", { ascending: true });

    if (error) throw error;
    const rows = txs ?? [];

    /* Hitung totals */
    const total      = rows.length;
    const selesai    = rows.filter(t => t.status === "selesai").length;
    const pending    = rows.filter(t => t.status === "pending").length;
    const batal      = rows.filter(t => t.status === "batal").length;
    const revenue    = rows
      .filter(t => t.status === "selesai")
      .reduce((s, t) => s + Number(t.product_price), 0);
    const revenueAll = rows.reduce((s, t) => s + Number(t.product_price), 0);

    /* Buat series per-slot (untuk chart) */
    const slotMap: Record<string, { label: string; total: number; selesai: number; revenue: number }> = {};

    if (period === "day") {
      // Per-jam (0–23)
      for (let h = 0; h < 24; h++) {
        const label = `${String(h).padStart(2, "0")}:00`;
        slotMap[String(h)] = { label, total: 0, selesai: 0, revenue: 0 };
      }
      rows.forEach(t => {
        const h = new Date(t.created_at).getHours();
        const slot = slotMap[String(h)];
        if (slot) { slot.total++; if (t.status === "selesai") { slot.selesai++; slot.revenue += t.product_price; } }
      });
    } else if (period === "week") {
      // Per-hari (7 hari)
      const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      for (let d = 6; d >= 0; d--) {
        const dt = new Date(now);
        dt.setDate(now.getDate() - d);
        dt.setHours(0, 0, 0, 0);
        const key   = dt.toISOString().slice(0, 10);
        const label = `${DAYS_ID[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}`;
        slotMap[key] = { label, total: 0, selesai: 0, revenue: 0 };
      }
      rows.forEach(t => {
        const key  = t.created_at.slice(0, 10);
        const slot = slotMap[key];
        if (slot) { slot.total++; if (t.status === "selesai") { slot.selesai++; slot.revenue += t.product_price; } }
      });
    } else {
      // Per-hari (30 hari)
      for (let d = 29; d >= 0; d--) {
        const dt = new Date(now);
        dt.setDate(now.getDate() - d);
        dt.setHours(0, 0, 0, 0);
        const key   = dt.toISOString().slice(0, 10);
        const day   = dt.getDate();
        const mon   = dt.getMonth() + 1;
        const label = d % 5 === 0 ? `${day}/${mon}` : "";   // label setiap 5 hari
        slotMap[key] = { label: label || `${day}/${mon}`, total: 0, selesai: 0, revenue: 0 };
      }
      rows.forEach(t => {
        const key  = t.created_at.slice(0, 10);
        const slot = slotMap[key];
        if (slot) { slot.total++; if (t.status === "selesai") { slot.selesai++; slot.revenue += t.product_price; } }
      });
    }

    const series = Object.values(slotMap);
    const maxTotal   = Math.max(...series.map(s => s.total), 1);
    const maxRevenue = Math.max(...series.map(s => s.revenue), 1);

    /* Stats hari ini (untuk perbandingan) */
    const todayStr  = now.toISOString().slice(0, 10);
    const todayRows = rows.filter(t => t.created_at.slice(0, 10) === todayStr);
    const todayTotal   = todayRows.length;
    const todayRevenue = todayRows.filter(t => t.status === "selesai").reduce((s, t) => s + t.product_price, 0);

    return NextResponse.json({
      period,
      summary: { total, selesai, pending, batal, revenue, revenueAll, todayTotal, todayRevenue },
      series,
      maxTotal,
      maxRevenue,
    });
  } catch (err: any) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
