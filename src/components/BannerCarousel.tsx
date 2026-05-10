"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  link_label?: string;
  badge_text?: string;
  show_title?: boolean;  // default true — false = full image tanpa overlay
  is_active: boolean;
  sort_order: number;
}

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "fb1",
    title: "Top-Up Game Favoritmu",
    subtitle: "Diamond, UC, Koin dengan harga terbaik. Proses cepat, aman, 24 jam.",
    image_url: "/games/royal-dream.png",
    link_url: "#games",
    link_label: "Top Up Sekarang",
    badge_text: "🔥 Promo Hari Ini",
    is_active: true,
    sort_order: 1,
  },
];

interface Props {
  initialBanners?: Banner[];
}

export default function BannerCarousel({ initialBanners }: Props) {
  const [banners,      setBanners]      = useState<Banner[]>(initialBanners ?? []);
  const [current,     setCurrent]      = useState(0);
  const [isAnimating, setIsAnimating]  = useState(false);
  const [direction,   setDirection]    = useState<"left" | "right">("right");
  const [isPaused,    setIsPaused]     = useState(false);
  // loaded = true jika SSR data sudah ada ATAU client fetch selesai
  const [loaded,      setLoaded]       = useState((initialBanners?.length ?? 0) > 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch (client fallback jika SSR tidak tersedia) ─────────────────── */
  useEffect(() => {
    // Jika sudah ada SSR data, tidak perlu fetch lagi
    if (initialBanners && initialBanners.length > 0) return;
    fetch("/api/banners")
      .then((r) => r.json())
      .then((d) => {
        setBanners(d.banners?.length > 0 ? d.banners : FALLBACK_BANNERS);
        setLoaded(true);
      })
      .catch(() => { setBanners(FALLBACK_BANNERS); setLoaded(true); });
  }, []); // eslint-disable-line

  /* ── Auto-play ─────────────────────────────── */
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { if (!isPaused) goNext(); }, 5000);
  }, [isPaused]); // eslint-disable-line

  useEffect(() => {
    if (banners.length > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners, startTimer]);

  /* ── Navigation ─────────────────────────────── */
  const go = (dir: "left" | "right", idx?: number) => {
    if (isAnimating || banners.length <= 1) return;
    setIsAnimating(true);
    setDirection(dir);
    setTimeout(() => {
      setCurrent((prev) => {
        if (idx !== undefined) return idx;
        return dir === "right"
          ? (prev + 1) % banners.length
          : (prev - 1 + banners.length) % banners.length;
      });
      setIsAnimating(false);
    }, 350);
    startTimer();
  };

  const goNext = () => go("right");
  const goPrev = () => go("left");

  /* ── Skeleton: gunakan SAMA aspect-ratio dengan container ──
     Sehingga browser tidak perlu reflow saat banner muncul  */
  if (!loaded || banners.length === 0) {
    return (
      <div
        className="w-full skeleton"
        style={{
          /*
           * Harus IDENTIK dengan .banner-aspect-container CSS.
           * Gunakan aspect-ratio 16/7 agar tidak ada height diff.
           */
          aspectRatio: "16 / 7",
          width: "100%",
        }}
      />
    );
  }

  const banner = banners[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ boxShadow: "0 6px 30px rgba(0,0,0,0.25)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/*
        ┌─────────────────────────────────────────────────────┐
        │  RESPONSIVE HEIGHT via padding-bottom trick         │
        │  Desktop (≥768px) : 16:5  → paddingBottom 31.25%   │
        │  Mobile  (<768px)  : 16:7  → paddingBottom 43.75%   │
        └─────────────────────────────────────────────────────┘
      */}
      <div
        className="banner-aspect-container"
        style={{ position: "relative" }}
      >
        {/* ── Slide ── */}
        <div
          className="absolute inset-0"
          style={{
            transform: isAnimating
              ? `translateX(${direction === "right" ? "-8%" : "8%"})`
              : "translateX(0)",
            opacity: isAnimating ? 0 : 1,
            transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease",
          }}
        >
          {/*
           * Layer 1: Blur background — SELALU tampil untuk mengisi area kosong
           *   (letter-box dari object-contain). Tidak pernah dimatikan.
           */}
          <Image
            src={banner.image_url}
            alt=""
            fill
            className="object-cover object-center"
            style={{ filter: "blur(28px) brightness(0.35) saturate(1.2)", transform: "scale(1.15)" }}
            sizes="100vw"
            aria-hidden
          />

          {/*
           * Layer 2: Foreground image — object-cover agar mengisi penuh container.
           *   object-position center memastikan subjek utama di tengah tetap terlihat.
           *   Blur background sudah mengisi gap jika ada.
           */}
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover"
            style={{ objectPosition: "center center" }}
            sizes="100vw"
            priority
          />

          {/*
           * Layer 3: Gradient + teks — hanya jika show_title aktif.
           *   show_title=null  (kolom belum ada)  → default true (judul tampil)
           *   show_title=true  → judul tampil
           *   show_title=false → judul disembunyikan, gambar tampil bersih
           */}
          {(banner.show_title ?? true) && (
            <>
              {/* Gradient kiri untuk keterbacaan teks */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(5,3,20,0.88) 0%, rgba(5,3,20,0.60) 38%, rgba(5,3,20,0.15) 65%, transparent 100%)",
                }}
              />
              {/* Gradient bawah untuk mobile */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(5,3,20,0.70) 0%, transparent 40%)",
                }}
              />
              {/* Aksen warna */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 15% 50%, rgba(124,58,237,0.15) 0%, transparent 55%)",
                }}
              />

              {/* Teks konten */}
              <div
                className="banner-content absolute inset-0 flex flex-col justify-end md:justify-center"
                style={{ padding: "clamp(16px, 4vw, 56px)" }}
              >
                {banner.badge_text && (
                  <div
                    className="inline-flex items-center gap-1.5 w-fit text-xs font-bold px-3 py-1 rounded-full mb-2"
                    style={{
                      background: "rgba(251,191,36,0.2)",
                      border: "1px solid rgba(251,191,36,0.45)",
                      color: "#fbbf24",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {banner.badge_text}
                  </div>
                )}

                <h2
                  className="font-black leading-tight mb-2"
                  style={{
                    color: "#ffffff",
                    fontFamily: "var(--font-outfit)",
                    fontSize: "clamp(1rem, 3.5vw, 2.4rem)",
                    maxWidth: "min(60%, 620px)",
                    textShadow: "0 2px 16px rgba(0,0,0,0.6)",
                  }}
                >
                  {banner.title}
                </h2>

                {banner.subtitle && (
                  <p
                    className="hidden sm:block"
                    style={{
                      color: "#cbd5e1",
                      fontSize: "clamp(0.7rem, 1.6vw, 1rem)",
                      maxWidth: "min(55%, 540px)",
                      lineHeight: 1.55,
                      marginBottom: "clamp(8px, 1.5vw, 16px)",
                    }}
                  >
                    {banner.subtitle}
                  </p>
                )}

                {banner.link_url && banner.link_label && (
                  <Link
                    href={banner.link_url}
                    className="btn-gold inline-flex items-center gap-1.5 w-fit"
                    style={{
                      fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)",
                      padding: "clamp(7px, 1.2vw, 11px) clamp(12px, 2vw, 22px)",
                      borderRadius: 10,
                    }}
                  >
                    <Zap size={13} />
                    {banner.link_label}
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Link overlay seluruh area jika show_title=false tapi ada link */}
          {!(banner.show_title ?? true) && banner.link_url && (
            <Link href={banner.link_url} className="absolute inset-0" aria-label={banner.title} />
          )}
        </div>
      </div>

      {/* ── Prev / Next ── */}
      {banners.length > 1 && (
        <>
          {/* Sembunyikan di mobile agar tidak menghalangi konten banner */}
          <button
            id="banner-prev"
            onClick={goPrev}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            id="banner-next"
            onClick={goNext}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* ── Dots ── */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              id={`banner-dot-${i}`}
              onClick={() => go(i > current ? "right" : "left", i)}
              style={{
                /* Fixed width — tidak trigger layout reflow.
                   Efek pill aktif pakai transform:scaleX (GPU, bukan layout). */
                width: 7,
                height: 7,
                borderRadius: 100,
                background: i === current ? "#fbbf24" : "rgba(255,255,255,0.4)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transform: i === current ? "scaleX(3.5)" : "scaleX(1)",
                transformOrigin: "center",
                transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {banners.length > 1 && !isPaused && (
        <div
          className="absolute bottom-0 left-0 h-0.5 z-20"
          style={{
            background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
            animation: "banner-progress 5s linear infinite",
            boxShadow: "0 0 6px rgba(251,191,36,0.5)",
          }}
        />
      )}
    </section>
  );
}
