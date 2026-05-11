"use client";

import Link from "next/link";
import { useGames } from "@/hooks/useGames";
import {
  Gamepad2, ShoppingCart, ClipboardList, ScanLine,
  CheckCircle2, Zap, ChevronRight, QrCode, Download,
} from "lucide-react";

const STEPS = [
  {
    num: 1,
    icon: Gamepad2,
    title: "Pilih Game",
    color: "#fbbf24",
    desc: "Pilih game yang ingin kamu top up dari daftar game yang tersedia di halaman utama.",
    detail: "Kami mendukung Mobile Legends, Free Fire, PUBG Mobile, Higgs Domino, dan banyak lagi.",
    badge: null,
  },
  {
    num: 2,
    icon: ShoppingCart,
    title: "Pilih Paket",
    color: "#a78bfa",
    desc: "Pilih nominal Diamond, UC, Koin, Chip, atau Voucher sesuai kebutuhan kamu.",
    detail: "Tersedia berbagai nominal mulai dari yang kecil hingga besar dengan harga terbaik.",
    badge: null,
  },
  {
    num: 3,
    icon: ClipboardList,
    title: "Isi Formulir",
    color: "#34d399",
    desc: "Masukkan Game ID, pilih paket yang diinginkan, dan isi nomor WhatsApp aktif kamu.",
    detail: "Game ID bisa ditemukan di profil game kamu. Nomor WhatsApp digunakan untuk konfirmasi transaksi.",
    badge: "form",
  },
  {
    num: 4,
    icon: CheckCircle2,
    title: "Cek & Konfirmasi Pesanan",
    color: "#fb923c",
    desc: "Klik 'Konfirmasi & Pesan Sekarang' lalu periksa kembali detail pesananmu.",
    detail: "Pastikan Game ID, paket, dan nomor WhatsApp sudah benar sebelum melanjutkan.",
    badge: null,
  },
  {
    num: 5,
    icon: ScanLine,
    title: "Bayar & Selesai",
    color: "#22c55e",
    desc: "Scan QRIS, centang sudah bayar, lalu klik 'Beli Sekarang' — transaksi langsung berhasil!",
    detail: "Tersedia di GoPay, OVO, Dana, ShopeePay, LINK Aja, M-Banking, dan semua aplikasi QRIS lainnya. Kamu bisa upload bukti transfer (opsional). Invoice ID akan muncul otomatis setelah klik Beli Sekarang.",
    badge: "qris",
  },
];

const FAQ = [
  {
    q: "Berapa lama proses top up?",
    a: "Proses top up berlangsung dalam hitungan menit setelah pembayaran dikonfirmasi via WhatsApp. Rata-rata 1–5 menit.",
  },
  {
    q: "Bagaimana jika Game ID saya salah?",
    a: "Kesalahan Game ID sepenuhnya menjadi tanggung jawab pembeli. Pastikan ID benar sebelum konfirmasi.",
  },
  {
    q: "Apakah ada biaya tambahan?",
    a: "Tidak ada biaya tambahan. Harga yang tertera di pricelist adalah harga final termasuk semua biaya.",
  },
  {
    q: "Bagaimana cara scan QRIS?",
    a: "Buka aplikasi GoPay, OVO, Dana, ShopeePay, atau M-Banking. Pilih menu Scan/Pay QR, arahkan kamera ke barcode QRIS. Atau klik Download untuk simpan QR lalu scan dari galeri.",
  },
  {
    q: "Bagaimana jika top up gagal masuk?",
    a: "Hubungi admin WhatsApp segera dengan bukti pembayaran dan invoice ID. Kami akan proses refund atau ulangi top up.",
  },
];

