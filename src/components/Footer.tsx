import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Heart, Shield, Zap, Clock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-auto"
      style={{
        background: "linear-gradient(180deg, transparent 0%, rgba(124, 58, 237, 0.05) 100%)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="https://res.cloudinary.com/dzojrrwtr/image/upload/v1778049885/logo-raja-digital-webp_hwu82q.webp"
                alt="RAJA DIGITAL"
                width={160}
                height={56}
                className="object-contain"
                style={{ height: "48px", width: "auto" }}
              />
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              Layanan top-up game Royal Dream dengan harga terjangkau, proses cepat, dan jaminan keamanan transaksi. Melayani 24 jam sehari, 7 hari seminggu.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, text: "100% Aman" },
                { icon: Zap, text: "Proses Cepat" },
                { icon: Clock, text: "24/7 Layanan" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: "rgba(251, 191, 36, 0.1)",
                      border: "1px solid rgba(251, 191, 36, 0.2)",
                      color: "#fbbf24",
                    }}
                  >
                    <Icon size={12} />
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3
              className="font-bold text-sm uppercase tracking-wider mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Navigasi
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Beranda" },
                { href: "/pricelist", label: "Pricelist" },
                { href: "/cek-transaksi", label: "Cek Transaksi" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-all duration-200 hover:translate-x-1 inline-flex hover:text-amber-400"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3
              className="font-bold text-sm uppercase tracking-wider mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Ikuti Kami
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { icon: MessageCircle, label: "WhatsApp", href: "#", color: "#25D366" },
                { icon: Heart, label: "Instagram", href: "#", color: "#E1306C" },
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex items-center gap-2 text-sm transition-all duration-200 group"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: `${social.color}20`, color: social.color }}
                    >
                      <Icon size={14} />
                    </div>
                    {social.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {currentYear} RAJA DIGITAL. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Built with ❤️ untuk komunitas Royal Dream Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
