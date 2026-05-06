"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, ShoppingCart, CheckCircle, Clock, DollarSign,
  RefreshCw, XCircle, BarChart2, Calendar, Zap,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAlarm } from "@/hooks/useAlarm";
import AlarmControl from "@/components/AlarmControl";

/* ─── Types ─── */
interface Summary {
  total: number; selesai: number; pending: number; batal: number;
  revenue: number; revenueAll: number; todayTotal: number; todayRevenue: number;
}
interface Slot   { label: string; total: number; selesai: number; revenue: number; }
interface StatsData { period: string; summary: Summary; series: Slot[]; maxTotal: number; maxRevenue: number; }
interface RecentTx  { id: string; invoice_id: string; game_id: string; product_name: string; product_price: number; status: string; created_at: string; }

type Period = "day" | "week" | "month";

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending",  color: "#f59e0b" },
  selesai: { label: "Selesai",  color: "#10b981" },
  batal:   { label: "Batal",    color: "#ef4444" },
};

const PERIOD_TABS: { key: Period; label: string; icon: string }[] = [
  { key: "day",   label: "Hari Ini",  icon: "📅" },
  { key: "week",  label: "Minggu Ini", icon: "📆" },
  { key: "month", label: "30 Hari",   icon: "🗓️" },
];

