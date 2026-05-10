import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

/* ── Article data ────────────────────────────────────────────── */
const ARTICLES = {
  "cara-topup-royal-dream": {
    title: "Cara Top Up Royal Dream dengan Mudah dan Cepat",
    description: "Panduan lengkap cara top up Royal Dream di Raja Digital. Langkah demi langkah, proses 1–2 menit, aman dan terpercaya.",
    category: "Panduan",
    categoryColor: "#fbbf24",
    readTime: "3 menit",
    date: "10 Mei 2026",
    author: "Tim Raja Digital",
    emoji: "🎮",
    content: "article1",
  },
  "tips-hemat-topup-game": {
    title: "5 Tips Hemat Saat Top Up Game Online",
    description: "Ingin top-up game lebih hemat? Simak 5 tips dari Raja Digital agar diamond atau koin game-mu makin banyak dengan budget minimal.",
    category: "Tips",
    categoryColor: "#10b981",
    readTime: "4 menit",
    date: "8 Mei 2026",
    author: "Tim Raja Digital",
    emoji: "💡",
    content: "article2",
  },
  "kenapa-harus-topup-di-raja-digital": {
    title: "Kenapa Harus Top Up di Raja Digital?",
    description: "Temukan alasan mengapa ribuan gamer Indonesia mempercayakan top-up game mereka kepada Raja Digital. Aman, cepat, dan harga terbaik.",
    category: "Info",
    categoryColor: "#a78bfa",
    readTime: "2 menit",
    date: "5 Mei 2026",
    author: "Tim Raja Digital",
    emoji: "👑",
    content: "article3",
  },
} as const;

type Slug = keyof typeof ARTICLES;

/* ── Metadata ─────────────────────────────────────────────────── */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const art = ARTICLES[slug as Slug];
  if (!art) return {};
  return { title: `${art.title} | Raja Digital`, description: art.description };
}

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

/* ── Shared styles ────────────────────────────────────────────── */
const prose = { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.85, marginBottom: 20 } as const;
const h2s = { fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "32px 0 12px", fontFamily: "var(--font-outfit, sans-serif)" } as const;
const h3s = { fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "20px 0 8px" } as const;
const ilink = { color: "#fbbf24", fontWeight: 600, textDecoration: "none" } as const;
const tip = { background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 } as const;
const warn = { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 } as const;

