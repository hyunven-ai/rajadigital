"use client";

import { useEffect, useState } from "react";

interface WidgetSettings {
  wa_widget_number: string;
  wa_widget_label: string;
  wa_widget_enabled: boolean;
  tg_widget_username: string;
  tg_widget_label: string;
  tg_widget_enabled: boolean;
}

export default function FloatingWidget() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.settings) setSettings(d.settings); })
      .catch(() => {});
  }, []);

  if (!settings) return null;
  const { wa_widget_enabled, wa_widget_number, wa_widget_label,
          tg_widget_enabled, tg_widget_label } = settings;
  // Strip leading @ if user typed @username
  const tgUsername = settings.tg_widget_username?.replace(/^@/, "").trim();
  if (!wa_widget_enabled && !tg_widget_enabled) return null;

  return (
    <div
      className="hidden md:flex"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "20px",
        zIndex: 9999,
        flexDirection: "column",
        gap: "10px",
        alignItems: "flex-start",
      }}
    >
      {/* Telegram button */}
      {tg_widget_enabled && tgUsername && (
        <a
          href={`https://t.me/${tgUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          title={tg_widget_label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "999px",
            background: "linear-gradient(135deg,#229ed9,#1a7bbf)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            boxShadow: "0 4px 20px rgba(34,158,217,0.45)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(34,158,217,0.6)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(34,158,217,0.45)";
          }}
        >
          {/* Telegram icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.868.889z"/>
          </svg>
          {tg_widget_label}
        </a>
      )}

      {/* WhatsApp button */}
      {wa_widget_enabled && wa_widget_number && (
        <a
          href={`https://wa.me/${wa_widget_number}`}
          target="_blank"
          rel="noopener noreferrer"
          title={wa_widget_label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 18px",
            borderRadius: "999px",
            background: "linear-gradient(135deg,#25d366,#128c7e)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            boxShadow: "0 4px 24px rgba(37,211,102,0.5)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.06)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 32px rgba(37,211,102,0.65)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(37,211,102,0.5)";
          }}
        >
          {/* WA icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.828L.057 23.082a.75.75 0 00.919.919l5.356-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 01-4.963-1.362l-.355-.213-3.682 1.015 1.03-3.574-.233-.368A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          {wa_widget_label}
        </a>
      )}
    </div>
  );
}
