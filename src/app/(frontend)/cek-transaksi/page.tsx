"use client";

import { useState } from "react";
import {
  Search, FileText, Clock, CheckCircle, XCircle,
  Loader2, Hash, Gamepad2, MessageCircle, RefreshCw,
  Package, Calendar, Smartphone, AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  invoice_id: string;
  game_id: string;
  whatsapp?: string;
  product_name: string;
  product_price: number;
  status: "pending" | "selesai" | "batal";
  is_processed: boolean;
  created_at: string;
}

const STATUS_CONFIG = {
  pending: {
    label:    "Sedang Diproses",
    sublabel: "Pesanan diterima, admin sedang memproses",
    icon:     Clock,
    color:    "#f59e0b",
    bg:       "rgba(245,158,11,0.1)",
    border:   "rgba(245,158,11,0.3)",
    emoji:    "⏳",
  },
  selesai: {
    label:    "Selesai",
    sublabel: "Pesanan telah berhasil dikirimkan",
    icon:     CheckCircle,
    color:    "#10b981",
    bg:       "rgba(16,185,129,0.1)",
    border:   "rgba(16,185,129,0.3)",
    emoji:    "✅",
  },
  batal: {
    label:    "Dibatalkan",
    sublabel: "Pesanan dibatalkan",
    icon:     XCircle,
    color:    "#ef4444",
    bg:       "rgba(239,68,68,0.1)",
    border:   "rgba(239,68,68,0.3)",
    emoji:    "❌",
  },
};

// ─── Masking nomor WA ──────────────────────────────────────────────────────
function maskWA(wa: string): string {
  if (!wa || wa.length < 6) return "***";
  return wa.slice(0, 4) + "****" + wa.slice(-3);
}

// ─── Deteksi tipe query ────────────────────────────────────────────────────
function detectQueryType(q: string): "invoice" | "game_id" {
  return q.toUpperCase().startsWith("RDG-") ? "invoice" : "game_id";
}

