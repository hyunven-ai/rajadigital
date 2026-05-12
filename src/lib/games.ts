// games.ts — source of truth diambil dari src/data/games.json via API
// Fungsi getActiveGames() dan getGame() membaca file JSON langsung (Server Components)
// Client components gunakan /api/games endpoint

import gamesData from "@/data/games.json";

export interface GameCurrency {
  key: string;
  label: string;
  icon: string;
  currencyImage?: string; // URL gambar PNG opsional pengganti emoji
}

export interface Game {
  id:               string;
  slug:             string;
  name:             string;
  publisher:        string;
  description:      string;
  cover:            string;
  emoji:            string;
  currency:         string;
  currencyIcon:     string;
  currencyImage?:   string; // URL gambar PNG untuk currency utama
  extraCurrencies:  GameCurrency[];
  color:            string;
  gradient:         string;
  isActive:         boolean;
  isNew?:           boolean;
  isHot?:           boolean;
  sortOrder:        number;
}

// Cast JSON data to typed array
export const GAMES: Game[] = (gamesData as Game[])
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

export function getActiveGames(): Game[] {
  return GAMES.filter((g) => g.isActive);
}

export function getGame(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug && g.isActive);
}

// All categories a game supports (primary + extras)
export function getGameCategories(game: Game): { key: string; label: string; icon: string; currencyImage?: string }[] {
  const primary = { key: game.currency.toLowerCase(), label: game.currency, icon: game.currencyIcon, currencyImage: game.currencyImage };
  const extras  = (game.extraCurrencies ?? []).map((c) => ({ key: c.key, label: c.label, icon: c.icon, currencyImage: c.currencyImage }));
  return [primary, ...extras];
}