/* ── Article 1 ────────────────────────────────────────────────── */
function Article1() {
  return (
    <>
      <p style={prose}>
        Sebagai salah satu platform top-up game terpercaya di Indonesia, <Link href="/tentang-kami" style={ilink}>Raja Digital</Link> menyediakan layanan top-up Royal Dream dengan proses yang cepat dan mudah. Berdasarkan pengalaman kami melayani lebih dari 10.000 pelanggan, panduan berikut adalah cara paling efisien untuk mengisi saldo Royal Dream kamu.
      </p>

      <h2 style={h2s}>Apa Itu Royal Dream?</h2>
      <p style={prose}>
        Royal Dream adalah game mobile populer yang membutuhkan mata uang virtual (diamond/koin) untuk membeli karakter, skin, dan item premium di dalam game. Untuk mendapatkan diamond tersebut, kamu perlu melakukan top-up melalui platform terpercaya seperti Raja Digital.
      </p>

      <h2 style={h2s}>Langkah-Langkah Top Up Royal Dream di Raja Digital</h2>

      {[
        { step: 1, title: "Buka Halaman Pricelist", desc: <>Kunjungi <Link href="/pricelist" style={ilink}>halaman pricelist</Link> Raja Digital untuk melihat daftar paket diamond Royal Dream beserta harganya. Kami menawarkan berbagai pilihan nominal mulai dari yang terkecil hingga terbesar sesuai kebutuhanmu.</> },
        { step: 2, title: "Pilih Nominal Diamond", desc: "Pilih paket diamond yang sesuai dengan kebutuhan dan budget kamu. Semakin besar paket yang dipilih, biasanya semakin hemat harga per diamond-nya." },
        { step: 3, title: "Hubungi Admin via WhatsApp", desc: "Setelah memilih paket, klik tombol 'Top Up Sekarang' dan kamu akan diarahkan langsung ke WhatsApp admin kami. Sebutkan ID game, server (jika ada), dan nominal yang dipilih." },
        { step: 4, title: "Lakukan Pembayaran", desc: "Admin akan memberikan total tagihan dan informasi pembayaran. Kami menerima berbagai metode pembayaran termasuk transfer bank, e-wallet, dan QRIS untuk kemudahanmu." },
        { step: 5, title: "Diamond Langsung Masuk", desc: "Setelah pembayaran dikonfirmasi, diamond akan langsung diproses ke akun Royal Dream kamu. Proses biasanya memakan waktu 1–5 menit." },
      ].map(({ step, title, desc }) => (
        <div key={step} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#1a0a00", flexShrink: 0 }}>{step}</div>
          <div>
            <h3 style={h3s}>{title}</h3>
            <p style={{ ...prose, marginBottom: 0 }}>{desc}</p>
          </div>
        </div>
      ))}

      <div style={tip}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <CheckCircle size={18} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, fontSize: 14 }}>💡 Tips dari Pengalaman Kami</p>
            <p style={{ ...prose, marginBottom: 0, fontSize: 13 }}>Pastikan kamu sudah menyiapkan <strong>ID akun Royal Dream</strong> sebelum menghubungi admin. ID bisa ditemukan di menu profil dalam game. Kesalahan ID menyebabkan diamond masuk ke akun yang salah dan tidak bisa dikembalikan.</p>
          </div>
        </div>
      </div>

      <h2 style={h2s}>Berapa Lama Prosesnya?</h2>
      <p style={prose}>Berdasarkan data transaksi kami, <strong>98% top-up selesai dalam 1–5 menit</strong> setelah pembayaran dikonfirmasi. Layanan kami aktif 24 jam sehari, 7 hari seminggu — termasuk hari libur nasional. Kamu tidak perlu khawatir diamond terlambat masuk.</p>

      <h2 style={h2s}>Apakah Top Up di Raja Digital Aman?</h2>
      <p style={prose}>
        Ya, 100% aman. Raja Digital menggunakan metode top-up resmi yang tidak memerlukan akses ke akun game kamu (password, OTP, dll). Kami hanya membutuhkan <strong>ID pemain dan server game</strong>. Setiap transaksi mendapatkan nomor invoice unik yang bisa kamu <Link href="/cek-transaksi" style={ilink}>cek statusnya kapan saja</Link>.
      </p>

      <div style={warn}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, color: "#ef4444", marginBottom: 6, fontSize: 14 }}>⚠️ Penting!</p>
            <p style={{ ...prose, marginBottom: 0, fontSize: 13 }}>Jangan pernah memberikan password akun game kamu kepada siapapun — termasuk admin top-up. Top-up resmi tidak memerlukan password. Raja Digital <strong>tidak pernah meminta password</strong> akun game kamu.</p>
          </div>
        </div>
      </div>

      <h2 style={h2s}>Kesimpulan</h2>
      <p style={prose}>
        Top up Royal Dream di Raja Digital adalah pilihan terbaik untuk gamer Indonesia yang menginginkan proses cepat, harga kompetitif, dan keamanan terjamin. Dengan pengalaman melayani puluhan ribu transaksi, kami siap membantu kebutuhan top-up game kamu 24/7. Lihat <Link href="/pricelist" style={ilink}>daftar harga lengkap kami</Link> dan mulai top-up sekarang!
      </p>
    </>
  );
}