export default function CekTransaksiPage() {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Transaction[]>([]);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) { setError("Masukkan Invoice ID atau Game ID terlebih dahulu"); return; }
    if (q.length < 3) { setError("Query terlalu pendek, minimal 3 karakter"); return; }

    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);

    try {
      const res  = await fetch(`/api/transactions/${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.status === 404 || !data.transaction) {
        setError("Transaksi tidak ditemukan. Pastikan ID yang kamu masukkan sudah benar.");
      } else if (!res.ok) {
        setError(data.error ?? "Gagal menghubungi server. Coba lagi.");
      } else {
        // API mengembalikan 1 transaksi, wrap ke array
        const tx = data.transaction as Transaction;
        setResults([tx]);
      }
    } catch {
      setError("Koneksi gagal. Periksa jaringan dan coba lagi.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const queryType = detectQueryType(query);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            boxShadow: "0 0 30px rgba(251,191,36,0.35)",
          }}
        >
          <Search size={28} className="text-slate-900" />
        </div>
        <h1
          className="text-3xl font-black mb-2"
          style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}
        >
          Cek <span className="gradient-text-gold">Transaksi</span>
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Lacak status pesanan menggunakan <strong>Invoice ID</strong> atau <strong>Game ID</strong>
        </p>
      </div>

      {/* ── Search Box ──────────────────────────────────── */}
      <div className="card p-6 mb-6">
        {/* Tipe query indicator */}
        {query && (
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={
                queryType === "invoice"
                  ? { background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
                  : { background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }
              }
            >
              {queryType === "invoice" ? <Hash size={11} /> : <Gamepad2 size={11} />}
              {queryType === "invoice" ? "Invoice ID" : "Game ID"}
            </div>
          </div>
        )}

        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
          Invoice ID atau Game ID
        </label>

        <div className="flex gap-3">
          <input
            id="search-input"
            type="text"
            className="input-styled flex-1"
            placeholder="Contoh: RDG-ABC12345-XY atau 123456789"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <button
            id="search-btn"
            onClick={() => handleSearch()}
            disabled={loading}
            className="btn-gold flex items-center gap-2 flex-shrink-0"
            style={{ padding: "12px 20px" }}
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <Search size={16} />}
            Cari
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2 mt-3 p-3 rounded-xl text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
          >
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Transaksi Tidak Ditemukan</div>
              <div className="text-xs mt-0.5 opacity-80">{error}</div>
            </div>
          </div>
        )}

        {/* Quick examples */}
        {!query && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Coba contoh:</span>
            {["RDG-ABC12345-XY", "123456789"].map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); }}
                className="text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontFamily: "monospace",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Hasil Pencarian ─────────────────────────────── */}
      {results.map((tx) => {
        const s = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = s.icon;

        return (
          <div key={tx.id} className="card overflow-hidden mb-4 animate-slide-up">
            {/* Status banner */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}25`, border: `1px solid ${s.border}` }}
                >
                  <StatusIcon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: s.color }}>
                    {s.emoji} {s.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.8 }}>
                    {s.sublabel}
                  </div>
                </div>
              </div>
              {/* Is processed indicator */}
              <div
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={
                  tx.is_processed
                    ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                    : { background: "rgba(245,158,11,0.1)", color: "#f59e0b" }
                }
              >
                {tx.is_processed ? <CheckCircle size={12} /> : <Clock size={12} />}
                {tx.is_processed ? "Sudah Diproses" : "Menunggu Proses"}
              </div>
            </div>

            {/* Detail */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Invoice ID */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(251,191,36,0.1)" }}
                  >
                    <Hash size={14} style={{ color: "#fbbf24" }} />
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Invoice ID</div>
                    <div
                      className="text-sm font-bold font-mono"
                      style={{ color: "#fbbf24" }}
                    >
                      {tx.invoice_id}
                    </div>
                  </div>
                </div>

                {/* Game ID */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.1)" }}
                  >
                    <Gamepad2 size={14} style={{ color: "#a78bfa" }} />
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Game ID</div>
                    <div className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                      {tx.game_id}
                    </div>
                  </div>
                </div>

                {/* Paket */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <Package size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Paket</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {tx.product_name}
                    </div>
                  </div>
                </div>

                {/* Harga */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <FileText size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Total Harga</div>
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(tx.product_price)}
                    </div>
                  </div>
                </div>

                {/* No WA (masked) */}
                {tx.whatsapp && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(37,211,102,0.1)" }}
                    >
                      <Smartphone size={14} style={{ color: "#25D366" }} />
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>No. WhatsApp</div>
                      <div className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                        +{maskWA(tx.whatsapp)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tanggal */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Tanggal Order</div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {formatDate(tx.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status message */}
              {tx.status === "pending" && (
                <div
                  className="mt-5 p-4 rounded-xl text-sm"
                  style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
                >
                  <div className="font-semibold mb-1">⏳ Pesanan dalam antrean</div>
                  <div className="text-xs opacity-80">
                    Admin kami sedang memproses pesananmu. Estimasi proses 5–15 menit.
                    Konfirmasi akan dikirim melalui WhatsApp.
                  </div>
                </div>
              )}

              {tx.status === "selesai" && (
                <div
                  className="mt-5 p-4 rounded-xl text-sm"
                  style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
                >
                  <div className="font-semibold mb-1">✅ Transaksi Berhasil!</div>
                  <div className="text-xs opacity-80">
                    Diamond/Koin sudah masuk ke akun Game ID <strong>{tx.game_id}</strong>.
                    Terima kasih telah berbelanja di RAJA DIGITAL!
                  </div>
                </div>
              )}

              {tx.status === "batal" && (
                <div
                  className="mt-5 p-4 rounded-xl text-sm"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
                >
                  <div className="font-semibold mb-1">❌ Transaksi Dibatalkan</div>
                  <div className="text-xs opacity-80">
                    Pesanan ini telah dibatalkan. Hubungi admin via WhatsApp jika ada pertanyaan.
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div
              className="px-6 py-4 flex flex-col sm:flex-row gap-3"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}
            >
              <button
                onClick={() => handleSearch(query)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold flex-1 transition-all hover:opacity-80"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <RefreshCw size={13} />
                Refresh Status
              </button>

              <a
                href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20tanya%20tentang%20transaksi%20saya%20dengan%20invoice%20ID%3A%20"
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold flex-1 transition-all hover:opacity-80"
                style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366" }}
              >
                <MessageCircle size={13} />
                Hubungi Admin
              </a>
            </div>
          </div>
        );
      })}

      {/* ── Panduan (tampil saat belum search) ─────────── */}
      {!searched && !loading && results.length === 0 && (
        <div className="space-y-4">
          {/* Steps */}
          <div className="card p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              📋 Cara Cek Status Transaksi
            </h3>
            <div className="space-y-3">
              {[
                { step: "1", icon: Hash, text: "Masukkan Invoice ID yang dikirim ke WhatsApp kamu (format: RDG-XXXXX-XX)", color: "#fbbf24" },
                { step: "2", icon: Gamepad2, text: "Atau gunakan Game ID yang kamu pakai saat melakukan order", color: "#a78bfa" },
                { step: "3", icon: Search, text: "Klik tombol Cari atau tekan Enter untuk melihat status", color: "#10b981" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}30` }}
                    >
                      {item.step}
                    </div>
                    <div className="flex items-start gap-2 flex-1">
                      <Icon size={14} style={{ color: item.color, marginTop: 2, flexShrink: 0 }} />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status legend */}
          <div className="card p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Arti Status Transaksi
            </h3>
            <div className="space-y-2.5">
              {Object.values(STATUS_CONFIG).map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: s.bg }}
                    >
                      <Icon size={14} style={{ color: s.color }} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
                      <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>— {s.sublabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state setelah search ──────────────────── */}
      {searched && results.length === 0 && !error && (
        <div
          className="card p-10 text-center"
          style={{ borderStyle: "dashed" }}
        >
          <Search size={40} className="mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
            Tidak ada hasil
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Coba dengan Invoice ID atau Game ID yang lain
          </p>
        </div>
      )}
    </div>
  );
}
