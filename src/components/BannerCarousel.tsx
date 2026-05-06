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

export default function BannerCarousel() {
  const [banners,      setBanners]      = useState<Banner[]>([]);
  const [current,     setCurrent]      = useState(0);
  const [isAnimating, setIsAnimating]  = useState(false);
  const [direction,   setDirection]    = useState<"left" | "right">("right");
  const [isPaused,    setIsPaused]     = useState(false);
  const [loaded,      setLoaded]       = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch ─────────────────────────────────── */
  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((d) => {
        setBanners(d.banners?.length > 0 ? d.banners : FALLBACK_BANNERS);
        setLoaded(true);
      })
      .catch(() => { setBanners(FALLBACK_BANNERS); setLoaded(true); });
  }, []);

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

  /* ── Skeleton ─────────────────────────────────
     Gunakan padding-bottom trick agar aspect-ratio
     tetap terjaga saat loading                    */
  if (!loaded || banners.length === 0) {
    return (
      <div className="w-full skeleton" style={{ height: "clamp(280px, 50vw, 560px)" }} />
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
          {/* Background blur — salin gambar sebagai bg supaya tidak hitam polos */}
          <Image
            src={banner.image_url}
            alt=""
            fill
            className="object-cover object-center"
            style={{ filter: "blur(24px) brightness(0.45) saturate(1.4)", transform: "scale(1.1)" }}
            sizes="100vw"
            aria-hidden
          />
          {/* Foreground image fullsize — object-contain agar tidak terpotong */}
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-contain object-center"
            sizes="100vw"
            priority
          />

          {/* Gradient kiri-kanan untuk keterbacaan teks */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(5,3,20,0.90) 0%, rgba(5,3,20,0.65) 40%, rgba(5,3,20,0.2) 70%, transparent 100%)",
            }}
          />
          {/* Gradient bawah untuk mobile (teks di bawah) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(5,3,20,0.75) 0%, transparent 45%)",
            }}
          />
          {/* Aksen warna */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 15% 50%, rgba(124,58,237,0.18) 0%, transparent 55%)",
            }}
          />

          {/* Content */}
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
        </div>
      </div>

      {/* ── Prev / Next ── */}
      {banners.length > 1 && (
        <>
          <button
            id="banner-prev"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              width: "clamp(28px,4vw,40px)",
              height: "clamp(28px,4vw,40px)",
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
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              width: "clamp(28px,4vw,40px)",
              height: "clamp(28px,4vw,40px)",
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
                width: i === current ? "clamp(18px,2.5vw,26px)" : "clamp(5px,1vw,7px)",
                height: "clamp(5px,1vw,7px)",
                borderRadius: 100,
                background: i === current ? "#fbbf24" : "rgba(255,255,255,0.4)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                padding: 0,
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

      <style jsx>{`
        /* ── Tinggi banner responsif ─────────────────────────
           Gunakan height fixed agar gambar tidak terpotong.
           object-contain menjaga proporsi gambar asli.
           Background blur mengisi sisa ruang kosong.
           ─────────────────────────────────────────────────── */
        .banner-aspect-container {
          /* Mobile: minimal 320px, scalable hingga 75vw */
          height: clamp(320px, 75vw, 480px);
        }
        @media (min-width: 640px) {
          /* Tablet */
          .banner-aspect-container { height: clamp(380px, 60vw, 520px); }
        }
        @media (min-width: 1024px) {
          /* Desktop: tinggi cukup untuk gambar fullsize */
          .banner-aspect-container { height: clamp(460px, 55vw, 680px); }
        }

        @keyframes banner-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}
