"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Medal, Crown, RefreshCw, TrendingUp, Calendar, Clock } from "lucide-react";

type Period = "daily" | "weekly" | "monthly";

interface LeaderboardEntry {
  rank: number;
  display_name: string;
  total_purchase: number;
  transaction_count: number;
  games: string[];
}

interface LeaderboardData {
  period: Period;
  from: string;
  to: string;
  updated_at: string;
  leaderboard: LeaderboardEntry[];
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const PERIOD_LABELS: Record<Period, string> = {
  daily:   "Harian",
  weekly:  "Mingguan",
  monthly: "Bulanan",
};

/** Warna & icon per rank */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "linear-gradient(135deg, #FFD700, #FFA500)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 12px rgba(255,215,0,0.5)",
      flexShrink: 0,
    }}>
      <Crown size={18} color="#1a0a00" />
    </div>
  );
  if (rank === 2) return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "linear-gradient(135deg, #C0C0C0, #9E9E9E)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 10px rgba(192,192,192,0.4)",
      flexShrink: 0,
    }}>
      <Medal size={18} color="#1a1a2e" />
    </div>
  );
  if (rank === 3) return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "linear-gradient(135deg, #CD7F32, #A0522D)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 10px rgba(205,127,50,0.4)",
      flexShrink: 0,
    }}>
      <Medal size={18} color="#fff" />
    </div>
  );
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>#{rank}</span>
    </div>
  );
}

