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

/* ── Baris 1 (kiri) — 12 ulasan ─────────────────────────────────── */
const REVIEWS_A: Review[] = [
  { id: 1,  phone: "081*****910", rating: 5, comment: "proses tercepat",            avatar: "👑", color: "#ec4899" },
  { id: 2,  phone: "081*****414", rating: 5, comment: "gercep banget min",          avatar: "🎮", color: "#22c55e" },
  { id: 3,  phone: "082*****772", rating: 5, comment: "mantap boss",                avatar: "💎", color: "#a78bfa" },
  { id: 4,  phone: "083*****321", rating: 5, comment: "recommended banget",         avatar: "🔥", color: "#f59e0b" },
  { id: 5,  phone: "081*****889", rating: 5, comment: "oke lah",                    avatar: "⭐", color: "#06b6d4" },
  { id: 6,  phone: "087*****055", rating: 5, comment: "pelayanan ramah",            avatar: "🏆", color: "#818cf8" },
  { id: 7,  phone: "085*****217", rating: 5, comment: "top up instan keren",        avatar: "🚀", color: "#f43f5e" },
  { id: 8,  phone: "089*****334", rating: 5, comment: "harga bersaing sekali",      avatar: "💰", color: "#10b981" },
  { id: 9,  phone: "082*****601", rating: 5, comment: "dijamin trusted",            avatar: "🛡️", color: "#8b5cf6" },
  { id: 10, phone: "083*****778", rating: 5, comment: "proses kilat nggak ribet",   avatar: "⚡", color: "#fb923c" },
  { id: 11, phone: "087*****092", rating: 5, comment: "langsung masuk guys",        avatar: "🎯", color: "#38bdf8" },
  { id: 12, phone: "081*****556", rating: 5, comment: "paling murah se-indo",       avatar: "🏅", color: "#e879f9" },
];

/* ── Baris 2 (kanan) — 12 ulasan ────────────────────────────────── */
const REVIEWS_B: Review[] = [
  { id: 13, phone: "085*****128", rating: 4, comment: "top proses cepat",           avatar: "🎰", color: "#ec4899" },
  { id: 14, phone: "085*****193", rating: 5, comment: "masuk min keren cepat",      avatar: "💫", color: "#22c55e" },
  { id: 15, phone: "089*****667", rating: 5, comment: "cepet banget prosesnya",     avatar: "✨", color: "#f59e0b" },
  { id: 16, phone: "081*****234", rating: 5, comment: "terpercaya pokoknya",        avatar: "💯", color: "#06b6d4" },
  { id: 17, phone: "082*****490", rating: 5, comment: "harga murah bagus",          avatar: "🌟", color: "#a78bfa" },
  { id: 18, phone: "083*****103", rating: 5, comment: "langsung masuk ges",         avatar: "⚡", color: "#818cf8" },
  { id: 19, phone: "086*****445", rating: 5, comment: "nggak kecewa sama sekali",   avatar: "😍", color: "#34d399" },
  { id: 20, phone: "087*****819", rating: 5, comment: "auto repeat order nih",      avatar: "🔄", color: "#60a5fa" },
  { id: 21, phone: "081*****362", rating: 5, comment: "seller terbaik wkwk",        avatar: "🥇", color: "#fda4af" },
  { id: 22, phone: "089*****541", rating: 5, comment: "bisa dipercaya 100%",        avatar: "✅", color: "#4ade80" },
  { id: 23, phone: "082*****788", rating: 5, comment: "gass terus min",             avatar: "🔥", color: "#c084fc" },
  { id: 24, phone: "085*****003", rating: 5, comment: "murah meriah berkualitas",   avatar: "💎", color: "#fb7185" },
];

/* ── Baris 3 (kiri) — 12 ulasan ─────────────────────────────────── */
const REVIEWS_C: Review[] = [
  { id: 25, phone: "083*****650", rating: 5, comment: "respon admin ramah",         avatar: "😊", color: "#facc15" },
  { id: 26, phone: "081*****971", rating: 5, comment: "order jam 3 pagi tetap on",  avatar: "🌙", color: "#a78bfa" },
  { id: 27, phone: "087*****123", rating: 5, comment: "paling amanah deh",          avatar: "🤝", color: "#22d3ee" },
  { id: 28, phone: "085*****884", rating: 5, comment: "promo sering ada bagus",     avatar: "🎁", color: "#f472b6" },
  { id: 29, phone: "082*****237", rating: 5, comment: "transfer cepat masuk",       avatar: "💸", color: "#4ade80" },
  { id: 30, phone: "083*****510", rating: 5, comment: "top markotop",               avatar: "👍", color: "#fb923c" },
  { id: 31, phone: "089*****392", rating: 5, comment: "tidak pernah telat",         avatar: "⏱️", color: "#818cf8" },
  { id: 32, phone: "081*****745", rating: 5, comment: "udah langganan sini aja",    avatar: "❤️", color: "#ef4444" },
  { id: 33, phone: "087*****061", rating: 5, comment: "aman dan terpercaya",        avatar: "🔒", color: "#06b6d4" },
  { id: 34, phone: "082*****318", rating: 4, comment: "cukup puas pelayanannya",    avatar: "😎", color: "#84cc16" },
  { id: 35, phone: "085*****579", rating: 5, comment: "langsung gass min thx",      avatar: "🙏", color: "#e879f9" },
  { id: 36, phone: "083*****826", rating: 5, comment: "no tipu-tipu here",          avatar: "💪", color: "#38bdf8" },
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

/**
 * Render set×4 untuk seamless loop — 4× lipat memastikan layar ultra-wide
 * tidak pernah menampilkan ujung strip (gap putih).
 */
function MarqueeRow({
  reviews,
  reverse = false,
  duration = 28,
}: {
  reviews: Review[];
  reverse?: boolean;
  duration?: number;
}) {
  /* 4× clone = cukup untuk layar 4K sekalipun */
  const quad = [...reviews, ...reviews, ...reviews, ...reviews];
  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        className="flex gap-3"
        style={{
          width:      "max-content",
          animation:  `${reverse ? "marquee-right" : "marquee-left"} ${duration}s linear infinite`,
          willChange: "transform",
          transform:  "translateZ(0)", /* force GPU layer */
        }}
      >
        {quad.map((r, i) => (
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
          100% { transform: translateX(-25%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-25%); }
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
          <MarqueeRow reviews={REVIEWS_A} reverse={false} duration={38} />
        </div>

        {/* Baris 2 — ke kanan */}
        <div className="mb-3">
          <MarqueeRow reviews={REVIEWS_B} reverse={true} duration={45} />
        </div>

        {/* Baris 3 — ke kiri (baru) */}
        <MarqueeRow reviews={REVIEWS_C} reverse={false} duration={34} />

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
