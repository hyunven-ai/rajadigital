"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, ArrowLeft, RefreshCw, Clock, CheckCircle,
  XCircle, Loader2, AlertCircle, BarChart2, Users, Landmark,
} from "lucide-react";

type Period = "today" | "7d" | "30d";

interface KPI {
  total: number; totalNominal: number; selesai: number;
  pending: number; diproses: number; batal: number;
  nominalSelesai: number; totalPembayaran: number; avgMinutes: number;
}
interface DayTrend { date: string; requests: number; nominal: number; selesai: number; }
interface BankStat { bank: string; count: number; nominal: number; }
interface PlayerStat { player_id: string; count: number; nominal: number; }
interface StatusDist { status: string; value: number; color: string; }

interface AnalyticsData {
  kpi: KPI;
  dailyTrend: DayTrend[];
  topBanks: BankStat[];
  topPlayers: PlayerStat[];
  statusDist: StatusDist[];
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hari Ini", "7d": "7 Hari", "30d": "30 Hari",
};

const CHART_COLORS = {
  primary:  "#fbbf24",
  selesai:  "#10b981",
  pending:  "#f59e0b",
  diproses: "#6366f1",
  batal:    "#ef4444",
  red:      "#f87171",
};

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: `1px solid ${color}25`,
      borderRadius: 16, padding: "20px 22px",
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-outfit, sans-serif)", marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, color: p.color, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
          <strong>{p.value}{p.dataKey === "nominal" ? "B" : ""}</strong>
        </div>
      ))}
    </div>
  );
};