export default function CaraTopUpPage() {
  const { games } = useGames();

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="py-16 md:py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fbbf24 0%, transparent 50%), radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 50%)" }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>
            <Zap size={12} className="animate-pulse" />
            Panduan Lengkap
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Cara <span style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Top Up</span>
          </h1>
          <p className="text-lg mb-3" style={{ color: "#94a3b8" }}>
            Ikuti 5 langkah mudah berikut untuk top up game favoritmu dengan cepat dan aman.
          </p>
          {/* New QRIS badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
            <QrCode size={12} />
            Pembayaran via QRIS — langsung dari modal, tanpa perlu tanya admin!
          </div>
          <br />
          <Link href="/" className="btn-gold inline-flex items-center gap-2 font-bold" style={{ padding: "12px 28px", borderRadius: "12px" }}>
            <Zap size={16} /> Mulai Top Up
          </Link>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="relative">
          {/* Vertical line — 5 steps */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 hidden md:block"
            style={{ background: "linear-gradient(to bottom, #fbbf24, #a78bfa, #34d399, #fb923c, #22c55e)", opacity: 0.3 }} />

          <div className="space-y-6">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.num}
                  className="relative flex gap-6 p-6 rounded-2xl transition-all hover:scale-[1.01]"
                  style={{ background: "var(--bg-card)", border: `1px solid ${step.color}20` }}
                >
                  {/* Step circle */}
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: `${step.color}15`, border: `2px solid ${step.color}40`, boxShadow: `0 0 20px ${step.color}20` }}>
                      <Icon size={24} style={{ color: step.color }} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: step.color, color: "#0f172a" }}>
                      {step.num}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-1" style={{ color: step.color, fontFamily: "var(--font-outfit)" }}>
                      Langkah {step.num} — {step.title}
                    </h2>
                    <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>{step.desc}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.detail}</p>

                    {/* Langkah 3: form fields preview */}
                    {step.badge === "form" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["🎮 Game ID", "📦 Nominal Paket", "📱 No. WhatsApp"].map(f => (
                          <span key={f} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                            style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}30` }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Langkah 5: QRIS info + selesai */}
                    {step.badge === "qris" && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {["📱 GoPay", "💜 OVO", "💙 Dana", "🛍️ ShopeePay", "🏦 M-Banking"].map(m => (
                            <span key={m} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                              style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}30` }}>
                              {m}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
                            <Download size={11} /> Download QR tersedia di modal
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                            ✅ Langsung selesai setelah klik Beli Sekarang!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div className="absolute -bottom-4 left-8 z-10 hidden md:flex w-8 justify-center">
                      <ChevronRight size={16} style={{ color: step.color, transform: "rotate(90deg)", opacity: 0.5 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── QRIS Info Banner ── */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <div className="rounded-2xl p-6 flex items-start gap-4"
          style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(251,191,36,0.08))", border: "1px solid rgba(34,197,94,0.25)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <QrCode size={22} style={{ color: "#22c55e" }} />
          </div>
          <div>
            <h3 className="font-bold mb-1" style={{ color: "#22c55e", fontFamily: "var(--font-outfit)" }}>
              ✅ Transaksi Selesai Otomatis
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              Setelah scan QRIS dan klik <strong className="text-yellow-400">Beli Sekarang</strong>,
              transaksi langsung <strong className="text-white">berhasil dibuat</strong> dan Invoice ID muncul otomatis.
              Tidak perlu konfirmasi ke WhatsApp atau Livechat lagi — admin langsung menerima pesananmu.
            </p>
          </div>
        </div>
      </section>

      {/* ── Payment Method ── */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="card p-6">
          <h2 className="text-xl font-black mb-2" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            💳 Metode Pembayaran
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Pembayaran dilakukan langsung via QRIS di modal pembelian — otomatis dan transparan.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: "📲", label: "QRIS", desc: "GoPay, OVO, Dana, ShopeePay, M-Banking, dan semua aplikasi QRIS lainnya", color: "#22c55e" },
            ].map(pm => (
              <div key={pm.label}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: "var(--bg-secondary)", border: `1px solid ${pm.color}25` }}>
                <span className="text-3xl">{pm.icon}</span>
                <div>
                  <div className="font-bold text-sm" style={{ color: pm.color }}>{pm.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{pm.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Game List ── */}
      {games.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <div className="card p-6">
            <h2 className="text-xl font-black mb-2" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
              🎮 Game Tersedia
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Klik game untuk langsung mulai top up.
            </p>
            <div className="flex flex-wrap gap-3">
              {games.map(g => (
                <Link key={g.slug} href={`/games/${g.slug}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: `${g.color}15`, border: `1px solid ${g.color}40`, color: g.color }}>
                  <span>{g.emoji}</span> {g.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
          ❓ Pertanyaan Umum
        </h2>
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <div key={i} className="card p-5">
              <h3 className="font-bold mb-2" style={{ color: "#fbbf24" }}>Q: {item.q}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>A: {item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="rounded-2xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(124,58,237,0.1))", border: "1px solid rgba(251,191,36,0.2)" }}>
          <div className="text-4xl mb-3">⚡</div>
          <h2 className="text-2xl font-black mb-2 text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            Siap Top Up Sekarang?
          </h2>
          <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
            Proses cepat, bayar via QRIS langsung, dan admin siap 24 jam.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-gold inline-flex items-center justify-center gap-2 font-bold" style={{ padding: "12px 28px", borderRadius: "12px" }}>
              <Zap size={16} /> Pilih Game & Top Up
            </Link>
            <Link href="/pricelist"
              className="inline-flex items-center justify-center gap-2 font-bold text-sm px-7 py-3 rounded-xl transition-all hover:opacity-80"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              📋 Lihat Pricelist
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
