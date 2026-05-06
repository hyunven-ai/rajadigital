"use client";

import { useEffect, useState, useRef } from "react";

interface RunningTextItem {
  id: string;
  text: string;
  emoji: string;
  active: boolean;
}

interface RunningTextConfig {
  enabled: boolean;
  items: RunningTextItem[];
  speed: number;
  bgColor: string;
  textColor: string;
  separator: string;
}

export default function RunningText() {
  const [config, setConfig] = useState<RunningTextConfig | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/running-text?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(({ config: c }) => { if (c) setConfig(c); })
      .catch(() => {});
  }, []);

  if (!config || !config.enabled) return null;

  const activeItems = config.items.filter((i) => i.active);
  if (activeItems.length === 0) return null;

  // Duplicate items for seamless infinite loop
  const allItems = [...activeItems, ...activeItems, ...activeItems];

  // Speed: lower number = faster (duration in seconds for full pass)
  // speed 20 → 15s, speed 100 → 60s
  const duration = Math.round(15 + ((config.speed - 20) / 80) * 45);

  const bg = config.bgColor.startsWith("linear-gradient")
    ? config.bgColor
    : config.bgColor;

  return (
    <div
      id="running-text-bar"
      className="w-full overflow-hidden relative"
      style={{
        background: bg,
        borderTop: "1px solid rgba(255,255,255,0.12)",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left fade mask */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: "60px",
          background: `linear-gradient(to right, ${config.bgColor.startsWith("linear") ? "rgba(0,0,0,0.3)" : config.bgColor}, transparent)`,
        }}
      />

      {/* Right fade mask */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: "60px",
          background: `linear-gradient(to left, ${config.bgColor.startsWith("linear") ? "rgba(0,0,0,0.3)" : config.bgColor}, transparent)`,
        }}
      />

      {/* Scrolling track */}
      <div
        ref={trackRef}
        style={{
          display: "flex",
          alignItems: "center",
          width: "max-content",
          animation: `marquee-scroll ${duration}s linear infinite`,
          animationPlayState: isPaused ? "paused" : "running",
          padding: "10px 0",
        }}
      >
        {allItems.map((item, idx) => (
          <span
            key={`${item.id}-${idx}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: config.textColor,
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              padding: "0 28px",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            <span style={{ fontSize: "15px" }}>{item.emoji}</span>
            {item.text}
            <span
              style={{
                marginLeft: "14px",
                opacity: 0.5,
                fontSize: "10px",
                fontWeight: 900,
              }}
            >
              {config.separator}
            </span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
