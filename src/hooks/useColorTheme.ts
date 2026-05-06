"use client";

import { useEffect } from "react";

export interface ColorTheme {
  id: string;
  name: string;
  gold: string;
  goldDark: string;
  goldLight: string;
  purple: string;
  purpleDark: string;
  purpleLight: string;
  amber: string;
  amberLight: string;
  bgPrimaryDark: string;
  bgSecondaryDark: string;
  bgCardDark: string;
}

const CACHE_KEY = "rajadigital_color_theme";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Convert a CSS hex color to comma-separated RGB string (e.g. "#f5c842" → "245,200,66") */
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "200,150,26";
  return `${r},${g},${b}`;
}

export function applyThemeToDom(theme: ColorTheme) {
  const root = document.documentElement;
  root.style.setProperty("--gold", theme.gold);
  root.style.setProperty("--gold-dark", theme.goldDark);
  root.style.setProperty("--gold-light", theme.goldLight);
  root.style.setProperty("--gold-rgb", hexToRgb(theme.gold));
  root.style.setProperty("--purple", theme.purple);
  root.style.setProperty("--purple-dark", theme.purpleDark);
  root.style.setProperty("--purple-light", theme.purpleLight);
  root.style.setProperty("--amber", theme.amber);
  root.style.setProperty("--amber-light", theme.amberLight);
  root.style.setProperty("--amber-rgb", hexToRgb(theme.amber));

  // Update dark mode bg colors
  const darkEl = document.querySelector(".dark") as HTMLElement | null;
  if (darkEl) {
    darkEl.style.setProperty("--bg-primary", theme.bgPrimaryDark);
    darkEl.style.setProperty("--bg-secondary", theme.bgSecondaryDark);
    darkEl.style.setProperty("--bg-card", theme.bgCardDark);
  }

  // Also set on :root for dark computed values
  root.style.setProperty("--theme-bg-primary-dark", theme.bgPrimaryDark);
  root.style.setProperty("--theme-bg-secondary-dark", theme.bgSecondaryDark);
  root.style.setProperty("--theme-bg-card-dark", theme.bgCardDark);

  // Store theme id on data attribute for CSS selectors
  root.setAttribute("data-theme", theme.id);
}

export function useColorTheme() {
  useEffect(() => {
    // 1. Try cache first (instant apply, no flash)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { theme, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          applyThemeToDom(theme);
        }
      }
    } catch {}

    // 2. Always fetch fresh from API
    fetch(`/api/theme?t=${Date.now()}`)
      .then((r) => r.json())
      .then(({ theme }) => {
        if (!theme) return;
        applyThemeToDom(theme);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ theme, ts: Date.now() }));
        } catch {}
      })
      .catch(() => {});
  }, []);
}
