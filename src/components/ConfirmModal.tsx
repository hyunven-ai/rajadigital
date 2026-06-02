"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, X, Crown, Zap, Loader2,
  QrCode, Copy, Check, CheckCircle2, Download, ZoomIn, ZoomOut,
  ArrowRight, MessageCircle,
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
  onConfirm: (paidViaQris: boolean, paymentProof?: File | null) => void;
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
  const router = useRouter();
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
      {/* Header success */}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", boxShadow: "0 0 30px rgba(16,185,129,0.3)",
          animation: "pulse 2s ease-in-out infinite",
        }}>
          <CheckCircle2 size={32} style={{ color: "#10b981" }} />
        </div>
        <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Transaksi Berhasil Dibuat!
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.5 }}>
          Pesanan kamu sudah kami terima. Tim admin akan memproses top up ke akunmu segera.
        </p>
      </div>

      {/* Success banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 14px", borderRadius: "12px", marginBottom: "14px",
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
      }}>
        <span style={{ fontSize: "20px" }}>✅</span>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", margin: 0 }}>Pembayaran Diterima</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, marginTop: 2 }}>
            Proses top up biasanya selesai dalam 1–5 menit.
          </p>
        </div>
      </div>

      {/* Order detail table */}
      <div style={{
        borderRadius: "14px", overflow: "hidden",
        border: "1px solid var(--border)", marginBottom: "16px",
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
          id="success-close-btn"
          onClick={() => {
            onClose();
            router.push(`/cek-transaksi?q=${encodeURIComponent(invoiceId)}`);
          }}
          style={{
            width: "100%", padding: "14px", borderRadius: "14px",
            border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
            color: "#0f172a", fontSize: "15px", fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: "0 4px 20px rgba(251,191,36,0.35)",
          }}
        >
          <CheckCircle2 size={18} />
          Selesai — Cek Status Transaksi
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}



export default function ConfirmModal({
  isOpen, onClose, onConfirm, gameName, gameId, username, whatsapp, product, isLoading = false, successInvoiceId,
}: ConfirmModalProps) {
  const [qris, setQris] = useState<QrisData | null>(null);
  const [qrisLoading, setQrisLoading] = useState(true);
  // step: "detail" | "qris"
  // If no QRIS active → skip straight to qris (confirm inline)
  const [step, setStep] = useState<"detail" | "qris">("detail");
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep("detail"); setPaid(false); setZoomed(false);
      setPaymentProof(null); setProofPreview(null);
      return;
    }
    setQrisLoading(true);
    fetch(`/api/qris?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setQris(d.qris ?? null))
      .catch(() => setQris(null))
      .finally(() => setQrisLoading(false));
  }, [isOpen]);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPaymentProof(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    } else {
      setProofPreview(null);
    }
  };

  if (!isOpen || !product) return null;

  const catLabel = CAT_LABEL[product.category?.toLowerCase()] ?? product.category;
  const hasQris = !qrisLoading && !!qris;

  const handleNextFromDetail = () => {
    setStep("qris");
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
                {successInvoiceId && "Transaksi Berhasil!"}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {!successInvoiceId && step === "detail" && "Periksa detail sebelum melanjutkan"}
                {!successInvoiceId && step === "qris" && "Scan QR lalu selesaikan pembelian"}
                {successInvoiceId && "Pesanan berhasil dibuat"}
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

        {/* ── Step indicator ── */}
        {!successInvoiceId && (
          <div className="flex items-center gap-2 mb-5">
            {(["detail", "qris"] as const).map((s, i) => {
              const labels = ["3 · Konfirmasi", "4 · Bayar QRIS"];
              const isDone = ["detail", "qris"].indexOf(step) > i;
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
                      {isDone ? <Check size={12} /> : i + 3}
                    </div>
                    <span
                      className="text-xs font-semibold hidden sm:block"
                      style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
                    >
                      {labels[i]}
                    </span>
                  </div>
                  {i < 1 && (
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
            STEP 2 — QRIS Payment (atau langsung confirm jika tidak ada QRIS)
            ══════════════════════════════════════════ */}
        {step === "qris" && !successInvoiceId && (
          <>
            {/* QRIS Barcode card — hanya tampil jika ada QRIS aktif */}
            {qris && (
              <>
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

                  {/* QR Image */}
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
              </>
            )}

            {/* Confirm payment checkbox */}
            <label
              htmlFor="qris-paid-check"
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all mb-4"
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

            {/* Upload bukti transfer (opsional) */}
            <div className="mb-5">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                📸 Bukti Transfer <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
              </p>
              <input
                ref={proofInputRef}
                type="file"
                accept="image/*"
                id="payment-proof-input"
                className="sr-only"
                onChange={handleProofChange}
              />
              {proofPreview ? (
                <div className="relative rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(16,185,129,0.4)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofPreview} alt="Bukti Transfer" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
                  <button
                    onClick={() => { setPaymentProof(null); setProofPreview(null); if (proofInputRef.current) proofInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                  <div className="px-3 py-1.5 text-xs" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                    ✅ {paymentProof?.name}
                  </div>
                </div>
              ) : (
                <button
                  id="upload-proof-btn"
                  onClick={() => proofInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-4 rounded-xl transition-all hover:opacity-80"
                  style={{ border: "1.5px dashed var(--border)", background: "var(--bg-secondary)", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <Download size={20} style={{ opacity: 0.5 }} />
                  <span className="text-xs">Klik untuk upload foto bukti transfer</span>
                </button>
              )}
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
                onClick={() => setStep("detail")}
                id="modal-back-btn"
                className="flex-1 btn-outline"
                style={{ padding: "12px" }}
              >
                Kembali
              </button>
              <button
                onClick={() => { if (paid && paymentProof) onConfirm(hasQris && paid, paymentProof); }}
                id="modal-confirm-btn"
                disabled={!paid || !paymentProof || isLoading}
                className="flex-1 btn-gold flex items-center justify-center gap-2"
                style={{ padding: "12px", opacity: (paid && paymentProof && !isLoading) ? 1 : 0.45, cursor: (paid && paymentProof && !isLoading) ? "pointer" : "not-allowed" }}
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                ) : (
                  <><Zap size={16} /> Beli Sekarang</>
                )}
              </button>
            </div>
          </>
        )}


        {/* ══════════════════════════════════════════
            STEP 3 — SUCCESS
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
