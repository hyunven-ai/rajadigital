/**
 * useAlarm — Sistem alarm berbasis Web Audio API
 * Tidak membutuhkan file MP3 eksternal.
 * Bunyi dibuat secara programatik menggunakan oscillator.
 */

import { useCallback, useRef, useEffect, useState } from "react";

export type AlarmSound = "beep" | "chime" | "urgent";

export interface AlarmConfig {
  enabled: boolean;
  intervalMinutes: number; // 1 | 2 | 3 | 5 | 10
  sound: AlarmSound;
  volume: number; // 0.0 – 1.0
}

const DEFAULT_CONFIG: AlarmConfig = {
  enabled: true,
  intervalMinutes: 2,
  sound: "chime",
  volume: 0.7,
};

// ─── Buat AudioContext sekali, jangan buat ulang ───────────────────────────
let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return sharedCtx;
}

// ─── Generator suara ───────────────────────────────────────────────────────
function playBeep(ctx: AudioContext, volume: number) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "square";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

function playChime(ctx: AudioContext, volume: number) {
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
  notes.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    const t = ctx.currentTime + i * 0.18;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.start(t);
    osc.stop(t + 0.55);
  });
}

function playUrgent(ctx: AudioContext, volume: number) {
  [0, 0.25, 0.5].forEach((delay) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    const t = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.2);
    gain.gain.setValueAtTime(volume * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useAlarm(getPendingCount: () => number) {
  const [config, setConfig] = useState<AlarmConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rajadigital-alarm-config");
      if (saved) {
        setConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {}
  }, []);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlockedRef  = useRef(false); // AudioContext sudah di-unlock user?

  /* ── Simpan config ke localStorage ── */
  const updateConfig = useCallback((patch: Partial<AlarmConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("rajadigital-alarm-config", JSON.stringify(next));
      return next;
    });
  }, []);

  /* ── Unlock AudioContext (harus dipanggil dari event user) ── */
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      unlockedRef.current = true;
    } catch {}
  }, []);

  /* ── Mainkan suara alarm ── */
  const playAlarm = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      switch (config.sound) {
        case "beep":   playBeep(ctx, config.volume);   break;
        case "chime":  playChime(ctx, config.volume);  break;
        case "urgent": playUrgent(ctx, config.volume); break;
      }
    } catch (err) {
      console.warn("Alarm audio error:", err);
    }
  }, [config.sound, config.volume]);

  /* ── Test bunyi (dari UI) ── */
  const testAlarm = useCallback(() => {
    unlock();
    playAlarm();
  }, [unlock, playAlarm]);

  /* ── Periodic alarm untuk pending yang belum diproses ── */
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!config.enabled) return;

    const ms = config.intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(() => {
      const pending = getPendingCount();
      if (pending > 0) {
        console.log(`[Alarm] ${pending} transaksi pending belum diproses → bunyi!`);
        playAlarm();
      }
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.enabled, config.intervalMinutes, getPendingCount, playAlarm]);

  return { config, updateConfig, playAlarm, testAlarm, unlock };
}
