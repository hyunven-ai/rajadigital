"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Send, CheckCircle, AlertCircle, Loader2, Search, Clock, XCircle, Zap } from "lucide-react";

const BANK_LIST = [
  "BCA", "BNI", "BRI", "Mandiri", "BSI", "CIMB Niaga",
  "Danamon", "Permata", "BTN", "Maybank", "OCBC NISP",
  "Panin Bank", "Bank Jago", "Jenius (BTPN)", "SeaBank",
  "GoPay", "OVO", "DANA", "ShopeePay", "LinkAja",
];

const HARGA_INFO = [
  { label: "Rate Bongkar", value: "Rp 59.000 / 1B", highlight: true },
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  pending:  { label: "Pending",  color: "#f59e0b", icon: Clock },
  diproses: { label: "Diproses", color: "#6366f1", icon: Loader2 },
  selesai:  { label: "Selesai",  color: "#10b981", icon: CheckCircle },
  batal:    { label: "Batal",    color: "#ef4444", icon: XCircle },
};

interface BongkarResult {
  invoice_id: string;
  player_id: string;
  nominal_bongkar: number;
  bank: string;
  nomor_rekening: string;
  nama_rekening: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function BongkarChipPage() {
  const [activeTab, setActiveTab] = useState<"form" | "cek">("form");

  // Form state
  const [form, setForm] = useState({
    game_name: "",
    player_id: "",
    nominal_bongkar: "",
    bank: "",
    nomor_rekening: "",
    nama_rekening: "",
    whatsapp: "",
  });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Daftar game dari API
  const [gameList, setGameList] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/games?limit=100")
      .then(r => r.json())
      .then(d => {
        const names: string[] = (d.games ?? []).map((g: any) => g.name).filter(Boolean);
        setGameList(names.sort());
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!form.game_name) return setError("Pilih game terlebih dahulu.");
    if (!form.player_id.trim()) return setError("Player ID wajib diisi.");
    if (!form.nominal_bongkar) return setError("Nominal bongkar wajib diisi.");
    const nom = parseInt(form.nominal_bongkar);
    if (isNaN(nom) || nom < 1) return setError("Minimal nominal bongkar adalah 1B.");
    if (nom > 40) return setError("Maksimal 40B dalam 1x request.");
    if (!form.bank) return setError("Pilih bank / e-wallet tujuan.");
    if (!form.nomor_rekening.trim()) return setError("Nomor rekening wajib diisi.");
    if (!form.nama_rekening.trim()) return setError("Nama rekening wajib diisi.");
    if (!form.whatsapp.trim()) return setError("Nomor WhatsApp wajib diisi.");

    setLoading(true);
    try {
      const res = await fetch("/api/bongkar-chip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_name:      form.game_name.trim() || undefined,
          player_id: form.player_id.trim(),
          nominal_bongkar: nom,
          bank: form.bank,
          nomor_rekening: form.nomor_rekening.trim(),
          nama_rekening: form.nama_rekening.trim(),
          whatsapp: form.whatsapp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim request");

      const invoiceId = data.request?.invoice_id ?? "-";
      setSuccess(`Request berhasil dikirim! Kode: ${invoiceId}`);

      // Redirect ke WhatsApp dengan format pesan lengkap
      try {
        const waRes  = await fetch("/api/wa-number", { cache: "no-store" });
        const waData = await waRes.json();
        if (waData?.number) {
          const msg =
`🎰 *REQUEST BONGKAR CHIP - RAJA DIGITAL* 🎰

🧾 Invoice ID: *${invoiceId}*
🎮 Game: *${form.game_name}*
🆔 Player ID: *${form.player_id.trim()}*
💰 Nominal Bongkar: *${nom}B*

🏦 Bank / E-Wallet: *${form.bank}*
💳 Nomor Rekening: *${form.nomor_rekening.trim()}*
👤 Nama Rekening: *${form.nama_rekening.trim()}*

📱 Nomor WA: *${form.whatsapp.trim()}*

Mohon proses request bongkar chip saya. Terima kasih! 🙏`;

          const waUrl = `https://wa.me/${waData.number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
          // Reset form dulu sebelum redirect
          setForm({ game_name: "", player_id: "", nominal_bongkar: "", bank: "", nomor_rekening: "", nama_rekening: "", whatsapp: "" });
          window.open(waUrl, "_blank", "noopener,noreferrer");
        }
      } catch {
        // Jika gagal fetch WA, tetap tampilkan success message saja
        setForm({ game_name: "", player_id: "", nominal_bongkar: "", bank: "", nomor_rekening: "", nama_rekening: "", whatsapp: "" });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cek status state
  const [cekQuery, setCekQuery]     = useState("");
  const [cekLoading, setCekLoading] = useState(false);
  const [cekResults, setCekResults] = useState<BongkarResult[] | null>(null);
  const [cekError, setCekError]     = useState("");

  const handleCek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cekQuery.trim()) return;
    setCekError(""); setCekResults(null); setCekLoading(true);
    try {
      const res  = await fetch(`/api/bongkar-chip?search=${encodeURIComponent(cekQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mencari");
      setCekResults(data.requests ?? []);
    } catch (err: any) {
      setCekError(err.message);
    } finally {
      setCekLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", paddingBottom: "100px" }}>
      {/* Hero header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        padding: "40px 20px 50px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "200px", height: "200px", borderRadius: "50%",
          background: "rgba(var(--gold-rgb, 200,150,26), 0.08)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "-40px",
          width: "150px", height: "150px", borderRadius: "50%",
          background: "rgba(99,102,241,0.08)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "80px", height: "80px", borderRadius: "20px",
          background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          marginBottom: "16px",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dzojrrwtr/image/upload/v1778049885/logo-raja-digital-webp_hwu82q.webp"
            alt="Logo"
            style={{ width: "60px", height: "60px", objectFit: "contain", borderRadius: "12px" }}
          />
        </div>

        <h1 style={{
          fontSize: "28px", fontWeight: 900, letterSpacing: "0.05em",
          background: "linear-gradient(135deg, var(--gold-light, #f59e0b), #fff)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "6px",
        }}>
          RAJA DIGITAL
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
          🚀 PUSH YOUR LIMITS, PLAY HARDER 🚀
        </p>
      </div>

      {/* Card container */}
      <div style={{
        maxWidth: "560px", margin: "-30px auto 0",
        padding: "0 16px",
        position: "relative", zIndex: 2,
      }}>
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
            {(["form", "cek"] as const).map(tab => (
              <button key={tab} id={`bongkar-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "18px 12px", fontSize: "14px", fontWeight: 700,
                  border: "none", cursor: "pointer", transition: "all 0.2s",
                  background: activeTab === tab ? "var(--bg-card)" : "var(--bg-secondary)",
                  color: activeTab === tab ? "var(--gold-light, #f59e0b)" : "var(--text-muted)",
                  borderBottom: activeTab === tab ? "2px solid var(--gold-light, #f59e0b)" : "2px solid transparent",
                }}>
                {tab === "form" ? "🎰 Form Bongkar" : "🔍 Cek Status"}
              </button>
            ))}
          </div>

          {/* Tab: Form */}
          {activeTab === "form" && (
          <div>
          {/* Card header */}
          <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px" }}>Form Bongkar</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Baca aturan merchant terlebih dahulu, lalu lengkapi data berikut untuk membuat request{" "}
              <span style={{ color: "var(--gold-light, #f59e0b)", fontWeight: 600 }}>bongkar.</span>
            </p>
          </div>

          {/* Form body */}
          <div style={{ padding: "24px 28px 32px" }}>
            {/* Info boxes */}
            <div style={{
              border: "1px solid var(--border)",
              borderRadius: "14px", marginBottom: "16px", overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "10px" }}>
                  Harga Bongkar
                </p>
                {HARGA_INFO.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: i < HARGA_INFO.length - 1 ? "6px" : 0 }}>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: "13px", fontWeight: 700,
                      color: item.highlight ? "var(--gold-light, #f59e0b)" : "var(--text-secondary)",
                      lineHeight: 1.5 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "6px" }}>
                  Biaya Admin
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Total biaya admin: Rp 0 - Rp2.500
                </p>
              </div>
            </div>

            {/* Success / Error alerts */}
            {success && (
              <div style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                padding: "14px 16px", borderRadius: "12px", marginBottom: "20px",
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
              }}>
                <CheckCircle size={18} style={{ color: "#10b981", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "13px", color: "#10b981", fontWeight: 600 }}>{success}</p>
              </div>
            )}
            {error && (
              <div style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                padding: "14px 16px", borderRadius: "12px", marginBottom: "20px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              }}>
                <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "13px", color: "#ef4444", fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Pilih Game */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Pilih Game
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    id="bongkar-game-name"
                    name="game_name"
                    value={form.game_name}
                    onChange={handleChange}
                    style={{
                      width: "100%", padding: "12px 16px",
                      borderRadius: "12px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: form.game_name ? "var(--text-primary)" : "var(--text-muted)",
                      fontSize: "14px",
                      outline: "none",
                      appearance: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>— Pilih Game —</option>
                    {gameList.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <div style={{
                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                    pointerEvents: "none", color: "var(--text-muted)",
                  }}>▼</div>
                </div>
              </div>

              {/* Player ID */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Player ID
                </label>
                <input
                  id="bongkar-player-id"
                  name="player_id"
                  type="text"
                  placeholder="Masukkan Player ID"
                  value={form.player_id}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--gold-light, #f59e0b)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Nominal Bongkar */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Nominal Bongkar
                </label>
                <input
                  id="bongkar-nominal"
                  name="nominal_bongkar"
                  type="number"
                  min="1"
                  max="40"
                  placeholder="Contoh: 1B"
                  value={form.nominal_bongkar}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--gold-light, #f59e0b)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <p style={{ fontSize: "11px", color: "var(--gold-light, #f59e0b)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  ⚠️ Minimal 1B, maksimal 40B dalam 1x request.
                </p>
              </div>

              {/* Bank */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Bank
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    id="bongkar-bank"
                    name="bank"
                    value={form.bank}
                    onChange={handleChange}
                    style={{
                      width: "100%", padding: "12px 16px",
                      borderRadius: "12px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: form.bank ? "var(--text-primary)" : "var(--text-muted)",
                      fontSize: "14px",
                      outline: "none",
                      appearance: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>Pilih Bank</option>
                    {BANK_LIST.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div style={{
                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                    pointerEvents: "none", color: "var(--text-muted)",
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Nomor Rekening */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Nomor Rekening
                </label>
                <input
                  id="bongkar-nomor-rekening"
                  name="nomor_rekening"
                  type="text"
                  placeholder="Masukkan nomor rekening"
                  value={form.nomor_rekening}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--gold-light, #f59e0b)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Nama Rekening */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Nama Rekening
                </label>
                <input
                  id="bongkar-nama-rekening"
                  name="nama_rekening"
                  type="text"
                  placeholder="Nama sesuai rekening"
                  value={form.nama_rekening}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--gold-light, #f59e0b)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* WhatsApp */}
              <div style={{ marginBottom: "28px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Nomor WhatsApp
                </label>
                <input
                  id="bongkar-whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="Nomor WhatsApp Anda"
                  value={form.whatsapp}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--gold-light, #f59e0b)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  Pastikan nomor WhatsApp aktif untuk konfirmasi pembayaran
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  id="bongkar-submit-btn"
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, minWidth: "180px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "14px 20px", borderRadius: "14px",
                    background: loading
                      ? "rgba(var(--gold-rgb, 200,150,26), 0.5)"
                      : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff", fontWeight: 800, fontSize: "14px",
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(37,99,235,0.4)",
                  }}
                >
                  {loading
                    ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Mengirim...</>
                    : <><Send size={16} /> Kirim Request Bongkar</>
                  }
                </button>

                <Link
                  href="/"
                  id="bongkar-back-btn"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "14px 20px", borderRadius: "14px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)", fontWeight: 700, fontSize: "14px",
                    textDecoration: "none", transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Home size={16} />
                  Kembali ke Beranda
                </Link>
              </div>
            </form>
          </div>
          </div>
          )} {/* end activeTab === "form" */}

          {/* Tab: Cek Status */}
          {activeTab === "cek" && (
          <div style={{ padding: "28px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔍</div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px" }}>Cek Status Bongkar</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Masukkan <strong style={{ color: "var(--gold-light,#f59e0b)" }}>Invoice ID</strong> (BCR-xxx) atau <strong style={{ color: "var(--gold-light,#f59e0b)" }}>Player ID</strong> untuk cek status request.
              </p>
            </div>

            <form onSubmit={handleCek} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input
                id="cek-bongkar-input"
                value={cekQuery}
                onChange={e => setCekQuery(e.target.value)}
                placeholder="Contoh: BCR-XXXXXXXX-XXXX atau Player ID"
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: "12px", fontSize: "14px",
                  background: "var(--bg-secondary)", border: "1.5px solid var(--border)",
                  color: "var(--text-primary)", outline: "none",
                }}
              />
              <button id="cek-bongkar-btn" type="submit" disabled={cekLoading}
                style={{
                  padding: "12px 20px", borderRadius: "12px", fontWeight: 700, fontSize: "14px",
                  background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a",
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                {cekLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} />}
                Cari
              </button>
            </form>

            {/* Error */}
            {cekError && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "14px 16px", borderRadius: "12px", marginBottom: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
                <p style={{ fontSize: "13px", color: "#ef4444" }}>{cekError}</p>
              </div>
            )}

            {/* No results */}
            {cekResults !== null && cekResults.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 16px", borderRadius: "16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={28} style={{ color: "#ef4444", margin: "0 auto 10px" }} />
                <p style={{ fontWeight: 700, color: "#ef4444", marginBottom: "4px" }}>Request Tidak Ditemukan</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Pastikan Invoice ID atau Player ID yang dimasukkan sudah benar.</p>
              </div>
            )}

            {/* Results */}
            {cekResults && cekResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {cekResults.map(r => {
                  const cfg  = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={r.invoice_id} style={{
                      borderRadius: "16px", padding: "16px 18px",
                      background: "var(--bg-secondary)", border: `1.5px solid ${cfg.color}30`,
                    }}>
                      {/* Status badge + invoice */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                        <code style={{ fontSize: "13px", fontFamily: "monospace", color: "#f87171", fontWeight: 700 }}>{r.invoice_id}</code>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                          background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}35`,
                        }}>
                          <Icon size={12} /> {cfg.label}
                        </span>
                      </div>
                      {/* Details grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: "12px" }}>
                        {[
                          { label: "Player ID",      val: r.player_id },
                          { label: "Nominal",         val: `${r.nominal_bongkar}B` },
                          { label: "Bank",            val: r.bank },
                          { label: "Nama Rekening",   val: r.nama_rekening || "-" },
                          { label: "Nomor Rekening",  val: r.nomor_rekening || "-" },
                          { label: "Waktu Dibuat",    val: new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>{item.label}</div>
                            <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                      {/* Status description */}
                      {r.status === "selesai" && (
                        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>
                          ✅ Request bongkar chip telah selesai diproses.
                        </div>
                      )}
                      {r.status === "pending" && (
                        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: "12px", fontWeight: 600 }}>
                          ⏳ Request sedang menunggu diproses oleh admin.
                        </div>
                      )}
                      {r.status === "diproses" && (
                        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", color: "#6366f1", fontSize: "12px", fontWeight: 600 }}>
                          🔄 Request sedang dalam proses pencairan.
                        </div>
                      )}
                      {r.status === "batal" && (
                        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>
                          ❌ Request dibatalkan. Hubungi admin untuk info lebih lanjut.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Back to form */}
            <button onClick={() => setActiveTab("form")} style={{
              marginTop: "24px", width: "100%", padding: "12px", borderRadius: "12px",
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              color: "var(--text-muted)", fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}>
              ← Kembali ke Form Bongkar
            </button>
          </div>
          )} {/* end activeTab === "cek" */}

        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
