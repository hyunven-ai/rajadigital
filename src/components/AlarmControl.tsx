"use client";

import { useState } from "react";
import { Bell, BellOff, Volume2, Play, ChevronDown } from "lucide-react";
import type { AlarmConfig, AlarmSound } from "@/hooks/useAlarm";

interface Props {
  config: AlarmConfig;
  onChange: (patch: Partial<AlarmConfig>) => void;
  onTest: () => void;
  pendingCount?: number;
}

const INTERVAL_OPTIONS = [
  { value: 1,  label: "Setiap 1 menit"  },
  { value: 2,  label: "Setiap 2 menit"  },
  { value: 3,  label: "Setiap 3 menit"  },
  { value: 5,  label: "Setiap 5 menit"  },
  { value: 10, label: "Setiap 10 menit" },
];

const SOUND_OPTIONS: { value: AlarmSound; label: string; desc: string }[] = [
  { value: "chime",  label: "🎵 Chime",  desc: "3 nada lembut"  },
  { value: "beep",   label: "🔔 Beep",   desc: "Nada tunggal"   },
  { value: "urgent", label: "🚨 Urgent", desc: "3 nada tegas"   },
];

export default function AlarmControl({ config, onChange, onTest, pendingCount = 0 }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Tombol utama */}
      <button
        id="alarm-control-btn"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={
          config.enabled
            ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", color: "#10b981" }
            : { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)", color: "#ef4444" }
        }
      >
        {config.enabled ? <Bell size={15} /> : <BellOff size={15} />}
        Alarm {config.enabled ? "ON" : "OFF"}
        {config.enabled && pendingCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: "#f59e0b", color: "#000" }}
          >
            {pendingCount}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Overlay tutup klik luar */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-2xl p-5 w-80 shadow-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Bell size={15} style={{ color: "#fbbf24" }} />
              Pengaturan Alarm
            </h3>

            {/* Toggle ON/OFF */}
            <div
              className="flex items-center justify-between p-3 rounded-xl mb-4"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Alarm Aktif
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Bunyi saat ada transaksi pending
                </div>
              </div>
              <button
                id="alarm-toggle"
                onClick={() => onChange({ enabled: !config.enabled })}
                className="relative w-12 h-6 rounded-full transition-all"
                style={{
                  background: config.enabled
                    ? "linear-gradient(135deg,#10b981,#059669)"
                    : "var(--bg-primary)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    left: config.enabled ? "calc(100% - 22px)" : "2px",
                    background: config.enabled ? "#fff" : "var(--text-muted)",
                  }}
                />
              </button>
            </div>

            {config.enabled && (
              <>
                {/* Interval */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                    INTERVAL PENGINGAT (jika pending belum diproses)
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {INTERVAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        id={`interval-${opt.value}`}
                        onClick={() => onChange({ intervalMinutes: opt.value })}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left"
                        style={
                          config.intervalMinutes === opt.value
                            ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }
                            : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid transparent" }
                        }
                      >
                        {opt.label}
                        {config.intervalMinutes === opt.value && (
                          <span className="text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jenis suara */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                    JENIS SUARA
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SOUND_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        id={`sound-${opt.value}`}
                        onClick={() => onChange({ sound: opt.value })}
                        className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={
                          config.sound === opt.value
                            ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }
                            : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
                        }
                      >
                        <span className="text-base">{opt.label.split(" ")[0]}</span>
                        <span>{opt.label.split(" ").slice(1).join(" ")}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <Volume2 size={12} />
                    VOLUME — {Math.round(config.volume * 100)}%
                  </label>
                  <input
                    id="alarm-volume"
                    type="range" min={0.1} max={1} step={0.1}
                    value={config.volume}
                    onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
                    className="w-full h-2 rounded-full cursor-pointer accent-yellow-400"
                    style={{ accentColor: "#fbbf24" }}
                  />
                </div>

                {/* Test button */}
                <button
                  id="test-alarm-btn"
                  onClick={() => { onTest(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
                >
                  <Play size={14} />
                  Test Bunyi Sekarang
                </button>
              </>
            )}

            {/* Info pending */}
            {pendingCount > 0 && (
              <div
                className="mt-3 p-3 rounded-xl text-xs"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}
              >
                ⚠️ <strong>{pendingCount}</strong> transaksi pending belum diproses
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