/* ─── SVG Bar Chart ─── */
function BarChart({ series, maxVal, color, height = 140 }: {
  series: { label: string; value: number }[];
  maxVal: number;
  color: string;
  height?: number;
}) {
  const W = 100; // percentage width per bar slot
  const padT = 20; // top padding for value labels
  const padB = 24; // bottom padding for x-axis labels
  const chartH = height - padT - padB;
  const n = series.length;
  const gap = 0.3; // gap ratio between bars

  const allZero = maxVal === 0 || series.every(s => s.value === 0);

  if (allZero) {
    return (
      <div style={{ height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: 28, opacity: 0.3 }}>📊</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Belum ada data untuk periode ini</span>
      </div>
    );
  }

  return (
    <svg width="100%" height={height} style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <line key={pct}
          x1="0%" y1={padT + chartH * (1 - pct)}
          x2="100%" y2={padT + chartH * (1 - pct)}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3"
        />
      ))}

      {series.map((s, i) => {
        const barW = (1 - gap) / n * 100;
        const x = (i / n) * 100 + (gap / 2 / n) * 100;
        const pct = maxVal > 0 ? s.value / maxVal : 0;
        const barH = Math.max(pct * chartH, s.value > 0 ? 4 : 0);
        const y = padT + chartH - barH;
        const isActive = s.value > 0;

        return (
          <g key={i}>
            {/* Bar */}
            <rect
              x={`${x}%`} y={y}
              width={`${barW}%`} height={barH}
              rx={3} ry={3}
              fill={isActive ? color : "rgba(255,255,255,0.04)"}
              opacity={isActive ? 0.9 : 1}
            />
            {/* Value label on top */}
            {isActive && (
              <text
                x={`${x + barW / 2}%`} y={y - 4}
                textAnchor="middle" fontSize={9}
                fill={color} fontWeight="700"
              >
                {s.value}
              </text>
            )}
            {/* X-axis label - show every nth */}
            {(n <= 10 || i % Math.ceil(n / 10) === 0) && (
              <text
                x={`${x + barW / 2}%`} y={height - 4}
                textAnchor="middle" fontSize={8}
                fill="rgba(148,163,184,0.7)"
              >
                {s.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}


/* ─── Mini Donut Chart (SVG) ─── */
function DonutChart({ selesai, pending, batal }: { selesai: number; pending: number; batal: number }) {
  const total = selesai + pending + batal || 1;
  const r = 30, cx = 40, cy = 40, stroke = 12;
  const circ = 2 * Math.PI * r;

  const segments = [
    { val: selesai, color: "#10b981" },
    { val: pending, color: "#f59e0b" },
    { val: batal,   color: "#ef4444" },
  ];

  let offset = 0;
  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const pct  = seg.val / total;
        const dash = pct * circ;
        const el   = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.val > 0 ? seg.color : "transparent"}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset * circ}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        );
        offset += pct;
        return el;
      })}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={11} fontWeight="bold">{total}</text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [period,     setPeriod]     = useState<Period>("week");
  const [statsData,  setStatsData]  = useState<StatsData | null>(null);
  const [recent,     setRecent]     = useState<RecentTx[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [chartMode,  setChartMode]  = useState<"total" | "revenue">("total");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const pendingCount = statsData?.summary.pending ?? 0;
  const getPending   = useCallback(() => pendingCount, [pendingCount]);
  const { config: alarmConfig, updateConfig, testAlarm, unlock } = useAlarm(getPending);

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async (p: Period) => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`/api/admin/stats?period=${p}`),
        fetch(`/api/admin/transactions?limit=8`),
      ]);
      const sd = await sRes.json();
      const td = await tRes.json();
      if (sd && !sd.error) setStatsData(sd);
      if (td.transactions)  setRecent(td.transactions);
      setLastUpdate(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setLoading(true); fetchStats(period); }, [period, fetchStats]);

  /* ── Realtime ── */
  useEffect(() => {
    const ch = supabase.channel("dash-v2")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, (p) => {
        setRecent(prev => [p.new as RecentTx, ...prev.slice(0, 7)]);
        fetchStats(period);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [period, fetchStats]);

  const s = statsData?.summary;

  /* Kartu stat utama */
  const mainCards = s ? [
    { label: "Total Transaksi",  value: s.total,                        icon: ShoppingCart, color: "#a78bfa", sub: `Hari ini: ${s.todayTotal}` },
    { label: "Selesai",          value: s.selesai,                      icon: CheckCircle,  color: "#10b981", sub: `${s.total > 0 ? Math.round(s.selesai / s.total * 100) : 0}% success rate` },
    { label: "Pending",          value: s.pending,                      icon: Clock,        color: "#f59e0b", sub: s.pending > 0 ? "⚠️ Butuh proses" : "Semua beres" },
    { label: "Dibatalkan",       value: s.batal,                        icon: XCircle,      color: "#ef4444", sub: `${s.total > 0 ? Math.round(s.batal / s.total * 100) : 0}% cancel rate` },
    { label: "Revenue (Selesai)",value: formatCurrency(s.revenue),      icon: DollarSign,   color: "#fbbf24", sub: `Hari ini: ${formatCurrency(s.todayRevenue)}`, isCurrency: true },
    { label: "Gross Revenue",    value: formatCurrency(s.revenueAll),   icon: TrendingUp,   color: "#34d399", sub: "Semua status", isCurrency: true },
  ] : [];

  /* Series chart */
  const chartSeries = (statsData?.series ?? []).map(slot => ({
    label:   slot.label,
    value:   chartMode === "total" ? slot.total : slot.revenue,
    selesai: slot.selesai,
  }));
  const maxVal = chartMode === "total"
    ? (statsData?.maxTotal ?? 1)
    : (statsData?.maxRevenue ?? 1);

  /* ════════════════════════════════════════════════ */
  return (
    <div onClick={unlock} onKeyDown={unlock}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Update: {lastUpdate.toLocaleTimeString("id-ID")}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button id="refresh-btn"
            onClick={() => { setLoading(true); fetchStats(period); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <AlarmControl config={alarmConfig} onChange={updateConfig} onTest={testAlarm} pendingCount={pendingCount} />
        </div>
      </div>

      {/* Realtime indicator */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl mb-6 text-xs font-medium w-fit"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Realtime aktif — Data diperbarui otomatis
      </div>

      {/* ── Period Tab Selector ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PERIOD_TABS.map(tab => (
          <button key={tab.key} id={`period-${tab.key}`}
            onClick={() => { setPeriod(tab.key); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={period === tab.key
              ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a", boxShadow: "0 4px 12px rgba(251,191,36,0.3)" }
              : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-xs px-3 py-2 rounded-xl"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <Calendar size={12} />
          {period === "day" ? "Hari ini" : period === "week" ? "7 hari terakhir" : "30 hari terakhir"}
        </div>
      </div>

      {/* ── Stat Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card"><div className="skeleton h-4 w-2/3 mb-3" /><div className="skeleton h-8 w-1/2" /></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {mainCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-4 relative overflow-hidden"
                style={{ borderLeft: `3px solid ${card.color}` }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none -translate-y-4 translate-x-4"
                  style={{ background: `${card.color}12` }} />
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}20` }}>
                    <Icon size={16} style={{ color: card.color }} />
                  </div>
                </div>
                <p className={`font-black ${card.isCurrency ? "text-lg" : "text-3xl"} leading-none mb-1`}
                  style={{ color: card.color, fontFamily: "var(--font-outfit)" }}>
                  {card.value}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{card.sub}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Chart + Donut Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">

        {/* Bar Chart (3/4) */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} style={{ color: "#a78bfa" }} />
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Grafik {period === "day" ? "Per Jam" : period === "week" ? "Per Hari (7 Hari)" : "Per Hari (30 Hari)"}
              </span>
            </div>
            {/* Toggle total/revenue */}
            <div className="flex rounded-lg overflow-hidden text-xs font-semibold"
              style={{ border: "1px solid var(--border)" }}>
              {(["total", "revenue"] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className="px-3 py-1.5 transition-all"
                  style={chartMode === m
                    ? { background: "#fbbf24", color: "#0f172a" }
                    : { background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                  {m === "total" ? "Jumlah" : "Revenue"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 160 }} />
          ) : (
            <div className="relative">
              <BarChart
                series={chartSeries}
                maxVal={maxVal}
                color={chartMode === "total" ? "#a78bfa" : "#fbbf24"}
                height={160}
              />
              {/* Legend */}
              <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#a78bfa" }} />
                  Total transaksi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#fbbf24" }} />
                  Revenue (selesai)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Donut Chart (1/4) */}
        <div className="card p-5 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 self-start">
            <Zap size={14} style={{ color: "#fbbf24" }} />
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Distribusi</span>
          </div>
          {loading ? (
            <div className="skeleton w-20 h-20 rounded-full" />
          ) : (
            <DonutChart selesai={s?.selesai ?? 0} pending={s?.pending ?? 0} batal={s?.batal ?? 0} />
          )}
          <div className="w-full space-y-1.5 text-xs">
            {[
              { label: "Selesai", val: s?.selesai ?? 0, color: "#10b981" },
              { label: "Pending", val: s?.pending ?? 0, color: "#f59e0b" },
              { label: "Batal",   val: s?.batal   ?? 0, color: "#ef4444" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                </div>
                <span className="font-bold" style={{ color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Transaksi Terbaru</h2>
          <a href="/admin/transactions" className="text-xs font-semibold" style={{ color: "#fbbf24" }}>
            Lihat Semua →
          </a>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 flex-1" /><div className="skeleton h-4 w-24" /><div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "var(--text-muted)" }}>
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Invoice ID</th><th>Game ID</th><th>Paket</th>
                  <th>Harga</th><th>Waktu</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => {
                  const sc = STATUS_CFG[t.status] ?? { label: t.status, color: "#94a3b8" };
                  return (
                    <tr key={t.id}>
                      <td><code className="text-xs" style={{ color: "#fbbf24" }}>{t.invoice_id}</code></td>
                      <td><span className="text-sm">{t.game_id}</span></td>
                      <td><span className="font-medium text-sm">{t.product_name}</span></td>
                      <td><span className="font-semibold text-sm">{formatCurrency(t.product_price)}</span></td>
                      <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(t.created_at)}</span></td>
                      <td>
                        <span className="badge text-xs"
                          style={{ background: `${sc.color}20`, color: sc.color, border: `1px solid ${sc.color}40` }}>
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
