"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Tag, X, Zap, Trophy } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface WidgetSettings {
  wa_widget_number: string;
  wa_widget_label: string;
  wa_widget_enabled: boolean;
  wa2_widget_number: string;
  wa2_widget_label: string;
  wa2_widget_enabled: boolean;
  tg_widget_username: string;
  tg_widget_label: string;
  tg_widget_enabled: boolean;
}

// WhatsApp SVG icon
const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.828L.057 23.082a.75.75 0 00.919.919l5.356-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 01-4.963-1.362l-.355-.213-3.682 1.015 1.03-3.574-.233-.368A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
  </svg>
);

// Telegram SVG icon
const TelegramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.868.889z"/>
  </svg>
);

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { settings?: WidgetSettings }) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  // Close on backdrop click
  useEffect(() => {
    if (!showSupport) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowSupport(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSupport]);

  // Prevent body scroll when panel open
  useEffect(() => {
    document.body.style.overflow = showSupport ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showSupport]);

  const tgUsername = settings?.tg_widget_username?.replace(/^@/, "").trim() ?? "";

  type Channel = {
    id: string;
    label: string;
    sub: string;
    href: string;
    onClick?: () => void;
    icon: React.ReactNode;
    iconBg: string;
    isHighlight?: boolean;
  };

  const channels: Channel[] = [];

  if (settings?.wa_widget_enabled && settings?.wa_widget_number) {
    channels.push({
      id: "support-wa",
      label: settings.wa_widget_label || "Admin WhatsApp",
      sub: "WhatsApp",
      href: `https://wa.me/${settings.wa_widget_number}`,
      icon: <WhatsAppIcon />,
      iconBg: "linear-gradient(135deg,#25d366,#128c7e)",
    });
  }

  if (settings?.wa2_widget_enabled && settings?.wa2_widget_number) {
    channels.push({
      id: "support-wa2",
      label: settings.wa2_widget_label || "Admin WhatsApp 2",
      sub: "WhatsApp",
      href: `https://wa.me/${settings.wa2_widget_number}`,
      icon: <WhatsAppIcon />,
      iconBg: "linear-gradient(135deg,#25d366,#128c7e)",
    });
  }

  if (settings?.tg_widget_enabled && tgUsername) {
    channels.push({
      id: "support-tg",
      label: settings.tg_widget_label || "Admin Telegram",
      sub: "Telegram",
      href: `https://t.me/${tgUsername}`,
      icon: <TelegramIcon />,
      iconBg: "linear-gradient(135deg,#229ed9,#1a7bbf)",
    });
  }

  // Live Chat — triggers Tawk.to widget or falls back to WA
  const handleLiveChat = () => {
    setShowSupport(false);
    const tawk = (window as any).Tawk_API;
    if (tawk && typeof tawk.maximize === "function") {
      tawk.maximize();
      return;
    }
    if (settings?.wa_widget_number) {
      window.open(`https://wa.me/${settings.wa_widget_number}`, "_blank");
    }
  };

  channels.push({
    id: "support-livechat",
    label: "Live Chat",
    sub: "Chat langsung di sini",
    href: "#",
    onClick: handleLiveChat,
    icon: <MessageCircle size={22} />,
    iconBg: "linear-gradient(135deg, var(--gold-light), var(--amber-light))",
    isHighlight: true,
  });

  return (
    <>
      {/* ── Live Support Panel ── */}
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: showSupport ? 1 : 0,
          pointerEvents: showSupport ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          bottom: showSupport ? "64px" : "-100%",
          left: 0,
          right: 0,
          zIndex: 9998,
          maxWidth: "480px",
          margin: "0 auto",
          borderRadius: "20px 20px 0 0",
          overflow: "hidden",
          transition: "bottom 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header gradient — uses CSS vars */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--gold-light) 0%, var(--amber-light) 60%, var(--bg-card) 100%)",
            padding: "18px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#fff", letterSpacing: "0.01em" }}>
              Live Support
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
                display: "inline-block",
                animation: "pulse 1.5s infinite",
              }} />
              <span style={{ color: "#86efac", fontSize: "12px", fontWeight: 600 }}>Online</span>
            </div>
          </div>
          <button
            onClick={() => setShowSupport(false)}
            style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — uses CSS var for bg */}
        <div style={{ background: "var(--bg-card)", padding: "18px 16px 20px" }}>
          <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
            Pilih bantuan
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
            Komplain cepat via WhatsApp / Telegram, atau chat langsung di website.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {channels.map((ch) => (
              <a
                key={ch.id}
                id={ch.id}
                href={ch.href}
                target={ch.href === "#" ? undefined : "_blank"}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (ch.onClick) {
                    e.preventDefault();
                    ch.onClick();
                  } else if (ch.href === "#") {
                    e.preventDefault();
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 14px",
                  borderRadius: "14px",
                  background: ch.isHighlight
                    ? "linear-gradient(135deg, var(--gold-light), var(--amber-light))"
                    : "rgba(var(--gold-rgb, 200,150,26), 0.05)",
                  border: ch.isHighlight
                    ? "none"
                    : "1px solid rgba(var(--gold-rgb, 200,150,26), 0.1)",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "transform 0.15s, opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {/* Avatar circle */}
                <div style={{
                  width: "38px", height: "38px", borderRadius: "50%",
                  background: ch.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  color: "#fff",
                }}>
                  {ch.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ch.label}
                  </div>
                  <div style={{ fontSize: "11px", color: ch.isHighlight ? "#0a0a14" : "var(--text-muted)", marginTop: "1px" }}>
                    {ch.sub}
                  </div>
                </div>

                {/* Online badge */}
                <span style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#4ade80",
                  flexShrink: 0,
                }}>
                  Online
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Nav Bar ── */}
      <nav
        id="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "rgba(10, 10, 20, 0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(var(--gold-rgb, 200,150,26), 0.15)",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.5), 0 -1px 0 rgba(var(--gold-rgb, 200,150,26), 0.1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            height: "64px",
            maxWidth: "480px",
            margin: "0 auto",
            padding: "0 4px",
          }}
        >
          {/* Home */}
          <Link
            id="mobile-nav-home"
            href="/"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "3px", flex: 1,
              textDecoration: "none", padding: "6px 0",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "28px", height: "28px", borderRadius: "8px",
              background: pathname === "/" ? "rgba(var(--gold-rgb, 200,150,26), 0.15)" : "transparent",
              transition: "background 0.2s",
            }}>
              <Home
                size={20}
                style={{ color: pathname === "/" ? "var(--gold-light)" : "var(--text-muted)", transition: "color 0.2s" }}
                strokeWidth={pathname === "/" ? 2.5 : 2}
              />
            </div>
            <span style={{
              fontSize: "10px",
              fontWeight: pathname === "/" ? 700 : 500,
              color: pathname === "/" ? "var(--gold-light)" : "var(--text-muted)",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}>
              Home
            </span>
          </Link>

          {/* Bongkar */}
          <Link
            id="mobile-nav-bongkar"
            href="/bongkar-chip"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "3px", flex: 1,
              textDecoration: "none", padding: "6px 0",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "28px", height: "28px", borderRadius: "8px",
              background: pathname === "/bongkar-chip" ? "rgba(239,68,68,0.15)" : "transparent",
              transition: "background 0.2s",
            }}>
              <Zap
                size={20}
                style={{ color: pathname === "/bongkar-chip" ? "#f87171" : "var(--text-muted)", transition: "color 0.2s" }}
                strokeWidth={pathname === "/bongkar-chip" ? 2.5 : 2}
              />
            </div>
            <span style={{
              fontSize: "10px",
              fontWeight: pathname === "/bongkar-chip" ? 700 : 500,
              color: pathname === "/bongkar-chip" ? "#f87171" : "var(--text-muted)",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}>
              Bongkar
            </span>
          </Link>

          {/* Leaderboard — center highlight item */}
          <Link
            id="mobile-nav-leaderboard"
            href="/leaderboard"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "3px", flex: 1,
              textDecoration: "none", padding: "6px 0",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "46px", height: "34px", borderRadius: "999px",
              background: pathname === "/leaderboard"
                ? "linear-gradient(135deg, var(--amber-light), var(--gold-light))"
                : "linear-gradient(135deg, var(--gold-light), var(--amber-light))",
              boxShadow: pathname === "/leaderboard"
                ? "0 0 0 3px rgba(var(--gold-rgb, 200,150,26), 0.3), 0 4px 18px rgba(var(--gold-rgb, 200,150,26), 0.5)"
                : "0 4px 18px rgba(var(--gold-rgb, 200,150,26), 0.45)",
              transition: "all 0.2s",
            }}>
              <Trophy size={18} color="#0a0a14" />
            </div>
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              color: pathname === "/leaderboard" ? "var(--gold-light)" : "var(--text-secondary)",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}>
              Top 10
            </span>
          </Link>

          {/* Chat — support panel */}
          <button
            id="mobile-nav-chat"
            onClick={() => setShowSupport((v) => !v)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "3px", flex: 1,
              background: "transparent", border: "none", cursor: "pointer",
              padding: "6px 0",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "28px", height: "28px", borderRadius: "8px",
              background: showSupport ? "rgba(var(--gold-rgb, 200,150,26), 0.15)" : "transparent",
              transition: "background 0.2s",
            }}>
              {showSupport
                ? <X size={20} style={{ color: "var(--gold-light)", transition: "color 0.2s" }} strokeWidth={2.5} />
                : <MessageCircle size={20} style={{ color: "var(--text-muted)", transition: "color 0.2s" }} strokeWidth={2} />}
            </div>
            <span style={{
              fontSize: "10px",
              fontWeight: showSupport ? 700 : 500,
              color: showSupport ? "var(--gold-light)" : "var(--text-muted)",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}>
              Chat
            </span>
          </button>

          {/* Harga */}
          <Link
            id="mobile-nav-harga"
            href="/pricelist"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "3px", flex: 1,
              textDecoration: "none", padding: "6px 0",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "28px", height: "28px", borderRadius: "8px",
              background: pathname === "/pricelist" ? "rgba(var(--gold-rgb, 200,150,26), 0.15)" : "transparent",
              transition: "background 0.2s",
            }}>
              <Tag
                size={20}
                style={{ color: pathname === "/pricelist" ? "var(--gold-light)" : "var(--text-muted)", transition: "color 0.2s" }}
                strokeWidth={pathname === "/pricelist" ? 2.5 : 2}
              />
            </div>
            <span style={{
              fontSize: "10px",
              fontWeight: pathname === "/pricelist" ? 700 : 500,
              color: pathname === "/pricelist" ? "var(--gold-light)" : "var(--text-muted)",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}>
              Harga
            </span>
          </Link>
        </div>
      </nav>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
