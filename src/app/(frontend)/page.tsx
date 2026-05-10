/**
 * HomePage — Server Component
 *
 * Data game di-fetch langsung ke Supabase saat SSR sehingga HTML yang dikirim
 * ke browser sudah berisi konten final. Tidak ada loading → tidak ada CLS.
 *
 * Komponen yang perlu interaktivitas (carousel, dll.) tetap "use client"
 * namun di-import di sini sebagai leaf node sehingga tidak memaksa seluruh
 * halaman menjadi Client Component.
 */
import Link from "next/link";
import { Zap } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import ReviewCarousel from "@/components/ReviewCarousel";
import RunningText from "@/components/RunningText";
import GamesGrid from "@/components/GamesGrid";
import { createServerSupabase } from "@/lib/supabase";
import type { Game } from "@/lib/games";

/** Fetch games server-side — no client fetch, no CLS */
async function fetchGames(): Promise<Game[]> {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      publisher: String(row.publisher ?? ""),
      description: String(row.description ?? ""),
      cover: String(row.cover ?? ""),
      emoji: String(row.emoji ?? "🎮"),
      currency: String(row.currency),
      currencyIcon: String(row.currency_icon ?? "💎"),
      extraCurrencies: (row.extra_currencies ?? []) as Game["extraCurrencies"],
      color: String(row.color ?? "#fbbf24"),
      gradient: String(row.gradient ?? "linear-gradient(135deg,#7c3aed,#4c1d95)"),
      isActive: Boolean(row.is_active ?? true),
      isHot: Boolean(row.is_hot ?? false),
      isNew: Boolean(row.is_new ?? false),
      sortOrder: Number(row.sort_order ?? 0),
    }));
  } catch {
    return [];
  }
}

/** Fetch banners server-side — banner tampil langsung tanpa CLS */
async function fetchBanners() {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  // Paralel fetch: games + banners sekaligus agar tidak double waterfall
  const [games, banners] = await Promise.all([fetchGames(), fetchBanners()]);

  return (
    <div>
      {/* ── Banner Carousel — SSR data, zero CLS ────────────── */}
      <div className="w-full">
        <BannerCarousel initialBanners={banners} />
      </div>

      {/* ── Running Text Ticker ────────────────────── */}
      <RunningText />

      {/* ── Game Catalog ─────────────────────────────── */}
      <section
        id="games"
        className="max-w-6xl mx-auto px-4"
        style={{ contain: "layout", paddingTop: "20px", paddingBottom: "20px" }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}
            >
              Pilih <span className="gradient-text-gold">Game</span>
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {games.length > 0 ? `${games.length} game tersedia` : ""}
            </p>
          </div>
        </div>

        {/*
          Grid dengan min-height stabil = mencegah shift jika data loading edge case.
          Data datang dari SSR, tidak ada loading phase → CLS = 0.
        */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          style={{ minHeight: games.length > 0 ? undefined : "320px" }}
        >
          <GamesGrid games={games} />
        </div>
      </section>

      {/* ── Ulasan Pelanggan ───────────────────────── */}
      <ReviewCarousel />

      {/* ── Keunggulan Kami ───────────────────────────────── */}
      <section
        style={{
          background: "var(--bg-primary)",
          paddingTop: "60px",
          paddingBottom: "0px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow effects */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="max-w-6xl mx-auto px-4" style={{ position: "relative", zIndex: 1 }}>

          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                border: "1px solid rgba(37,99,235,0.5)",
                borderRadius: "999px",
                padding: "6px 18px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#93c5fd",
                background: "rgba(37,99,235,0.1)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Keunggulan Kami
            </span>
          </div>

          {/* Heading */}
          <h2
            className="text-center font-black"
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: "16px",
            }}
          >
            Kenapa{" "}
            <span style={{ color: "#f5c842" }}>Harus</span>
            {" "}Pilih Kami?
          </h2>

          {/* Subtitle */}
          <p
            className="text-center"
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "15px",
              maxWidth: "480px",
              margin: "0 auto 48px",
              lineHeight: 1.7,
            }}
          >
            Kami hadir dengan layanan terbaik untuk pengalaman transaksi yang{" "}
            <span style={{ color: "#f59e0b" }}>aman</span>,{" "}
            <span style={{ color: "#f59e0b" }}>cepat</span>, dan{" "}
            <span style={{ color: "#f59e0b" }}>memuaskan</span>.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Card 1 — 100% Aman */}
            <div className="feature-card">
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "14px",
                  background: "rgba(37,99,235,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 800,
                  fontSize: "18px",
                  color: "#ffffff",
                  marginBottom: "12px",
                }}
              >
                100% Aman &amp; Terpercaya
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.7 }}>
                Transaksi terjamin aman dengan sistem keamanan berlapis dan pembayaran terlindungi.
              </p>
            </div>

            {/* Card 2 — Proses Cepat */}
            <div className="feature-card">
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "14px",
                  background: "rgba(37,99,235,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 800,
                  fontSize: "18px",
                  color: "#ffffff",
                  marginBottom: "12px",
                }}
              >
                Proses Cepat &amp; Instan
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.7 }}>
                Topup otomatis dalam hitungan detik, kapan saja, 24 jam nonstop.
              </p>
            </div>

            {/* Card 3 — Harga Terbaik */}
            <div className="feature-card">
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "14px",
                  background: "rgba(37,99,235,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 800,
                  fontSize: "18px",
                  color: "#ffffff",
                  marginBottom: "12px",
                }}
              >
                Harga Terbaik &amp; Kompetitif
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.7 }}>
                Dapatkan harga paling murah untuk semua game favorit Anda.
              </p>
            </div>
          </div>

          {/* Trust footer */}
          <div className="flex justify-center">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "rgba(255,255,255,0.45)",
                fontSize: "13px",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              Ribuan pelanggan puas telah membuktikannya!
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
