"use client";

import { Star, Sparkles } from "lucide-react";

interface Review {
  id: number;
  phone: string;
  rating: number;
  comment: string;
  avatar: string;
  color: string;
}

const REVIEWS_A: Review[] = [
  { id: 1,  phone: "081*****910", rating: 5, comment: "proses tercepat",        avatar: "👑", color: "#ec4899" },
  { id: 2,  phone: "081*****414", rating: 5, comment: "gercep",                 avatar: "🎮", color: "#22c55e" },
  { id: 3,  phone: "082*****772", rating: 5, comment: "mantap boss",            avatar: "💎", color: "#a78bfa" },
  { id: 4,  phone: "083*****321", rating: 5, comment: "recommended banget",     avatar: "🔥", color: "#f59e0b" },
  { id: 5,  phone: "081*****889", rating: 5, comment: "oke lah",                avatar: "⭐", color: "#06b6d4" },
  { id: 6,  phone: "087*****055", rating: 5, comment: "pelayanan ramah",        avatar: "🏆", color: "#818cf8" },
];

const REVIEWS_B: Review[] = [
  { id: 7,  phone: "085*****128", rating: 4, comment: "top proses cepat",       avatar: "🎰", color: "#ec4899" },
  { id: 8,  phone: "085*****193", rating: 5, comment: "masuk min keren cepat",  avatar: "💫", color: "#22c55e" },
  { id: 9,  phone: "089*****667", rating: 5, comment: "cepet banget prosesnya", avatar: "✨", color: "#f59e0b" },
  { id: 10, phone: "081*****234", rating: 5, comment: "terpercaya pokoknya",    avatar: "💯", color: "#06b6d4" },
  { id: 11, phone: "082*****490", rating: 5, comment: "harga murah bagus",      avatar: "🌟", color: "#a78bfa" },
  { id: 12, phone: "083*****103", rating: 5, comment: "langsung masuk ges",     avatar: "⚡", color: "#818cf8" },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < count ? "#fbbf24" : "transparent"}
          style={{ color: i < count ? "#fbbf24" : "rgba(255,255,255,0.2)" }}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${review.color}25 0%, ${review.color}10 100%)`,
        border:     `1px solid ${review.color}45`,
        width:      "220px",
        willChange: "transform",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${review.color}40, ${review.color}18)`,
          border:     `1px solid ${review.color}50`,
        }}
      >
        {review.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <Stars count={review.rating} />
        <div className="text-xs font-bold mt-1 truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
          {review.phone}
        </div>
        <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
          {review.comment}
        </div>
      </div>
    </div>
  );
}

/* Render set×2 untuk seamless loop */
function MarqueeRow({
  reviews,
  reverse = false,
  duration = 28,
}: {
  reviews: Review[];
  reverse?: boolean;
  duration?: number;
}) {
  const doubled = [...reviews, ...reviews];
  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        className="flex gap-3"
        style={{
          width:         "max-content",
          animation:     `${reverse ? "marquee-right" : "marquee-left"} ${duration}s linear infinite`,
          willChange:    "transform",
          transform:     "translateZ(0)", /* force GPU layer */
        }}
      >
        {doubled.map((r, i) => (
          <ReviewCard key={`${r.id}-${i}`} review={r} />
        ))}
      </div>
    </div>
  );
}

export default function ReviewCarousel() {
  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <section
        className="py-12 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.06) 50%, transparent 100%)",
        }}
      >
        {/* Header */}
        <div className="max-w-6xl mx-auto px-4 mb-7">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={19} style={{ color: "#fbbf24" }} />
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}
            >
              Ulasan <span className="gradient-text-gold">Pelanggan</span>
            </h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Ratusan pelanggan telah membagikan pengalaman mereka
          </p>
        </div>

        {/* Baris 1 — ke kiri */}
        <div className="mb-3">
          <MarqueeRow reviews={REVIEWS_A} reverse={false} duration={26} />
        </div>

        {/* Baris 2 — ke kanan (berlawanan) */}
        <MarqueeRow reviews={REVIEWS_B} reverse={true} duration={30} />

        {/* Footer */}
        <div className="max-w-6xl mx-auto px-4 mt-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm" style={{ color: "var(--text-muted)", maxWidth: 380 }}>
            Ratusan pelanggan telah membagikan ulasan dan pengalaman mereka
            setelah menggunakan layanan kami.
          </p>
          <a
            href="/cek-transaksi"
            className="btn-gold inline-flex items-center gap-2 text-sm font-bold"
            style={{ padding: "10px 24px", borderRadius: "12px" }}
          >
            Lihat Semua
          </a>
        </div>
      </section>
    </>
  );
}