/* ── Article 2 ────────────────────────────────────────────────── */
function Article2() {
  return (
    <>
      <p style={prose}>
        Sebagai gamer aktif, pengeluaran untuk top-up game bisa menjadi salah satu pos pengeluaran yang cukup besar setiap bulannya. Berdasarkan pengalaman tim Raja Digital yang telah melayani ribuan transaksi, berikut adalah 5 tips praktis yang terbukti membantu gamer berhemat saat top-up game online.
      </p>

      <h2 style={h2s}>Mengapa Strategi Top Up Itu Penting?</h2>
      <p style={prose}>Banyak gamer yang melakukan top-up secara impulsif tanpa perencanaan, sehingga budget bulanan membengkak. Dengan strategi yang tepat, kamu bisa mendapatkan lebih banyak diamond atau koin dengan budget yang sama — bahkan lebih hemat.</p>

      {[
        {
          num: 1,
          title: "Beli Paket Nominal Besar",
          body: <>Di hampir semua game, paket diamond dengan nominal lebih besar memberikan <strong>bonus diamond lebih banyak</strong>. Misalnya, beli 1000 diamond sekaligus lebih hemat dibanding beli 100 diamond sebanyak 10 kali. Cek perbandingan harga di <Link href="/pricelist" style={ilink}>halaman pricelist kami</Link> untuk menemukan paket terbaik.</>,
        },
        {
          num: 2,
          title: "Manfaatkan Event In-Game",
          body: "Hampir semua game mobile mengadakan event double diamond atau bonus top-up di hari-hari tertentu. Tahan dulu pembelianmu dan top-up saat event berlangsung — kamu bisa mendapat 2x lipat diamond dengan harga yang sama.",
        },
        {
          num: 3,
          title: "Pilih Platform Top-Up Terpercaya dengan Harga Terbaik",
          body: <>Harga diamond di berbagai platform top-up bisa berbeda-beda. Platform seperti <Link href="/tentang-kami" style={ilink}>Raja Digital</Link> menawarkan harga lebih kompetitif karena kami beroperasi langsung tanpa perantara. Bandingkan harga sebelum membeli dan pastikan platform yang kamu pilih terpercaya.</>,
        },
        {
          num: 4,
          title: "Buat Budget Bulanan untuk Game",
          body: "Tetapkan anggaran khusus untuk top-up game setiap bulan, misalnya Rp 50.000–100.000. Dengan batasan yang jelas, kamu tidak akan overspending. Prioritaskan top-up untuk item atau karakter yang benar-benar meningkatkan pengalaman bermainmu.",
        },
        {
          num: 5,
          title: "Cek Status Transaksi untuk Ketenangan Pikiran",
          body: <>Setelah top-up, selalu <Link href="/cek-transaksi" style={ilink}>cek status transaksimu</Link> untuk memastikan diamond sudah masuk. Jika ada masalah, segera hubungi admin agar bisa ditangani cepat sebelum kamu lupa.</>,
        },
      ].map(({ num, title, body }) => (
        <div key={num} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 900, fontSize: 13, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</span>
            <h3 style={{ ...h3s, margin: 0 }}>{title}</h3>
          </div>
          <p style={{ ...prose, marginBottom: 0 }}>{body}</p>
        </div>
      ))}

      <div style={tip}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <CheckCircle size={18} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, fontSize: 14 }}>💡 Bonus Tip: Gabung Komunitas Gamer</p>
            <p style={{ ...prose, marginBottom: 0, fontSize: 13 }}>Bergabung dengan komunitas game di Discord atau grup WhatsApp memungkinkan kamu mendapat info event dan promo top-up lebih awal. Biasanya member setia juga mendapat penawaran eksklusif dari platform top-up langganan mereka.</p>
          </div>
        </div>
      </div>

      <h2 style={h2s}>Kesimpulan</h2>
      <p style={prose}>
        Hemat dalam top-up game bukan berarti pelit pada diri sendiri — melainkan bermain lebih cerdas. Dengan menerapkan 5 tips di atas, kamu bisa menikmati game favorit dengan lebih maksimal tanpa perlu khawatir soal budget. Mulai dengan <Link href="/artikel/cara-topup-royal-dream" style={ilink}>pelajari cara top-up yang benar</Link>, kemudian terapkan strategi hemat ini secara konsisten.
      </p>
    </>
  );
}

