"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertTriangle, X, Crown, Zap, Loader2,
  QrCode, CheckCircle2, ArrowRight, Copy, Check, Download, ZoomIn, ZoomOut,
  MessageCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface QrisData {
  id: string;
  label: string;
  image_url: string;
  is_active: boolean;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paidViaQris: boolean) => void;
  gameName: string;
  gameId: string;
  username: string;
  whatsapp: string;
  product: Product | null;
  isLoading?: boolean;
  successInvoiceId?: string | null;
}

const CAT_LABEL: Record<string, string> = {
  diamond: "💎 Diamond", uc: "🪙 UC", koin: "🪙 Koin",
  chip: "🎰 Chip", gold: "🥇 Gold", voucher: "🎫 Voucher",
};

/* ─────────────────────────────────────────────────────────
   SuccessStep — Rincian pesanan + auto-redirect WhatsApp
   ───────────────────────────────────────────────────────── */
function SuccessStep({
  invoiceId, gameName, gameId, username, whatsapp, product,
  copied, onCopy, onClose,
}: {
  invoiceId: string;
  gameName: string;
  gameId: string;
  username: string;
  whatsapp: string;
  product: Product | null;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const [waNumber, setWaNumber] = useState<string>("");
  const hasOpened = useRef(false);

  // Build the pre-filled order message
  const buildMessage = useCallback(() => {
    const paket = product?.amount
      ? `${product.amount}${product.category ? " " + product.category : ""}`.trim()
      : product?.name ?? "-";
    const harga = product ? formatCurrency(product.price) : "-";
    const usernameVal = username || "-";

    return (
      `🛒 *ORDER RAJA DIGITAL* 🛒

🧾 Invoice ID: *${invoiceId}*
🎮 Game: *${gameName}*
🆔 Game ID: *${gameId}*
👤 Nama Pengguna: *${usernameVal}*
🪙 Koin Paket: *${paket}*
💰 Harga: *${harga}*
📱 No. WA: *${whatsapp}*

✅ Pembayaran: Sudah dibayar via QRIS
💰 Nominal: *${harga}*

📸 Mohon lampirkan *bukti pembayaran QRIS* ke chat ini agar pesanan segera diproses.

Terima kasih telah memesan di *RAJA DIGITAL*! 🙏`
    );
  }, [invoiceId, gameName, gameId, username, whatsapp, product]);

  // Buka WhatsApp admin dengan pesan pre-filled
  const openWhatsApp = useCallback((number: string) => {
    const msg = buildMessage();
    const url = `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }, [onClose, buildMessage]);

  // Fetch WA number lalu langsung buka WhatsApp (sekali saja)
  useEffect(() => {
    if (hasOpened.current) return;
    fetch("/api/wa-number", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.number && !hasOpened.current) {
          hasOpened.current = true;
          setWaNumber(d.number);
          openWhatsApp(d.number);
        }
      })
      .catch(() => { });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = [
    { label: "🧾 Invoice", value: invoiceId, isInvoice: true },
    { label: "🎮 Game", value: gameName },
    { label: "🆔 Game ID", value: gameId },
    { label: "👤 Nama Pengguna", value: username || "-" },
    { label: "📱 WhatsApp", value: whatsapp },
    {
      label: "📦 Paket",
      value: product?.amount ? `${product.amount}${product.category ? " " + product.category : ""}`.trim() : product?.name ?? "-",
    },
    { label: "💰 Harga", value: product ? formatCurrency(product.price) : "-", isGold: true },
  ];

  return (
    <div>
      {/* ── Normal success content ── */}
      <div>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <div style={{
            width: "58px", height: "58px", borderRadius: "50%",
            background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", boxShadow: "0 0 24px rgba(16,185,129,0.25)",
          }}>
            <CheckCircle2 size={30} style={{ color: "#10b981" }} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Pesanan Berhasil Dibuat!
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            Simpan rincian berikut sebelum menghubungi admin
          </p>
        </div>

        {/* Order detail table */}
        <div style={{
          borderRadius: "14px", overflow: "hidden",
          border: "1px solid var(--border)", marginBottom: "14px",
        }}>
          {rows.map((row, i) => (
            <div key={row.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "10px", padding: "9px 14px",
              background: i % 2 === 0 ? "var(--bg-secondary)" : "var(--bg-card)",
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
                {row.label}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                {row.isInvoice ? (
                  <>
                    <code style={{
                      fontSize: "12px", fontWeight: 800,
                      background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      letterSpacing: "0.02em",
                    }}>{row.value}</code>
                    <button onClick={onCopy} style={{
                      width: "22px", height: "22px", borderRadius: "6px",
                      background: "rgba(251,191,36,0.15)", border: "none",
                      cursor: "pointer", display: "flex", alignItems: "center",
                      justifyContent: "center", color: "#fbbf24", flexShrink: 0,
                    }}>
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </>
                ) : (
                  <span style={{
                    fontSize: "12px", fontWeight: 700, textAlign: "right", wordBreak: "break-all",
                    color: (row as any).isGold ? "#fbbf24" : "var(--text-primary)",
                  }}>{row.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>



        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            id="success-open-wa-btn"
            onClick={() => { if (waNumber) openWhatsApp(waNumber); else onClose(); }}
            style={{
              width: "100%", padding: "14px", borderRadius: "14px",
              border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#25d366,#128c7e)",
              color: "#fff", fontSize: "15px", fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 20px rgba(37,211,102,0.35)",
            }}
          >
            <MessageCircle size={18} />
            Hubungi Admin WhatsApp
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => { onClose(); }}
            style={{
              width: "100%", padding: "11px", borderRadius: "14px",
              cursor: "pointer", background: "transparent",
              border: "1.5px solid var(--border)",
              color: "var(--text-muted)", fontSize: "13px", fontWeight: 600,
            }}
          >
            Tutup & Kembali
          </button>
        </div>
      </div>
    </div>
  );
}



export default function ConfirmModal({
  isOpen, onClose, onConfirm, gameName, gameId, username, whatsapp, product, isLoading = false, successInvoiceId,
}: ConfirmModalProps) {
  const [qris, setQris] = useState<QrisData | null>(null);
  const [qrisLoading, setQrisLoading] = useState(true);
  // step: "detail" | "qris" | "confirm"
  // If no QRIS active → skip straight to confirm
  const [step, setStep] = useState<"detail" | "qris" | "confirm">("detail");
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) { setStep("detail"); setPaid(false); setZoomed(false); return; }
    setQrisLoading(true);
    // Tambahkan timestamp untuk bust cache browser & Next.js
    fetch(`/api/qris?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setQris(d.qris ?? null))
      .catch(() => setQris(null))
      .finally(() => setQrisLoading(false));
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const catLabel = CAT_LABEL[product.category?.toLowerCase()] ?? product.category;
  const hasQris = !qrisLoading && !!qris;

  const handleNextFromDetail = () => {
    if (hasQris) setStep("qris");
    else setStep("confirm");
  };

  const copyPrice = () => {
    navigator.clipboard.writeText(String(product.price)).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQris = async () => {
    if (!qris) return;
    setDownloading(true);
    try {
      const res = await fetch(qris.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qris-${qris.label.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(qris.image_url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  /* ── Order summary row helper ── */
  const rows = [
    { label: "🎮 Game", value: gameName },
    { label: "🆔 Game ID", value: gameId },
    { label: "👤 Nama Pengguna", value: username || "-" },
    { label: "📱 No. WhatsApp", value: whatsapp },
    { label: "📦 Paket", value: product.name },
    { label: "🏷️ Kategori", value: catLabel },
    { label: "💰 Harga", value: formatCurrency(product.price), gold: true },
  ];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content animate-bounce-in"
        style={{
          maxWidth: 480,
          padding: "24px 24px",
          maxHeight: "min(90dvh, 90vh)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
            >
              {step === "qris" ? (
                <QrCode size={20} className="text-slate-900" />
              ) : (
                <Crown size={20} className="text-slate-900" />
              )}
            </div>
            <div>
              <h2
                className="font-bold text-lg"
                style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}
              >
                {step === "detail" && !successInvoiceId && "Konfirmasi Pesanan"}
                {step === "qris" && !successInvoiceId && "Pembayaran QRIS"}
                {step === "confirm" && !successInvoiceId && "Lanjutkan Pembelian"}
                {successInvoiceId && "Transaksi Berhasil!"}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {!successInvoiceId && step === "detail" && "Periksa detail sebelum melanjutkan"}
                {!successInvoiceId && step === "qris" && "Scan QR lalu konfirmasi pembayaran"}
                {!successInvoiceId && step === "confirm" && "Selesaikan proses pembelian"}
                {successInvoiceId && "Segera kirimkan bukti transfer"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="modal-close-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step indicator (only when QRIS is available) ── */}
        {hasQris && !successInvoiceId && (
          <div className="flex items-center gap-2 mb-5">
            {(["detail", "qris", "confirm"] as const).map((s, i) => {
              const labels = ["4 · Konfirmasi", "5 · Bayar QRIS", "6 · Via WhatsApp"];
              const isDone = ["detail", "qris", "confirm"].indexOf(step) > i;
              const isActive = step === s;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                      style={
                        isDone
                          ? { background: "#10b981", color: "#fff" }
                          : isActive
                            ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }
                            : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                      }
                    >
                      {isDone ? <Check size={12} /> : i + 4}
                    </div>
                    <span
                      className="text-xs font-semibold hidden sm:block"
                      style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
                    >
                      {labels[i]}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className="flex-1 h-px"
                      style={{ background: isDone ? "#10b981" : "var(--border)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 1 — Order Detail
            ══════════════════════════════════════════ */}
        {step === "detail" && !successInvoiceId && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 space-y-3"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              {rows.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {item.label}
                  </span>
                  <span
                    className={`text-sm font-semibold text-right ${item.gold ? "gradient-text-gold" : ""}`}
                    style={{ color: item.gold ? undefined : "var(--text-primary)" }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="disclaimer-box mb-5">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <p className="text-xs leading-relaxed" style={{ color: "#ef4444" }}>
                <strong>⚠️ Disclaimer:</strong> Pastikan ID Game sudah benar sebelum melanjutkan.
                Kesalahan pengisian ID Game di luar tanggung jawab kami dan tidak dapat diproses ulang.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                id="modal-cancel-btn"
                className="flex-1 btn-outline"
                style={{ padding: "12px" }}
              >
                Batalkan
              </button>
              <button
                onClick={handleNextFromDetail}
                id="modal-next-btn"
                disabled={qrisLoading}
                className="flex-1 btn-gold flex items-center justify-center gap-2"
                style={{ padding: "12px" }}
              >
                {qrisLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {hasQris ? <QrCode size={16} /> : <Zap size={16} />}
                    {hasQris ? "Lihat QRIS" : "Beli Sekarang"}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 2 — QRIS Payment
            ══════════════════════════════════════════ */}
        {step === "qris" && qris && !successInvoiceId && (
          <>
            {/* QRIS Barcode card */}
            <div
              className="rounded-2xl mb-4 flex flex-col items-center overflow-hidden"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              {/* Label bar */}
              <div className="w-full flex items-center justify-between px-4 pt-3 pb-2"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  {qris.label || "Scan QR Code untuk membayar"}
                </p>
                <div className="flex items-center gap-1.5">
                  {/* Zoom toggle */}
                  <button
                    onClick={() => setZoomed((z) => !z)}
                    title={zoomed ? "Perkecil" : "Perbesar"}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    {zoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />}
                    {zoomed ? "Kecil" : "Zoom"}
                  </button>
                  {/* Download button */}
                  <button
                    id="qris-download-btn"
                    onClick={downloadQris}
                    disabled={downloading}
                    title="Download QRIS"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    {downloading
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Download size={12} />}
                    Download
                  </button>
                </div>
              </div>

              {/* QR Image — size responds to zoom toggle */}
              <div className="p-3 flex items-center justify-center w-full transition-all duration-300">
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    border: "3px solid #fbbf24",
                    padding: "8px",
                    background: "#fff",
                    width: zoomed ? "100%" : 240,
                    maxWidth: "100%",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qris.image_url}
                    alt="QRIS Barcode"
                    style={{
                      width: "100%",
                      height: zoomed ? "auto" : 240,
                      objectFit: "contain",
                      display: "block",
                      minHeight: zoomed ? 200 : undefined,
                    }}
                  />
                </div>
              </div>

              {/* Total amount */}
              <div
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Total Pembayaran:</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg gradient-text-gold">{formatCurrency(product.price)}</span>
                  <button
                    onClick={copyPrice}
                    title="Salin nominal"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div
              className="rounded-xl p-3 mb-4 text-xs leading-relaxed"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
            >
              📲 Scan QR di atas menggunakan aplikasi GoPay, OVO, Dana, M-Banking, atau aplikasi QRIS lainnya.
              Pastikan nominal sudah sesuai sebelum melanjutkan.
            </div>

            {/* Confirm payment checkbox */}
            <label
              htmlFor="qris-paid-check"
              className="flex items-center gap-3 mb-5 cursor-pointer p-3 rounded-xl transition-all"
              style={{
                background: paid ? "rgba(16,185,129,0.08)" : "var(--bg-secondary)",
                border: paid ? "1.5px solid rgba(16,185,129,0.35)" : "1.5px solid var(--border)",
              }}
            >
              <input
                type="checkbox"
                id="qris-paid-check"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                style={
                  paid
                    ? { background: "#10b981", border: "2px solid #10b981" }
                    : { background: "transparent", border: "2px solid var(--border)" }
                }
              >
                {paid && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm font-semibold" style={{ color: paid ? "#10b981" : "var(--text-secondary)" }}>
                Saya sudah melakukan pembayaran
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("detail")}
                id="modal-back-btn"
                className="flex-1 btn-outline"
                style={{ padding: "12px" }}
              >
                Kembali
              </button>
              <button
                onClick={() => { if (paid) setStep("confirm"); }}
                id="modal-confirm-paid-btn"
                disabled={!paid}
                className="flex-1 btn-gold flex items-center justify-center gap-2"
                style={{ padding: "12px", opacity: paid ? 1 : 0.45, cursor: paid ? "pointer" : "not-allowed" }}
              >
                <CheckCircle2 size={16} />
                Lanjutkan
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 3 — Final Confirm
            ══════════════════════════════════════════ */}
        {step === "confirm" && !successInvoiceId && (
          <>
            {/* Payment confirmed banner */}
            {hasQris && (
              <div
                className="flex items-center gap-3 rounded-xl p-3 mb-4"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#10b981" }}>Pembayaran Dikonfirmasi</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Klik tombol di bawah untuk kirim konfirmasi ke WhatsApp admin
                  </p>
                </div>
              </div>
            )}

            {/* Compact summary */}
            <div
              className="rounded-2xl p-4 mb-4 space-y-2.5"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              {rows.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {item.label}
                  </span>
                  <span
                    className={`text-sm font-semibold text-right ${item.gold ? "gradient-text-gold" : ""}`}
                    style={{ color: item.gold ? undefined : "var(--text-primary)" }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="disclaimer-box mb-5">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <p className="text-xs leading-relaxed" style={{ color: "#ef4444" }}>
                <strong>⚠️ Disclaimer:</strong> Pastikan ID Game sudah benar sebelum melanjutkan.
                Kesalahan pengisian ID Game di luar tanggung jawab kami dan tidak dapat diproses ulang.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(hasQris ? "qris" : "detail")}
                id="modal-back-final-btn"
                disabled={isLoading}
                className="flex-1 btn-outline"
                style={{ padding: "12px" }}
              >
                Kembali
              </button>
              <button
                onClick={() => onConfirm(hasQris && paid)}
                id="modal-confirm-btn"
                disabled={isLoading}
                className="flex-1 btn-gold flex items-center justify-center gap-2"
                style={{ padding: "12px" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Beli Sekarang
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 4 — SUCCESS
            ══════════════════════════════════════════ */}
        {successInvoiceId && (
          <SuccessStep
            invoiceId={successInvoiceId}
            gameName={gameName}
            gameId={gameId}
            username={username}
            whatsapp={whatsapp}
            product={product}
            copied={copied}
            onCopy={() => {
              navigator.clipboard.writeText(successInvoiceId).catch(() => { });
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
