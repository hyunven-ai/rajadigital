import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Artikel & Tips Top Up Game | Raja Digital",
  description: "Kumpulan artikel, tips, dan panduan seputar top-up game online di Raja Digital. Temukan informasi terbaru seputar game favoritmu.",
};

const articles = [
  {
    id: 1,
    slug: "cara-topup-royal-dream",
    title: "Cara Top Up Royal Dream dengan Mudah dan Cepat",
    excerpt: "Panduan lengkap cara melakukan top-up Royal Dream di Raja Digital. Proses hanya 1–2 menit, langsung masuk ke akunmu.",
    category: "Panduan",
    readTime: "3 menit",
    date: "10 Mei 2026",
    emoji: "🎮",
    color: "#fbbf24",
  },
  {
    id: 2,
    slug: "tips-hemat-topup-game",
    title: "5 Tips Hemat Saat Top Up Game Online",
    excerpt: "Ingin top-up game lebih hemat? Simak tips dan trik dari Raja Digital agar diamond atau koin game-mu makin banyak dengan budget minimal.",
    category: "Tips",
    readTime: "4 menit",
    date: "8 Mei 2026",
    emoji: "💡",
    color: "#10b981",
  },
  {
    id: 3,
    slug: "kenapa-harus-topup-di-raja-digital",
    title: "Kenapa Harus Top Up di Raja Digital?",
    excerpt: "Temukan alasan mengapa ribuan gamer Indonesia mempercayakan top-up game mereka kepada Raja Digital. Aman, cepat, dan harga terbaik.",
    category: "Info",
    readTime: "2 menit",
    date: "5 Mei 2026",
    emoji: "👑",
    color: "#a78bfa",
  },
];

export default function ArtikelPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px 60px" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(251,191,36,0.35)",
          }}>
            <BookOpen size={20} color="#1a0a00" />
          </div>
          <div>
            <h1 style={{
              fontSize: "clamp(1.4rem, 4vw, 2rem)",
              fontWeight: 900,
              color: "var(--text-primary)",
              margin: 0,
              fontFamily: "var(--font-outfit, sans-serif)",
            }}>
              Artikel &amp; Tips
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Panduan, tips, dan info seputar top-up game
            </p>
          </div>
        </div>
      </div>

      {/* Article Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/artikel/${article.slug}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <article
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                height: "100%",
              }}
              className="feature-card"
            >
              {/* Card header colored strip */}
              <div style={{
                padding: "24px 20px 16px",
                borderBottom: "1px solid var(--border)",
                background: `linear-gradient(135deg, ${article.color}12 0%, transparent 100%)`,
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{article.emoji}</div>
                <span style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: `${article.color}20`,
                  border: `1px solid ${article.color}40`,
                  color: article.color,
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 10,
                }}>
                  {article.category}
                </span>
                <h2 style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: 1.4,
                  fontFamily: "var(--font-outfit, sans-serif)",
                }}>
                  {article.title}
                </h2>
              </div>

              {/* Card body */}
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
                  {article.excerpt}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                    <Clock size={11} />
                    {article.readTime} · {article.date}
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 12, fontWeight: 700, color: article.color,
                  }}>
                    Baca <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Coming Soon note */}
      <div style={{
        marginTop: 40,
        padding: "20px 24px",
        borderRadius: 14,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          📢 Artikel baru akan terus ditambahkan. Pantau terus halaman ini!
        </p>
      </div>

      {/* Back link */}
      <div style={{ marginTop: 24 }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--text-muted)",
          textDecoration: "none",
        }}>
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
