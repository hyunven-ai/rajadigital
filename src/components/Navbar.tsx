"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Menu,
  X,
  Zap,
  Search,
  List,
  Home,
  HelpCircle,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/pricelist", label: "Pricelist", icon: List },
  { href: "/cara-topup", label: "Cara Top Up", icon: HelpCircle },
  { href: "/cek-transaksi", label: "Cek Transaksi", icon: Search },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`navbar transition-all duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
      style={{ zIndex: 50 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Mobile header: logo absolutely centered ── */}
        <div className="relative flex items-center justify-between h-16 md:hidden">
          {/* Left: invisible placeholder same width as right buttons for symmetry */}
          <div className="flex items-center gap-2 opacity-0 pointer-events-none" aria-hidden="true">
            <div className="w-9 h-9" />
            <div className="w-9 h-9" />
          </div>

          {/* Logo — absolute center, geser 20px ke kiri */}
          <Link
            href="/"
            id="navbar-logo-mobile"
            className="absolute left-1/2 flex items-center"
            style={{ transform: "translateX(calc(-50% - 20px))" }}
          >
            <Image
              src="https://res.cloudinary.com/dzojrrwtr/image/upload/v1778049885/logo-raja-digital-webp_hwu82q.webp"
              alt="RAJA DIGITAL"
              width={200}
              height={50}
              className="object-contain"
              style={{ height: "50px", width: "200px" }}
              priority
            />
          </Link>

          {/* Right: theme toggle + hamburger */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                id="theme-toggle-mobile"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: "rgba(var(--gold-rgb, 200,150,26), 0.08)",
                  border: "1px solid rgba(var(--gold-rgb, 200,150,26), 0.18)",
                  color: "var(--gold-light)",
                }}
                title="Toggle dark/light mode"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              id="mobile-menu-toggle"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: menuOpen
                  ? "var(--gold-light)"
                  : "rgba(var(--gold-rgb, 200,150,26), 0.08)",
                border: menuOpen
                  ? "none"
                  : "1px solid rgba(var(--gold-rgb, 200,150,26), 0.2)",
                color: menuOpen ? "#0a0a14" : "var(--gold-light)",
                boxShadow: menuOpen
                  ? "0 0 18px rgba(var(--gold-rgb, 200,150,26), 0.5)"
                  : "none",
                transition: "all 0.2s ease",
              }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ── Desktop header: standard flex layout ── */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" id="navbar-logo">
            <Image
              src="https://res.cloudinary.com/dzojrrwtr/image/upload/v1778049885/logo-raja-digital-webp_hwu82q.webp"
              alt="RAJA DIGITAL"
              width={200}
              height={50}
              className="object-contain"
              style={{ height: "50px", width: "200px" }}
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`navbar-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={
                    isActive
                      ? {
                          color: "var(--gold-light)",
                          background: "rgba(var(--gold-rgb, 200,150,26), 0.1)",
                          border: "1px solid rgba(var(--gold-rgb, 200,150,26), 0.2)",
                        }
                      : {
                          color: "var(--text-muted)",
                          border: "1px solid transparent",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                >
                  <Icon size={15} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                id="theme-toggle"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: "rgba(var(--gold-rgb, 200,150,26), 0.08)",
                  border: "1px solid rgba(var(--gold-rgb, 200,150,26), 0.18)",
                  color: "var(--gold-light)",
                }}
                title="Toggle dark/light mode"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <Link
              href="/#order"
              id="navbar-order-cta"
              className="flex items-center gap-2 btn-gold text-sm font-bold"
              style={{ padding: "8px 18px", borderRadius: "10px" }}
            >
              <Zap size={14} />
              Top Up Sekarang
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div
          className="md:hidden border-t animate-slide-up"
          style={{
            background: "rgba(10, 10, 20, 0.98)",
            borderColor: "rgba(var(--gold-rgb, 200,150,26), 0.15)",
          }}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={
                    isActive
                      ? {
                          color: "var(--gold-light)",
                          background:
                            "linear-gradient(135deg, rgba(var(--gold-rgb, 200,150,26), 0.13), rgba(var(--amber-rgb, 212,120,13), 0.07))",
                          borderLeft: "3px solid var(--gold-light)",
                          paddingLeft: "13px",
                        }
                      : {
                          color: "var(--text-muted)",
                        }
                  }
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(var(--gold-rgb, 200,150,26), 0.15)" }}>
              <Link
                href="/#order"
                onClick={() => setMenuOpen(false)}
                className="btn-gold w-full text-center text-sm"
                style={{ display: "block", padding: "12px" }}
              >
                ⚡ Top Up Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