/** Avatar placeholder berdasarkan nama */
function Avatar({ name }: { name: string }) {
  const colors = [
    "#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981",
    "#3b82f6","#ef4444","#14b8a6","#f97316","#84cc16",
  ];
  const char = name?.charAt(0)?.toUpperCase() ?? "?";
  const color = colors[char.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, color: "#fff",
      flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}>
      {char}
    </div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data,   setData]   = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${p}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(period); }, [fetchData, period]);

  // Auto-refresh setiap 10 menit
  useEffect(() => {
    const timer = setInterval(() => fetchData(period), 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchData, period]);

  const top3 = data?.leaderboard.slice(0, 3) ?? [];
  const rest  = data?.leaderboard.slice(3) ?? [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #FFD700, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(251,191,36,0.35)",
            }}>
              <Trophy size={22} color="#1a0a00" />
            </div>
            <div>
              <h1 style={{
                fontSize: "clamp(1.2rem,3vw,1.6rem)", fontWeight: 900,
                color: "var(--text-primary)", margin: 0,
                fontFamily: "var(--font-outfit, sans-serif)",
              }}>
                Leaderboard Top 10 Pembelian
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                <RefreshCw size={11} />
                Diperbarui otomatis setiap 10 menit
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} />
              {lastRefresh.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => fetchData(period)}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontSize: 12, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Period Tabs ── */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16,
        padding: "4px", borderRadius: 14,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        width: "fit-content",
      }}>
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: "8px 18px", borderRadius: 10, border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
              transition: "all 0.2s",
              background: period === p
                ? "linear-gradient(135deg, var(--gold-light, #c8961a), var(--amber-light, #f59e0b))"
                : "transparent",
              color: period === p ? "#0a0a14" : "var(--text-muted)",
              boxShadow: period === p ? "0 2px 8px rgba(251,191,36,0.3)" : "none",
            }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Period Info ── */}
      {data && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={11} />
          Periode: {formatDate(data.from)} — {formatDate(data.to)}
        </p>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              height: 64, borderRadius: 14,
              background: "var(--bg-secondary)",
              animation: "skeleton-pulse 1.5s ease infinite",
            }} />
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && data?.leaderboard.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "var(--bg-secondary)", borderRadius: 20,
          border: "1px solid var(--border)",
        }}>
          <TrendingUp size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
          <p style={{ fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>Belum ada data</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Belum ada transaksi sukses pada periode {PERIOD_LABELS[period].toLowerCase()} ini.
          </p>
        </div>
      )}

      {/* ── Top 3 Podium (Desktop) ── */}
      {!loading && top3.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12, marginBottom: 16,
        }}
          className="leaderboard-podium"
        >
          {/* Reorder: 2nd, 1st, 3rd */}
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, visualIdx) => {
            const isFirst = entry.rank === 1;
            const medal = entry.rank === 1
              ? { bg: "linear-gradient(145deg,#FFD700,#FFA500)", glow: "rgba(255,215,0,0.3)", label: "🥇 Juara 1" }
              : entry.rank === 2
              ? { bg: "linear-gradient(145deg,#C0C0C0,#9E9E9E)", glow: "rgba(192,192,192,0.25)", label: "🥈 Juara 2" }
              : { bg: "linear-gradient(145deg,#CD7F32,#A0522D)", glow: "rgba(205,127,50,0.25)", label: "🥉 Juara 3" };
            return (
              <div key={entry.rank} style={{
                borderRadius: 18,
                background: "var(--bg-card, #0f0f1e)",
                border: isFirst ? `2px solid rgba(255,215,0,0.5)` : "1px solid var(--border)",
                padding: "20px 16px",
                textAlign: "center",
                position: "relative",
                transform: isFirst ? "translateY(-8px)" : "none",
                boxShadow: `0 8px 32px ${medal.glow}`,
                order: visualIdx === 0 ? 0 : visualIdx === 1 ? -1 : 1,
              }}>
                {isFirst && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg,#FFD700,#FFA500)",
                    borderRadius: 999, padding: "3px 12px",
                    fontSize: 11, fontWeight: 800, color: "#1a0a00", whiteSpace: "nowrap",
                  }}>
                    👑 CHAMPION
                  </div>
                )}
                {/* Avatar */}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: medal.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 10px",
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  boxShadow: `0 4px 16px ${medal.glow}`,
                }}>
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                  {entry.display_name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>{medal.label}</div>
                <div style={{
                  fontSize: 15, fontWeight: 900,
                  color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : "#CD7F32",
                  marginBottom: 4,
                }}>
                  {formatRupiah(entry.total_purchase)}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  fontSize: 11, color: "var(--text-muted)", fontWeight: 600,
                }}>
                  {entry.transaction_count} transaksi
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table Rank 4–10 ── */}
      {!loading && data && data.leaderboard.length > 0 && (
        <div style={{
          background: "var(--bg-card, #0f0f1e)",
          borderRadius: 20, border: "1px solid var(--border)",
          overflow: "hidden",
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "60px 1fr 150px 100px",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
          }}>
            {["Rank", "User", "Total Pembelian", "Transaksi"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </div>
            ))}
          </div>

          {/* All 10 rows on mobile, rows 4-10 on desktop */}
          {data.leaderboard.map((entry, idx) => {
            const isTop3 = entry.rank <= 3;
            const rankColor = entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "var(--text-muted)";
            return (
              <div
                key={entry.rank}
                className={isTop3 ? "leaderboard-hide-top3-desktop" : ""}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 150px 100px",
                  padding: "14px 20px",
                  borderBottom: idx < data.leaderboard.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                  transition: "background 0.15s",
                  background: isTop3 ? "rgba(251,191,36,0.03)" : "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = isTop3 ? "rgba(251,191,36,0.03)" : "transparent")}
              >
                {/* Rank */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <RankBadge rank={entry.rank} />
                </div>

                {/* User */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={entry.display_name} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.display_name}
                    </div>
                    {entry.games.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.games.slice(0, 2).join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div style={{ fontSize: 14, fontWeight: 800, color: rankColor }}>
                  {formatRupiah(entry.total_purchase)}
                </div>

                {/* Count */}
                <div>
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "3px 10px", borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    fontSize: 12, fontWeight: 700, color: "var(--text-secondary)",
                  }}>
                    {entry.transaction_count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Mobile: sembunyikan podium, tampilkan semua di tabel */
        .leaderboard-podium { display: none; }
        .leaderboard-hide-top3-desktop { display: grid; }

        /* Desktop (>= 640px): tampilkan podium, sembunyikan baris top3 dari tabel */
        @media (min-width: 640px) {
          .leaderboard-podium {
            display: grid !important;
          }
          .leaderboard-hide-top3-desktop {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
