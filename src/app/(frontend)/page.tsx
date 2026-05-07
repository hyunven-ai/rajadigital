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
import Link          from "next/link";
import { Zap }       from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import ReviewCarousel from "@/components/ReviewCarousel";
import RunningText    from "@/components/RunningText";
import GamesGrid      from "@/components/GamesGrid";
import { createServerSupabase } from "@/lib/supabase";
import type { Game }  from "@/lib/games";

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
      id:              String(row.id),
      slug:            String(row.slug),
      name:            String(row.name),
      publisher:       String(row.publisher  ?? ""),
      description:     String(row.description ?? ""),
      cover:           String(row.cover       ?? ""),
      emoji:           String(row.emoji       ?? "🎮"),
      currency:        String(row.currency),
      currencyIcon:    String(row.currency_icon ?? "💎"),
      extraCurrencies: (row.extra_currencies ?? []) as Game["extraCurrencies"],
      color:           String(row.color     ?? "#fbbf24"),
      gradient:        String(row.gradient  ?? "linear-gradient(135deg,#7c3aed,#4c1d95)"),
      isActive:        Boolean(row.is_active ?? true),
      isHot:           Boolean(row.is_hot   ?? false),
      isNew:           Boolean(row.is_new   ?? false),
      sortOrder:       Number(row.sort_order ?? 0),
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const games = await fetchGames();

  return (
    <div>
      {/* ── Banner Carousel — tepat di bawah navbar ────── */}
      <div className="w-full">
        <BannerCarousel />
      </div>

      {/* ── Running Text Ticker ────────────────────── */}
      <RunningText />

      {/* ── Game Catalog ─────────────────────────────── */}
      <section id="games" className="max-w-6xl mx-auto px-4 py-14">
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
          Grid dengan min-height yang stabil.
          Karena data datang dari server, tidak ada phase loading →
          tidak ada perubahan tinggi → CLS = 0.
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <GamesGrid games={games} />
        </div>
      </section>

      {/* ── Ulasan Pelanggan ─────────────────────────── */}
      <ReviewCarousel />

      {/* ── Features ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon:  "⚡",
              title: "Proses Instan",
              desc:  "Top-up langsung masuk ke akun game kamu dalam hitungan detik melalui WhatsApp admin.",
              color: "#fbbf24",
            },
            {
              icon:  "🔒",
              title: "100% Aman",
              desc:  "Transaksi terenkripsi dengan invoice unik. Setiap pesanan tercatat dan dapat dilacak.",
              color: "#10b981",
            },
            {
              icon:  "💰",
              title: "Harga Terbaik",
              desc:  "Harga kompetitif tanpa biaya tersembunyi. Promo dan diskon khusus member setia.",
              color: "#a78bfa",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card p-6 text-center hover:border-opacity-100 transition-all"
              style={{ borderColor: `${f.color}30` }}
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-outfit)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