/* ── Article 3 ────────────────────────────────────────────────── */
function Article3() {
  return (
    <>
      <p style={prose}>
        Di era digital ini, ada ratusan platform top-up game yang bisa kamu temukan secara online. Namun tidak semua platform memberikan jaminan keamanan, kecepatan, dan harga terbaik sekaligus. <Link href="/tentang-kami" style={ilink}>Raja Digital</Link> hadir sebagai solusi terpercaya bagi gamer Indonesia — dan berikut adalah alasan mengapa ribuan gamer memilih kami.
      </p>

      <h2 style={h2s}>1. Harga Kompetitif & Transparan</h2>
      <p style={prose}>
        Raja Digital menawarkan harga yang kompetitif untuk setiap paket top-up game. Tidak ada biaya tersembunyi atau biaya tambahan yang mengejutkan. Semua harga sudah tertera jelas di <Link href="/pricelist" style={ilink}>halaman pricelist kami</Link>, sehingga kamu bisa membandingkan dan memilih paket yang paling sesuai dengan budget.
      </p>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
        <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, fontSize: 14 }}>📊 Perbandingan Keunggulan</p>
        {[
          { label: "Harga", value: "Kompetitif & tanpa biaya tersembunyi" },
          { label: "Kecepatan", value: "1–5 menit setelah pembayaran" },
          { label: "Layanan", value: "24 jam / 7 hari seminggu" },
          { label: "Keamanan", value: "Invoice unik per transaksi" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <h2 style={h2s}>2. Proses Instan, Tidak Perlu Menunggu Lama</h2>
      <p style={prose}>Berbeda dengan banyak platform yang memproses top-up secara manual dengan waktu tunggu berjam-jam, Raja Digital memproses setiap transaksi secepat mungkin. Berdasarkan data kami, <strong>98% transaksi selesai dalam kurang dari 5 menit</strong>. Kamu tidak perlu mengorbankan waktu bermainmu hanya untuk menunggu top-up diproses.</p>

      <h2 style={h2s}>3. Keamanan Transaksi Terjamin</h2>
      <p style={prose}>
        Keamanan adalah prioritas utama kami. Setiap transaksi di Raja Digital mendapatkan <strong>nomor invoice unik</strong> yang bisa kamu gunakan untuk melacak status top-up kapan saja melalui <Link href="/cek-transaksi" style={ilink}>fitur cek transaksi kami</Link>. Kami juga tidak pernah meminta password atau data sensitif akun game kamu.
      </p>

      <h2 style={h2s}>4. Layanan Pelanggan 24/7</h2>
      <p style={prose}>Admin Raja Digital siap membantu kamu 24 jam sehari, 7 hari seminggu — termasuk hari libur nasional. Apapun pertanyaan atau masalah yang kamu hadapi terkait top-up, tim kami siap memberikan respons cepat melalui WhatsApp.</p>

      <h2 style={h2s}>5. Dipercaya Ribuan Gamer Indonesia</h2>
      <p style={prose}>Kepercayaan pelanggan adalah aset terbesar kami. Dengan lebih dari 10.000 pelanggan aktif dan 50.000+ transaksi sukses, Raja Digital telah membuktikan diri sebagai platform top-up yang handal. Baca pengalaman nyata pelanggan kami di halaman utama untuk melihat testimoni mereka.</p>

      <div style={tip}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <CheckCircle size={18} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, fontSize: 14 }}>✅ Sudah Terbukti Aman & Terpercaya</p>
            <p style={{ ...prose, marginBottom: 0, fontSize: 13 }}>Raja Digital beroperasi secara transparan dengan rekam jejak yang bisa diverifikasi. Setiap transaksi tercatat dan dapat ditelusuri melalui sistem invoice kami. Tidak ada penipuan, tidak ada janji palsu — hanya pelayanan terbaik untuk para gamer Indonesia.</p>
          </div>
        </div>
      </div>

      <h2 style={h2s}>Bagaimana Cara Mulai Top Up?</h2>
      <p style={prose}>
        Memulai top-up di Raja Digital sangat mudah. Kunjungi <Link href="/pricelist" style={ilink}>halaman pricelist</Link> untuk melihat pilihan game dan paket yang tersedia, pilih nominal yang sesuai, lalu ikuti <Link href="/artikel/cara-topup-royal-dream" style={ilink}>panduan top-up lengkap kami</Link>. Proses selesai dalam hitungan menit!
      </p>

      <h2 style={h2s}>Kesimpulan</h2>
      <p style={prose}>
        Memilih platform top-up yang tepat adalah keputusan penting bagi setiap gamer. Dengan Raja Digital, kamu mendapatkan kombinasi terbaik dari harga kompetitif, kecepatan proses, keamanan transaksi, dan layanan pelanggan yang responsif. Bergabunglah dengan ribuan gamer Indonesia yang sudah mempercayai Raja Digital sebagai mitra top-up game mereka.
      </p>
    </>
  );
}

/* ── Page component ───────────────────────────────────────────── */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const art = ARTICLES[slug as Slug];
  if (!art) notFound();

  const ContentMap = { article1: Article1, article2: Article2, article3: Article3 };
  const Content = ContentMap[art.content as keyof typeof ContentMap];

  const related = Object.entries(ARTICLES)
    .filter(([s]) => s !== slug)
    .slice(0, 2);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 16px 60px" }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", marginBottom: 28 }}>
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Beranda</Link>
        <span>/</span>
        <Link href="/artikel" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Artikel</Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>{art.title}</span>
      </nav>

      {/* Article header */}
      <header style={{ marginBottom: 36 }}>
        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: `${art.categoryColor}20`, border: `1px solid ${art.categoryColor}40`, color: art.categoryColor, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
          {art.category}
        </span>
        <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.1rem)", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.25, margin: "0 0 16px", fontFamily: "var(--font-outfit,sans-serif)" }}>
          {art.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span>✍️ {art.author}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {art.readTime} baca</span>
          <span>📅 {art.date}</span>
        </div>
      </header>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 32 }} />

      {/* Article body */}
      <article>
        <Content />
      </article>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", margin: "40px 0 32px" }} />

      {/* Related articles */}
      {related.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 16px", fontFamily: "var(--font-outfit,sans-serif)" }}>
            Artikel Terkait
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {related.map(([s, a]) => (
              <Link key={s} href={`/artikel/${s}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px", transition: "border-color 0.2s" }} className="feature-card">
                  <span style={{ fontSize: 24 }}>{a.emoji}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 6px", lineHeight: 1.4 }}>{a.title}</p>
                  <span style={{ fontSize: 12, color: a.categoryColor, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Baca <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back */}
      <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
        <Link href="/artikel" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
          <ArrowLeft size={13} /> Semua Artikel
        </Link>
      </div>
    </div>
  );
}
