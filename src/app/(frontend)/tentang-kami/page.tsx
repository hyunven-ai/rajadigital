import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shield, Zap, Clock, Trophy, Users, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami | Raja Digital",
  description: "Kenali lebih dekat Raja Digital — platform top-up game terpercaya dengan harga terbaik, proses instan, dan pelayanan 24 jam untuk gamers Indonesia.",
};

const stats = [
  { icon: Users,  value: "10.000+", label: "Pelanggan Puas",    color: "#3b82f6" },
  { icon: Trophy, value: "50.000+", label: "Transaksi Sukses",  color: "#fbbf24" },
  { icon: Star,   value: "4.9/5",   label: "Rating Pelanggan",  color: "#a78bfa" },
  { icon: Clock,  value: "24/7",    label: "Layanan Aktif",     color: "#10b981" },
];

const values = [
  {
    icon: Shield,
    title: "Keamanan Terjamin",
    desc: "Setiap transaksi dilindungi dengan sistem keamanan berlapis. Invoice unik untuk setiap pesanan.",
    color: "#3b82f6",
  },
  {
    icon: Zap,
    title: "Proses Super Cepat",
    desc: "Top-up diproses dalam hitungan detik hingga menit. Tidak perlu menunggu lama.",
    color: "#fbbf24",
  },
  {
    icon: Trophy,
    title: "Harga Kompetitif",
    desc: "Kami menawarkan harga terbaik di kelasnya tanpa biaya tersembunyi apapun.",
    color: "#a78bfa",
  },
];

export default function TentangKamiPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px 60px" }}>

      {/* Hero */}
      <div style={{
        borderRadius: 20,
        background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(124,58,237,0.08) 100%)",
        border: "1px solid var(--border)",
        padding: "40px 32px",
        textAlign: "center",
        marginBottom: 40,
        position: "relative",
        overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 400, height: 200,
          background: "radial-gradient(ellipse, rgba(251,191,36,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <Image
          src="https://res.cloudinary.com/dzojrrwtr/image/upload/v1778049885/logo-raja-digital-webp_hwu82q.webp"
          alt="RAJA DIGITAL"
          width={180}
          height={64}
          style={{ objectFit: "contain", height: 56, width: "auto", margin: "0 auto 20px" }}
        />
        <h1 style={{
          fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 900,
          color: "var(--text-primary)",
          margin: "0 0 12px",
          fontFamily: "var(--font-outfit, sans-serif)",
        }}>
          Tentang <span style={{ color: "#fbbf24" }}>Raja Digital</span>
        </h1>
        <p style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          maxWidth: 560,
          margin: "0 auto",
          lineHeight: 1.75,
        }}>
          Raja Digital adalah platform top-up game online terpercaya yang hadir untuk memenuhi
          kebutuhan para gamer Indonesia dengan harga terjangkau, proses cepat, dan pelayanan
          24 jam sehari, 7 hari seminggu.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14,
        marginBottom: 40,
      }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "20px 16px",
              textAlign: "center",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${s.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div style={{
                fontSize: 22, fontWeight: 900,
                color: "var(--text-primary)",
                fontFamily: "var(--font-outfit, sans-serif)",
                marginBottom: 4,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Visi & Misi */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
        marginBottom: 40,
      }}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 16,
          padding: "24px",
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
          <h2 style={{
            fontSize: 16, fontWeight: 800,
            color: "#fbbf24",
            margin: "0 0 10px",
            fontFamily: "var(--font-outfit, sans-serif)",
          }}>
            Visi Kami
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, margin: 0 }}>
            Menjadi platform top-up game terpercaya dan terjangkau nomor satu di Indonesia,
            dengan memberikan pengalaman transaksi yang aman, cepat, dan menyenangkan
            bagi seluruh gamer Indonesia.
          </p>
        </div>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 16,
          padding: "24px",
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🚀</div>
          <h2 style={{
            fontSize: 16, fontWeight: 800,
            color: "#a78bfa",
            margin: "0 0 10px",
            fontFamily: "var(--font-outfit, sans-serif)",
          }}>
            Misi Kami
          </h2>
          <ul style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 2, margin: 0, paddingLeft: 18 }}>
            <li>Menyediakan layanan top-up game dengan harga terbaik</li>
            <li>Memproses setiap transaksi dengan cepat dan aman</li>
            <li>Melayani pelanggan 24 jam penuh tanpa henti</li>
            <li>Terus berinovasi untuk kemudahan gamer Indonesia</li>
          </ul>
        </div>
      </div>

      {/* Nilai-nilai */}
      <h2 style={{
        fontSize: 18, fontWeight: 800,
        color: "var(--text-primary)",
        margin: "0 0 16px",
        fontFamily: "var(--font-outfit, sans-serif)",
      }}>
        Nilai-Nilai Kami
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 14,
        marginBottom: 40,
      }}>
        {values.map((v) => {
          const Icon = v.icon;
          return (
            <div key={v.title} className="feature-card" style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "20px",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${v.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                <Icon size={20} style={{ color: v.color }} />
              </div>
              <h3 style={{
                fontSize: 15, fontWeight: 800,
                color: "var(--text-primary)",
                margin: "0 0 8px",
                fontFamily: "var(--font-outfit, sans-serif)",
              }}>
                {v.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
                {v.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(124,58,237,0.1))",
        border: "1px solid rgba(251,191,36,0.2)",
        padding: "28px 24px",
        textAlign: "center",
        marginBottom: 24,
      }}>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 16 }}>
          Siap untuk pengalaman top-up game yang lebih mudah?
        </p>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 28px", borderRadius: 12,
          background: "linear-gradient(135deg, #f5c842, #ff9f1c)",
          color: "#0a0a14", fontWeight: 800, fontSize: 14,
          textDecoration: "none",
          boxShadow: "0 4px 16px rgba(245,200,66,0.4)",
        }}>
          ⚡ Top Up Sekarang
        </Link>
      </div>

      {/* Back */}
      <Link href="/" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "var(--text-muted)",
        textDecoration: "none",
      }}>
        ← Kembali ke Beranda
      </Link>
    </div>
  );
}
