"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gem, Coins, TrendingUp, Zap, Search, LayoutGrid, List, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getGameCategories } from "@/lib/games";
import { useGames } from "@/hooks/useGames";
import type { Game } from "@/lib/games";
import type { Product } from "@/types";

/* ── Warna per kategori (fallback jika bukan primary) ─────────── */
const CAT_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  diamond: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
  koin: { color: "#a78bfa", bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.3)" },
  uc: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
  voucher: { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
  chip: { color: "#fb923c", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)" },
};

function getCatStyle(key: string, game: Game) {
  if (CAT_COLORS[key.toLowerCase()]) return CAT_COLORS[key.toLowerCase()];
  // fallback: gunakan warna game
  return { color: game.color, bg: `${game.color}18`, border: `${game.color}40` };
}

function getCatIcon(key: string) {
  const k = key.toLowerCase();
  if (k === "diamond" || k === "uc") return <Gem size={18} />;
  return <Coins size={18} />;
}

export default function PricelistPage() {
  const { games: GAMES, loading: gamesLoading } = useGames();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Set game pertama setelah data tersedia
  useEffect(() => {
    if (GAMES.length > 0 && !activeGame) setActiveGame(GAMES[0]);
  }, [GAMES, activeGame]);

  /* ── Fetch produk per game ─────────────────── */
  const fetchProducts = useCallback(async (gameName: string) => {
    setLoading(true);
    setSearchQuery("");
    setExpandedCats(new Set()); // reset saat ganti game
    try {
      const res = await fetch(`/api/products?game=${encodeURIComponent(gameName)}`);
      const data = await res.json();
      // Sort by price ascending (cheapest first)
      const sorted = (data.products ?? []).sort((a: Product, b: Product) => (a.price ?? 0) - (b.price ?? 0));
      setProducts(sorted);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeGame) fetchProducts(activeGame.name);
  }, [activeGame, fetchProducts]);


  /* ── Semua kategori yang didukung game ini ───── */
  const gameCategories = activeGame ? getGameCategories(activeGame) : [];

  /* ── Filter by search ───────────────────────── */
  const searched = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      String(p.amount ?? "").toLowerCase().includes(q)
    );
  });

  /* ── Group produk per kategori game ─────────── */
  // Setiap kategori yang terdaftar di game => satu section
  const grouped: { catKey: string; catLabel: string; catIcon: string; items: Product[] }[] =
    gameCategories.map(({ key, label, icon }) => ({
      catKey: key,
      catLabel: label,
      catIcon: icon,
      items: searched.filter((p) => p.category?.toLowerCase() === key.toLowerCase()),
    })).filter((g) => g.items.length > 0);

  // Produk dengan kategori tak dikenal (tidak cocok satupun) → tampilkan di grup "Lainnya"
  const knownKeys = new Set(gameCategories.map((c) => c.key.toLowerCase()));
  const others = searched.filter((p) => !knownKeys.has((p.category ?? "").toLowerCase()));
  if (others.length > 0) {
    grouped.push({ catKey: "lainnya", catLabel: "Lainnya", catIcon: "📦", items: others });
  }

  /* ── Toggle accordion (Set = yang TERBUKA, default kosong = semua collapse) ── */
  const toggleCat = (catKey: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey); // tutup
      else next.add(catKey);                     // buka
      return next;
    });
  };

  /* ── Render table ──────────────────────────── */
  const renderTable = (items: Product[], catKey: string, catLabel: string, catIcon: string) => {
    if (items.length === 0) return null;
    const { color, bg: bgColor, border } = getCatStyle(catKey, activeGame!);

    // Cari icon kategori dari game categories
    const catMeta = gameCategories.find((c) => c.key.toLowerCase() === catKey.toLowerCase());
    const iconEmoji = catMeta?.icon ?? catIcon;

    // Default: semua collapse (expandedCats kosong = belum ada yang dibuka)
    // Pakai logika: terbuka HANYA JIKA ada di Set "expandedCats"
    const isOpen = expandedCats.has(catKey);

    return (
      <div className="card overflow-hidden mb-6" style={{ transition: "box-shadow 0.2s" }}>
        {/* Table header — klik untuk toggle */}
        <button
          id={`toggle-cat-${catKey}`}
          onClick={() => toggleCat(catKey)}
          className="w-full px-6 py-4 flex items-center justify-between transition-all hover:opacity-80 active:scale-99"
          style={{
            borderBottom: isOpen ? "1px solid var(--border)" : "none",
            background: isOpen ? "transparent" : `${color}06`,
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bgColor, color }}>
              {getCatIcon(catKey)}
            </div>
            <div className="text-left">
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>
                {iconEmoji} {catLabel} — {activeGame?.name}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {isOpen ? `${items.length} paket tersedia` : `${items.length} paket — klik untuk tampilkan`}
              </p>
            </div>
          </div>
          {/* Chevron */}
          <div
            style={{
              color,
              transition: "transform 0.3s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
            }}
          >
            <ChevronDown size={20} />
          </div>
        </button>

        {/* Collapsible body */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: isOpen ? "9999px" : "0px",
            transition: isOpen
              ? "max-height 0.4s ease, opacity 0.3s ease"
              : "max-height 0.3s ease, opacity 0.2s ease",
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="overflow-x-auto">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Paket</th>
                  <th>Jumlah</th>
                  <th>Harga</th>
                  <th>Beli</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr key={p.id} style={p.is_popular ? { background: `${color}05` } : {}}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 500 }}>{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{iconEmoji}</span>
                        <div>
                          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                            {p.name}
                          </span>
                          {p.is_popular && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: "#ef444420", color: "#ef4444" }}
                            >
                              🔥 Populer
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge badge-gold"
                        style={{ background: bgColor, color, border: `1px solid ${border}` }}
                      >
                        {p.amount} {catLabel}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold" style={{ color }}>
                        {formatCurrency(p.price)}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/games/${activeGame?.slug}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 inline-flex items-center gap-1"
                        style={{ background: bgColor, color, border: `1px solid ${border}` }}
                      >
                        <Zap size={11} />
                        Top Up
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Tampilkan loading skeleton saat data game belum siap
  if (!activeGame) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="skeleton h-8 w-48 mx-auto mb-4 rounded-full" />
          <div className="skeleton h-10 w-56 mx-auto mb-2" />
          <div className="skeleton h-4 w-72 mx-auto" />
        </div>
        <div className="card p-4 mb-6">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl" style={{ border: "2px solid var(--border)", background: "var(--bg-secondary)" }}>
                <div className="skeleton w-14 h-14 rounded-xl" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-xs font-semibold"
          style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}
        >
          <TrendingUp size={12} />
          Harga Terbaik &amp; Terupdate
        </div>
        <h1
          className="text-4xl font-black mb-2"
          style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}
        >
          Daftar <span className="gradient-text-gold">Harga</span>
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Harga dapat berubah sewaktu-waktu. Pilih game untuk melihat daftar harga.
        </p>
      </div>

      {/* ── Game Selector ──────────────────────────── */}
      <div className="card p-4 mb-6">
        {/* Header row: label + view toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Pilih Game
          </p>
          {/* Grid / List toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
            <button
              id="view-grid-btn"
              onClick={() => setViewMode("grid")}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
              style={viewMode === "grid"
                ? { background: "rgba(251,191,36,0.2)", color: "#fbbf24" }
                : { color: "var(--text-muted)" }}
              title="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              id="view-list-btn"
              onClick={() => setViewMode("list")}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
              style={viewMode === "list"
                ? { background: "rgba(251,191,36,0.2)", color: "#fbbf24" }
                : { color: "var(--text-muted)" }}
              title="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* ── GRID VIEW: 2 cols mobile, 3 cols tablet, up to 4 desktop ── */}
        {viewMode === "grid" && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            }}
          >
            {GAMES.map((game) => {
              const isActive = activeGame.slug === game.slug;
              return (
                <button
                  key={game.slug}
                  id={`pricelist-game-${game.slug}`}
                  onClick={() => setActiveGame(game)}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  style={isActive
                    ? {
                      background: `${game.color}18`,
                      border: `2px solid ${game.color}70`,
                      boxShadow: `0 4px 20px ${game.color}25`,
                    }
                    : {
                      background: "var(--bg-secondary)",
                      border: "2px solid var(--border)",
                    }}
                >
                  {/* Active dot */}
                  {isActive && (
                    <span
                      className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                      style={{ background: game.color }}
                    />
                  )}
                  {/* Cover image */}
                  <div
                    className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                    style={{
                      boxShadow: isActive ? `0 0 12px ${game.color}50` : "none",
                      border: isActive ? `2px solid ${game.color}60` : "2px solid transparent",
                    }}
                  >
                    <Image src={`${game.cover}?v=${Date.now()}`} alt={game.name} fill unoptimized className="object-cover" sizes="56px" />
                  </div>
                  {/* Name + currency */}
                  <div className="text-center w-full">
                    <div
                      className="text-xs font-bold leading-tight truncate"
                      style={{ color: isActive ? game.color : "var(--text-primary)" }}
                    >
                      {game.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {game.currencyIcon} {game.currency}
                    </div>
                  </div>
                </button>
              );
            })}
            {/* close conditional */}
          </div>
        )}

        {/* ── LIST VIEW: compact horizontal rows ── */}
        {viewMode === "list" && (
          <div className="flex flex-col gap-2">
            {GAMES.map((game) => {
              const isActive = activeGame.slug === game.slug;
              return (
                <button
                  key={game.slug}
                  id={`pricelist-game-list-${game.slug}`}
                  onClick={() => setActiveGame(game)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-98 w-full"
                  style={isActive
                    ? {
                      background: `${game.color}15`,
                      border: `2px solid ${game.color}60`,
                      boxShadow: `0 2px 12px ${game.color}20`,
                    }
                    : {
                      background: "var(--bg-secondary)",
                      border: "2px solid var(--border)",
                    }}
                >
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={`${game.cover}?v=${Date.now()}`} alt={game.name} fill unoptimized className="object-cover" sizes="36px" />
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      className="text-sm font-bold leading-tight"
                      style={{ color: isActive ? game.color : "var(--text-primary)" }}
                    >
                      {game.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {game.currencyIcon} {game.currency}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: game.color }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Search ──────────────────────────────────── */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          id="pricelist-search"
          type="text"
          className="input-styled pl-10"
          placeholder={`Cari paket ${activeGame?.name ?? ""}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Tabel Produk ────────────────────────────── */}
      {loading ? (
        /* Skeleton */
        <div className="card overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="skeleton h-5 w-48 mb-1" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-6" />
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-6 w-24 rounded-full" />
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-7 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : products.length === 0 || searched.length === 0 ? (
        <div
          className="card p-12 text-center"
          style={{ borderStyle: "dashed" }}
        >
          <span className="text-4xl block mb-3">📋</span>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Belum ada produk tersedia"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {searchQuery ? "Coba kata kunci lain" : `Produk ${activeGame.name} belum ditambahkan`}
          </p>
        </div>
      ) : (
        <>
          {grouped.map(({ catKey, catLabel, catIcon, items }) => (
            <div key={`cat-${catKey}`}>
              {renderTable(items, catKey, catLabel, catIcon)}
            </div>
          ))}

          {/* CTA */}
          <div
            className="mt-4 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4"
            style={{
              background: `${activeGame.color}10`,
              border: `1px solid ${activeGame.color}30`,
            }}
          >
            <div>
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                Siap top-up {activeGame.name}?
              </div>
              <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                Proses cepat via WhatsApp admin kami
              </div>
            </div>
            <Link
              href={`/games/${activeGame.slug}`}
              id="pricelist-topup-cta"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: activeGame.color, color: "#0f172a" }}
            >
              <Zap size={16} />
              Top Up {activeGame.name} Sekarang
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
