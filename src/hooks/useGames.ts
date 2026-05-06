/**
 * useGames — fetch game data secara dinamis dari /api/games
 * Menggantikan static import getActiveGames() dari @/lib/games
 * sehingga perubahan di admin panel langsung sync ke frontend.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Game } from "@/lib/games";

interface UseGamesReturn {
  games:   Game[];
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useGames(): UseGamesReturn {
  const [games,   setGames]   = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/games", { cache: "no-store" });
      const data = await res.json();
      setGames(data.games ?? []);
    } catch (e) {
      setError("Gagal memuat data game");
      console.error("useGames error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  return { games, loading, error, refetch: fetchGames };
}

/** Fetch single game by slug */
export function useGame(slug: string) {
  const { games, loading, error, refetch } = useGames();
  const game = games.find((g) => g.slug === slug) ?? null;
  return { game, loading, error, refetch };
}