export default function BongkarAnalyticsPage() {
  const [period, setPeriod]   = useState<Period>("7d");
  const [selectedGame, setSelectedGame] = useState("");
  const [gameList, setGameList]         = useState<string[]>([]);
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [activeChart, setActiveChart] = useState<"requests" | "nominal">("requests");

  // Fetch daftar game
  useEffect(() => {
    fetch("/api/games?limit=100")
      .then(r => r.json())
      .then(d => {
        const names: string[] = (d.games ?? []).map((g: any) => g.name).filter(Boolean);
        setGameList(names.sort());
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async (p: Period, game = selectedGame) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ period: p });
      if (game) params.set("game", game);
      const res  = await fetch(`/api/admin/bongkar-analytics?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [selectedGame]);

  useEffect(() => { fetchData(period, selectedGame); }, [fetchData, period, selectedGame]);

  const kpi = data?.kpi;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Link href="/admin/bongkar-chip" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
              <ArrowLeft size={13} /> Bongkar Chip
            </Link>
          </div>
          <h1 style={{ fontSize: "clamp(1.2rem,3vw,1.6rem)", fontWeight: 900, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-outfit,sans-serif)", display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart2 size={24} style={{ color: CHART_COLORS.red }} />
            Analitik Bongkar Chip
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
            Statistik mendalam request bongkar chip
            {selectedGame && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>
                🎮 {selectedGame}
              </span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Game filter dropdown */}
          <div style={{ position: "relative" }}>
            <select
              id="analytics-game-filter"
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
              style={{
                padding: "8px 32px 8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: selectedGame ? "rgba(167,139,250,0.15)" : "var(--bg-secondary)",
                border: selectedGame ? "1px solid rgba(167,139,250,0.5)" : "1px solid var(--border)",
                color: selectedGame ? "#a78bfa" : "var(--text-secondary)",
                outline: "none", cursor: "pointer", appearance: "none",
              }}
            >
              <option value="">🎮 Semua Game</option>
              {gameList.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "var(--text-muted)" }}>▼</span>
          </div>
          {selectedGame && (
            <button onClick={() => setSelectedGame("")}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              ✕ Reset Game
            </button>
          )}
          {/* Period tabs */}
          <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 12, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            {(["today", "7d", "30d"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700, transition: "all 0.2s",
                background: period === p ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "transparent",
                color: period === p ? "#0a0a14" : "var(--text-muted)",
                boxShadow: period === p ? "0 2px 8px rgba(251,191,36,0.3)" : "none",
              }}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button onClick={() => fetchData(period, selectedGame)} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: 20 }}>
          <AlertCircle size={16} style={{ color: "#ef4444" }} />
          <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 100, borderRadius: 16, background: "var(--bg-secondary)", animation: "skeleton-pulse 1.5s ease infinite" }} />
          ))}
        </div>
      )}

      {!loading && kpi && (
        <>
          {/* ── KPI Grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14, marginBottom: 24 }}>
            <KPICard label="Total Request"    value={kpi.total}                          icon={TrendingUp}   color="#a78bfa" />
            <KPICard label="Total Nominal"    value={`${kpi.totalNominal}B`}             icon={BarChart2}    color={CHART_COLORS.red} sub={`${kpi.nominalSelesai}B selesai`} />
            <KPICard label="Total Pembayaran" value={kpi.totalPembayaran > 0 ? `Rp ${kpi.totalPembayaran.toLocaleString("id-ID")}` : "-"} icon={CheckCircle} color="#10b981" sub="nominal transfer ke player" />
            <KPICard label="Selesai"          value={kpi.selesai}                        icon={CheckCircle}  color={CHART_COLORS.selesai} sub={kpi.total ? `${Math.round(kpi.selesai/kpi.total*100)}% sukses` : "-"} />
            <KPICard label="Pending"          value={kpi.pending}                        icon={Clock}        color={CHART_COLORS.pending} />
            <KPICard label="Diproses"         value={kpi.diproses}                       icon={Loader2}      color={CHART_COLORS.diproses} />
            <KPICard label="Batal"            value={kpi.batal}                          icon={XCircle}      color={CHART_COLORS.batal} />
            <KPICard label="Avg. Proses"      value={kpi.avgMinutes > 0 ? `${kpi.avgMinutes} mnt` : "-"} icon={Clock} color="#06b6d4" sub="pending → selesai" />
          </div>

          {/* ── Tren Harian ── */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                📈 Tren Harian
              </h2>
              <div style={{ display: "flex", gap: 6 }}>
                {(["requests", "nominal"] as const).map(c => (
                  <button key={c} onClick={() => setActiveChart(c)} style={{
                    padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontWeight: 700,
                    background: activeChart === c ? CHART_COLORS.primary : "var(--bg-secondary)",
                    color: activeChart === c ? "#0a0a14" : "var(--text-muted)",
                    border: activeChart === c ? "none" : "1px solid var(--border)",
                  }}>
                    {c === "requests" ? "Jumlah" : "Nominal (B)"}
                  </button>
                ))}
              </div>
            </div>

            {data.dailyTrend.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>Belum ada data untuk periode ini</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.dailyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {activeChart === "requests" ? (
                    <>
                      <Bar dataKey="requests" name="Total" fill={CHART_COLORS.red} radius={[4,4,0,0]} />
                      <Bar dataKey="selesai"  name="Selesai" fill={CHART_COLORS.selesai} radius={[4,4,0,0]} />
                    </>
                  ) : (
                    <Bar dataKey="nominal" name="nominal" fill={CHART_COLORS.primary} radius={[4,4,0,0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Row: Status Pie + Top Bank ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 20 }}>

            {/* Pie Chart Status */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px" }}>
                🍩 Distribusi Status
              </h2>
              {data.statusDist.every(s => s.value === 0) ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>Belum ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.statusDist.filter(s => s.value > 0)} dataKey="value" nameKey="status"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      paddingAngle={3} strokeWidth={0}>
                      {data.statusDist.filter(s => s.value > 0).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} request`, name]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Bank */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Landmark size={16} style={{ color: "#06b6d4" }} /> Top Bank / E-Wallet
              </h2>
              {data.topBanks.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, paddingTop: 40 }}>Belum ada data</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.topBanks.map((b, i) => {
                    const maxCount = data.topBanks[0].count;
                    const pct = Math.round((b.count / maxCount) * 100);
                    return (
                      <div key={b.bank}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 18, height: 18, borderRadius: "50%", background: i === 0 ? "#fbbf24" : "var(--bg-secondary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: i === 0 ? "#0a0a14" : "var(--text-muted)" }}>{i+1}</span>
                            {b.bank}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>{b.count}x · {b.nominal}B</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-secondary)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: "linear-gradient(90deg,#06b6d4,#0891b2)", transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Top Players Table ── */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} style={{ color: "#a78bfa" }} />
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Top Player (by Nominal)
              </h2>
            </div>
            {data.topPlayers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>Belum ada data</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                      {["Rank", "Player ID", "Jumlah Request", "Total Nominal", "Rata-rata/Request"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPlayers.map((p, i) => (
                      <tr key={p.player_id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            width: 26, height: 26, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 900,
                            background: i === 0 ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : i === 1 ? "rgba(192,192,192,0.2)" : i === 2 ? "rgba(205,127,50,0.2)" : "var(--bg-secondary)",
                            color: i === 0 ? "#0a0a14" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--text-muted)",
                          }}>#{i+1}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 600, color: "var(--text-primary)" }}>{p.player_id}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{p.count}x</td>
                        <td style={{ padding: "12px 16px", fontWeight: 800, color: CHART_COLORS.red }}>{p.nominal}B</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{(p.nominal / p.count).toFixed(1)}B</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes skeleton-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
