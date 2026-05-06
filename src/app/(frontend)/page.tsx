"use client";


import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import BannerCarousel from "@/components/BannerCarousel";
import ReviewCarousel from "@/components/ReviewCarousel";
import RunningText from "@/components/RunningText";

export default function HomePage() {
  const { games: GAMES, loading: gamesLoading } = useGames();

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
              {GAMES.length > 0 ? `${GAMES.length} game tersedia` : ""}
            </p>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gamesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="aspect-square skeleton" />
                <div className="p-3" style={{ background: "var(--bg-card)" }}>
                  <div className="skeleton h-4 w-3/4 mb-1" />
                  <div className="skeleton h-3 w-1/2 mb-2" />
                  <div className="skeleton h-6 w-full rounded-lg" />
                </div>
              </div>
            ))
            : GAMES.map((game) => (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                id={`game-card-${game.slug}`}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{ border: "1px solid var(--border)" }}
              >
                {/* Cover image */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={`${game.cover}?v=${Date.now()}`}
                    alt={game.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)" }}
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {game.isHot && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#ef4444", color: "#fff" }}
                      >
                        🔥 HOT
                      </span>
                    )}
                    {game.isNew && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#10b981", color: "#fff" }}
                      >
                        ✨ NEW
                      </span>
                    )}
                  </div>

                  {/* Currency badge */}
                  <div className="absolute bottom-2 right-2">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-lg backdrop-blur-sm"
                      style={{
                        background: `${game.color}30`,
                        border: `1px solid ${game.color}60`,
                        color: game.color,
                      }}
                    >
                      {game.currencyIcon} {game.currency}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3" style={{ background: "var(--bg-card)" }}>
                  <div
                    className="font-bold text-sm leading-tight truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {game.name}
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                    {game.publisher}
                  </div>

                  {/* CTA */}
                  <div
                    className="mt-2 text-xs font-semibold text-center py-1.5 rounded-lg transition-all"
                    style={{
                      background: `${game.color}15`,
                      color: game.color,
                      border: `1px solid ${game.color}30`,
                    }}
                  >
                    Top Up →
                  </div>
                </div>
              </Link>
            ))}
          {/* close conditional */}
          {!gamesLoading && GAMES.length === 0 && (
            <div className="col-span-full text-center py-16" style={{ color: "var(--text-muted)" }}>
              <span className="text-4xl block mb-3">🎮</span>
              <p>Belum ada game tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Ulasan Pelanggan ─────────────────────────── */}
      <ReviewCarousel />

      {/* ── Features ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: "Proses Instan",
              desc: "Top-up langsung masuk ke akun game kamu dalam hitungan detik melalui WhatsApp admin.",
              color: "#fbbf24",
            },
            {
              icon: "🔒",
              title: "100% Aman",
              desc: "Transaksi terenkripsi dengan invoice unik. Setiap pesanan tercatat dan dapat dilacak.",
              color: "#10b981",
            },
            {
              icon: "💰",
              title: "Harga Terbaik",
              desc: "Harga kompetitif tanpa biaya tersembunyi. Promo dan diskon khusus member setia.",
              color: "#a78bfa",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card p-6 text-center hover:border-opacity-100 transition-all"
              style={{ borderColor: `${f.color}30` }}
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-outfit)" }}>
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
