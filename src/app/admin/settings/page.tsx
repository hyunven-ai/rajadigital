"use client";

import { useState, useEffect } from "react";
import {
  Save, Plus, Trash2, Pencil, Check, X, Phone, Globe, Code, QrCode,
  ToggleLeft, ToggleRight, Loader2, Palette, RefreshCw, Type, GripVertical,
} from "lucide-react";
import { applyThemeToDom, type ColorTheme } from "@/hooks/useColorTheme";

interface RunningTextItem { id: string; text: string; emoji: string; active: boolean; }
interface RunningTextConfig {
  enabled: boolean;
  items: RunningTextItem[];
  speed: number;
  bgColor: string;
  textColor: string;
  separator: string;
}

interface WaNumber { id: string; label: string; number: string; is_active: boolean; sort_order: number; }
interface QrisItem  { id: string; label: string; image_url: string; is_active: boolean; sort_order: number; created_at: string; }

const INIT_WA: WaNumber[] = [
  { id: "1", label: "Admin Utama",  number: "6281234567890", is_active: true,  sort_order: 1 },
  { id: "2", label: "Admin Backup", number: "6281234567891", is_active: true,  sort_order: 2 },
];

export default function AdminSettingsPage() {
  /* ── WA state ── */
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>(INIT_WA);
  const [newWa,     setNewWa]     = useState({ label: "", number: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm,  setEditForm]  = useState({ label: "", number: "" });
  const [waSaving,  setWaSaving]  = useState(false);

  /* ── SEO state ── */
  const [seo, setSeo] = useState({
    meta_title: "RAJA DIGITAL — Top-Up Royal Dream",
    meta_description: "Platform top-up game terpercaya.",
    meta_keywords: "top up, royal dream, diamond, koin",
    ga_script: "", pixel_script: "", widget_script: "",
  });
  const [seoSaving, setSeoSaving] = useState(false);

  /* ── Widget (WA/TG floating buttons) state ── */
  const [widget, setWidget] = useState({
    wa_widget_number: "",
    wa_widget_label: "Chat Admin",
    wa_widget_enabled: false,
    wa2_widget_number: "",
    wa2_widget_label: "Chat Admin 2",
    wa2_widget_enabled: false,
    tg_widget_username: "",
    tg_widget_label: "Telegram",
    tg_widget_enabled: false,
  });

  /* ── QRIS state ── */
  const [qrisList,    setQrisList]    = useState<QrisItem[]>([]);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisSaving,  setQrisSaving]  = useState(false);
  const [newQrisLabel, setNewQrisLabel] = useState("");
  const [newQrisUrl,   setNewQrisUrl]   = useState("");
  const [previewUrl,   setPreviewUrl]   = useState("");

  /* ── Color Theme state ── */
  const PRESET_THEMES: ColorTheme[] = [
    {
      id: "royal-gold",      name: "👑 Royal Gold (Default)",
      gold: "#c8961a",       goldDark: "#9e720f",     goldLight: "#f5c842",
      purple: "#6d28d9",     purpleDark: "#4c1d95",   purpleLight: "#8b5cf6",
      amber: "#d4780d",      amberLight: "#ff9f1c",
      bgPrimaryDark: "#0a0a14", bgSecondaryDark: "#12111f", bgCardDark: "#1a1828",
    },
    {
      id: "emerald-royal",   name: "💚 Emerald Royal",
      gold: "#10b981",       goldDark: "#059669",     goldLight: "#34d399",
      purple: "#6d28d9",     purpleDark: "#4c1d95",   purpleLight: "#8b5cf6",
      amber: "#0d9488",      amberLight: "#14b8a6",
      bgPrimaryDark: "#030f0a", bgSecondaryDark: "#051a10", bgCardDark: "#082218",
    },
    {
      id: "ocean-blue",      name: "🌊 Ocean Blue",
      gold: "#3b82f6",       goldDark: "#1d4ed8",     goldLight: "#60a5fa",
      purple: "#0ea5e9",     purpleDark: "#0284c7",   purpleLight: "#38bdf8",
      amber: "#2563eb",      amberLight: "#3b82f6",
      bgPrimaryDark: "#020818", bgSecondaryDark: "#060f24", bgCardDark: "#0c1832",
    },
    {
      id: "rose-crimson",    name: "🌹 Rose Crimson",
      gold: "#f43f5e",       goldDark: "#be123c",     goldLight: "#fb7185",
      purple: "#e11d48",     purpleDark: "#9f1239",   purpleLight: "#f472b6",
      amber: "#ef4444",      amberLight: "#f87171",
      bgPrimaryDark: "#14020a", bgSecondaryDark: "#200510", bgCardDark: "#2d0818",
    },
    {
      id: "sunset-orange",   name: "🌅 Sunset Orange",
      gold: "#f97316",       goldDark: "#c2410c",     goldLight: "#fb923c",
      purple: "#dc2626",     purpleDark: "#991b1b",   purpleLight: "#f87171",
      amber: "#ea580c",      amberLight: "#f97316",
      bgPrimaryDark: "#140802", bgSecondaryDark: "#1f1005", bgCardDark: "#2b160a",
    },
    {
      id: "neon-cyber",      name: "⚡ Neon Cyber",
      gold: "#a3e635",       goldDark: "#65a30d",     goldLight: "#d9f99d",
      purple: "#8b5cf6",     purpleDark: "#6d28d9",   purpleLight: "#c4b5fd",
      amber: "#06b6d4",      amberLight: "#22d3ee",
      bgPrimaryDark: "#030705", bgSecondaryDark: "#071209", bgCardDark: "#0d1f10",
    },
  ];

  const [colorTheme, setColorTheme] = useState<ColorTheme>(PRESET_THEMES[0]);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themePreview, setThemePreview] = useState<ColorTheme | null>(null);

  /* ── Running Text state ── */
  const DEFAULT_RT: RunningTextConfig = {
    enabled: true,
    items: [
      { id: "1", text: "Top-up Cepat & Aman — Proses Otomatis 24 Jam!", emoji: "⚡", active: true },
      { id: "2", text: "Harga Terjangkau — Diamond, Koin, UC & Lebih!", emoji: "💎", active: true },
      { id: "3", text: "Layanan Pelanggan Siap via WhatsApp", emoji: "💬", active: true },
      { id: "4", text: "Promo Spesial Member Setia — Cek Pricelist Kami!", emoji: "🎁", active: true },
    ],
    speed: 40, bgColor: "#c8961a", textColor: "#0a0a14", separator: "❖",
  };
  const [rt, setRt] = useState<RunningTextConfig>(DEFAULT_RT);
  const [rtSaving, setRtSaving] = useState(false);
  const [newRtText, setNewRtText] = useState("");
  const [newRtEmoji, setNewRtEmoji] = useState("🔥");

  /* ── Global ── */
  const [saved,      setSaved]      = useState(false);
  const [activeTab,  setActiveTab]  = useState<"wa" | "seo" | "widget" | "qris" | "theme" | "runtext">("wa");

  /* ── Load all data on mount ── */
  useEffect(() => {
    // Load WA numbers
    fetch("/api/wa-number?all=true")
      .then((r) => r.json())
      .then((d) => { if (d.list?.length) setWaNumbers(d.list); })
      .catch(() => {});

    // Load SEO + widget settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings;
        if (!s) return;
        setSeo({
          meta_title: s.meta_title ?? "",
          meta_description: s.meta_description ?? "",
          meta_keywords: s.meta_keywords ?? "",
          ga_script: s.ga_script ?? "",
          pixel_script: s.pixel_script ?? "",
          widget_script: s.widget_script ?? "",
        });
        setWidget({
          wa_widget_number: s.wa_widget_number ?? "",
          wa_widget_label: s.wa_widget_label ?? "Chat Admin",
          wa_widget_enabled: s.wa_widget_enabled ?? false,
          wa2_widget_number: s.wa2_widget_number ?? "",
          wa2_widget_label: s.wa2_widget_label ?? "Chat Admin 2",
          wa2_widget_enabled: s.wa2_widget_enabled ?? false,
          tg_widget_username: s.tg_widget_username ?? "",
          tg_widget_label: s.tg_widget_label ?? "Telegram",
          tg_widget_enabled: s.tg_widget_enabled ?? false,
        });
      })
      .catch(() => {});

    // Load QRIS
    setQrisLoading(true);
    fetch("/api/qris?all=true")
      .then((r) => r.json())
      .then((d) => setQrisList(d.list ?? []))
      .catch(() => {})
      .finally(() => setQrisLoading(false));

    // Load color theme
    fetch(`/api/theme?t=${Date.now()}`)
      .then((r) => r.json())
      .then(({ theme }) => { if (theme?.id) setColorTheme(theme); })
      .catch(() => {});

    // Load Running Text
    fetch(`/api/running-text?t=${Date.now()}`)
      .then((r) => r.json())
      .then(({ config }) => { if (config) setRt(config); })
      .catch(() => {});
  }, []);

  /* ── WA handlers ── */

  // Core: persist list to API
  const saveWaToApi = async (list: WaNumber[]) => {
    try {
      const res = await fetch("/api/wa-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Gagal menyimpan");
      // Reload to confirm
      const reload = await fetch(`/api/wa-number?all=true&t=${Date.now()}`);
      const rd = await reload.json();
      if (rd.list?.length) setWaNumbers(rd.list);
    } catch (err) {
      alert("Gagal simpan nomor WA: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const addWa = async () => {
    if (!newWa.label || !newWa.number) { alert("Label dan nomor wajib diisi"); return; }
    const newList = [...waNumbers, { id: String(Date.now()), label: newWa.label, number: newWa.number, is_active: true, sort_order: waNumbers.length + 1 }];
    setWaNumbers(newList);
    setNewWa({ label: "", number: "" });
    await saveWaToApi(newList);
  };

  const removeWa = async (id: string) => {
    if (!confirm("Hapus nomor WhatsApp ini?")) return;
    const newList = waNumbers.filter((w) => w.id !== id);
    setWaNumbers(newList);
    await saveWaToApi(newList);
  };

  const toggleWa = async (id: string) => {
    const newList = waNumbers.map((w) => w.id === id ? { ...w, is_active: !w.is_active } : w);
    setWaNumbers(newList);
    await saveWaToApi(newList);
  };

  const startEdit = (wa: WaNumber) => { setEditingId(wa.id); setEditForm({ label: wa.label, number: wa.number }); };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    if (!editForm.label || !editForm.number) { alert("Label dan nomor tidak boleh kosong"); return; }
    const newList = waNumbers.map((w) => w.id === id ? { ...w, ...editForm } : w);
    setWaNumbers(newList);
    setEditingId(null);
    await saveWaToApi(newList);
  };

  /* ── QRIS handlers ── */
  const addQris = () => {
    const url = newQrisUrl.trim() || previewUrl;
    if (!url) { alert("Masukkan URL gambar QRIS terlebih dahulu"); return; }
    const newItem: QrisItem = {
      id: String(Date.now()),
      label: newQrisLabel || "QRIS " + (qrisList.length + 1),
      image_url: url,
      is_active: qrisList.length === 0, // first one auto-active
      sort_order: qrisList.length + 1,
      created_at: new Date().toISOString(),
    };
    setQrisList((p) => [...p, newItem]);
    setNewQrisLabel(""); setNewQrisUrl(""); setPreviewUrl("");
  };

  const removeQris = (id: string) => {
    if (!confirm("Hapus QRIS ini?")) return;
    setQrisList((p) => p.filter((q) => q.id !== id));
  };

  const toggleQris = async (id: string) => {
    // Compute new list: only one active at a time
    const updated = qrisList.map((q) => ({
      ...q,
      is_active: q.id === id ? !q.is_active : false,
    }));
    setQrisList(updated);
    // Auto-save immediately so frontend picks up the change
    try {
      await fetch("/api/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list: updated }),
      });
    } catch { /* silent — user can still use Simpan button */ }
  };

  const saveQris = async () => {
    if (qrisList.length === 0) { alert("Tambahkan minimal 1 QRIS terlebih dahulu"); return; }
    setQrisSaving(true);
    try {
      const res  = await fetch("/api/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list: qrisList }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Gagal menyimpan");
      // Reload from server to confirm
      const reload = await fetch("/api/qris?all=true");
      const rd     = await reload.json();
      if (rd.list) setQrisList(rd.list);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Gagal menyimpan QRIS: " + (err instanceof Error ? err.message : String(err)));
    } finally { setQrisSaving(false); }
  };

  const saveWa = async () => {
    setWaSaving(true);
    try {
      await saveWaToApi(waNumbers);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { /* error already alerted in saveWaToApi */ }
    finally { setWaSaving(false); }
  };

  const saveSeo = async () => {
    setSeoSaving(true);
    try {
      // Strip @ from Telegram username if present
      const cleanWidget = {
        ...widget,
        tg_widget_username: widget.tg_widget_username.replace(/^@/, "").trim(),
      };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { ...seo, ...cleanWidget } }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      // Reload to confirm
      const reload = await fetch(`/api/settings?t=${Date.now()}`);
      const rd = await reload.json();
      if (rd.settings) {
        const s = rd.settings;
        setSeo({ meta_title: s.meta_title, meta_description: s.meta_description, meta_keywords: s.meta_keywords, ga_script: s.ga_script, pixel_script: s.pixel_script, widget_script: s.widget_script });
        setWidget({ wa_widget_number: s.wa_widget_number, wa_widget_label: s.wa_widget_label, wa_widget_enabled: s.wa_widget_enabled, wa2_widget_number: s.wa2_widget_number, wa2_widget_label: s.wa2_widget_label, wa2_widget_enabled: s.wa2_widget_enabled, tg_widget_username: s.tg_widget_username, tg_widget_label: s.tg_widget_label, tg_widget_enabled: s.tg_widget_enabled });
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Gagal simpan: " + (err instanceof Error ? err.message : String(err)));
    } finally { setSeoSaving(false); }
  };

  const handleSave = () => {
    if (activeTab === "wa") saveWa();
    else saveSeo();
  };

  /* ── Theme handlers ── */
  const selectPreset = (preset: ColorTheme) => {
    setColorTheme(preset);
    setThemePreview(preset);
    applyThemeToDom(preset); // live preview
  };

  const saveTheme = async () => {
    setThemeSaving(true);
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: colorTheme }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Gagal menyimpan tema");
      // Clear localStorage cache so all pages reload the new theme
      try { localStorage.removeItem("rajadigital_color_theme"); } catch {}
      applyThemeToDom(colorTheme);
      setThemePreview(null);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Gagal simpan tema: " + (err instanceof Error ? err.message : String(err)));
    } finally { setThemeSaving(false); }
  };

  const tabs = [
    { key: "wa",      label: "WhatsApp",       icon: Phone   },
    { key: "seo",     label: "SEO & Meta",     icon: Globe   },
    { key: "widget",  label: "Widget",          icon: Code    },
    { key: "qris",    label: "QRIS Barcode",   icon: QrCode  },
    { key: "theme",   label: "Tema Warna",      icon: Palette },
    { key: "runtext", label: "Running Text",   icon: Type    },
  ];

  /* ── Running Text handlers ── */
  const addRtItem = () => {
    if (!newRtText.trim()) { alert("Isi teks terlebih dahulu"); return; }
    const item: RunningTextItem = { id: String(Date.now()), text: newRtText.trim(), emoji: newRtEmoji, active: true };
    setRt((prev) => ({ ...prev, items: [...prev.items, item] }));
    setNewRtText(""); setNewRtEmoji("🔥");
  };
  const removeRtItem = (id: string) => setRt((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
  const toggleRtItem = (id: string) => setRt((prev) => ({ ...prev, items: prev.items.map((i) => i.id === id ? { ...i, active: !i.active } : i) }));
  const saveRunningText = async () => {
    setRtSaving(true);
    try {
      const res = await fetch("/api/running-text", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: rt }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Gagal");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Gagal simpan: " + (err instanceof Error ? err.message : String(err)));
    } finally { setRtSaving(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
          Pengaturan Sistem
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Kelola WhatsApp, SEO, widget, dan QRIS pembayaran</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} id={`settings-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === tab.key
                ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }
                : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              <Icon size={15} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ── WA Tab ── */}
      {activeTab === "wa" && (
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>📱 Nomor WhatsApp Admin (Load Balancing)</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Sistem memilih nomor aktif secara bergantian (round-robin). Perubahan <strong>langsung tersimpan</strong> otomatis.
              </p>
            </div>
            {waSaving && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                <Loader2 size={12} className="animate-spin" /> Menyimpan...
              </div>
            )}
          </div>
          <div className="space-y-3 mb-6">
            {waNumbers.map((wa) => (
              <div key={wa.id}>
                {editingId === wa.id ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: "rgba(251,191,36,0.07)", border: "2px solid rgba(251,191,36,0.35)" }}>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input id={`edit-label-${wa.id}`} className="input-styled text-sm" placeholder="Label"
                        value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(wa.id); if (e.key === "Escape") cancelEdit(); }} autoFocus />
                      <input id={`edit-number-${wa.id}`} className="input-styled text-sm font-mono" placeholder="628XXXXXXXXXX"
                        value={editForm.number} onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(wa.id); if (e.key === "Escape") cancelEdit(); }} />
                    </div>
                    <button id={`save-edit-wa-${wa.id}`} onClick={() => saveEdit(wa.id)}
                      disabled={waSaving}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                      {waSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button id={`cancel-edit-wa-${wa.id}`} onClick={cancelEdit}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{wa.label}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>+{wa.number}</div>
                    </div>
                    <span className={`badge flex-shrink-0 ${wa.is_active ? "badge-green" : "badge-red"}`}>
                      {wa.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                    <button id={`edit-wa-${wa.id}`} onClick={() => startEdit(wa)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all hover:opacity-80"
                      style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button id={`toggle-wa-${wa.id}`} onClick={() => toggleWa(wa.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all hover:opacity-80"
                      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      {wa.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button id={`remove-wa-${wa.id}`} onClick={() => removeWa(wa.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {waNumbers.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                Belum ada nomor WhatsApp. Tambahkan di bawah.
              </div>
            )}
          </div>
          <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>TAMBAH NOMOR BARU</p>
            <div className="flex gap-3 flex-wrap sm:flex-nowrap">
              <input id="new-wa-label" className="input-styled flex-1" placeholder="Label (misal: Admin 3)"
                value={newWa.label} onChange={(e) => setNewWa({ ...newWa, label: e.target.value })} />
              <input id="new-wa-number" className="input-styled flex-1" placeholder="628XXXXXXXXXX"
                value={newWa.number} onChange={(e) => setNewWa({ ...newWa, number: e.target.value })} />
              <button id="add-wa-btn" onClick={addWa} className="btn-gold flex items-center gap-2 flex-shrink-0"
                style={{ padding: "12px 18px" }}>
                <Plus size={16} /> Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEO Tab ── */}
      {activeTab === "seo" && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>🌐 SEO & Meta Tags</h2>
          {[
            { key: "meta_title",       label: "Meta Title",       placeholder: "RAJA DIGITAL — Top-Up Royal Dream" },
            { key: "meta_description", label: "Meta Description", placeholder: "Platform top-up game terpercaya..." },
            { key: "meta_keywords",    label: "Meta Keywords",    placeholder: "top up, royal dream, diamond" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{field.label}</label>
              <input id={`seo-${field.key}`} className="input-styled" placeholder={field.placeholder}
                value={seo[field.key as keyof typeof seo]}
                onChange={(e) => setSeo({ ...seo, [field.key]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Google Analytics (GA4) Script</label>
            <textarea id="seo-ga-script" className="input-styled" rows={3} placeholder="<!-- Google tag (gtag.js) -->"
              value={seo.ga_script} onChange={(e) => setSeo({ ...seo, ga_script: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Facebook Pixel Script</label>
            <textarea id="seo-pixel-script" className="input-styled" rows={3} placeholder="<!-- Meta Pixel Code -->"
              value={seo.pixel_script} onChange={(e) => setSeo({ ...seo, pixel_script: e.target.value })} />
          </div>
        </div>
      )}

      {/* ── Widget Tab ── */}
      {activeTab === "widget" && (
        <div className="space-y-5">
          {/* WA Float Button 1 */}
          <div className="card p-6 space-y-4"
            style={{ border: widget.wa_widget_enabled ? "2px solid rgba(16,185,129,0.4)" : "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>💬 Tombol WhatsApp 1 (Floating)</h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Tombol WA untuk pelanggan — berbeda dengan nomor admin order</p>
              </div>
              <button
                id="toggle-wa-widget"
                onClick={() => setWidget((w) => ({ ...w, wa_widget_enabled: !w.wa_widget_enabled }))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0 transition-all"
                style={widget.wa_widget_enabled
                  ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "2px solid #10b981" }
                  : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "2px solid var(--border)" }}
              >
                {widget.wa_widget_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {widget.wa_widget_enabled ? "Aktif" : "Nonaktif"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Nomor WA (628...)</label>
                <input id="wa-widget-number" className="input-styled" placeholder="628123456789"
                  value={widget.wa_widget_number} onChange={(e) => setWidget({ ...widget, wa_widget_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Label Tombol</label>
                <input id="wa-widget-label" className="input-styled" placeholder="Chat Admin"
                  value={widget.wa_widget_label} onChange={(e) => setWidget({ ...widget, wa_widget_label: e.target.value })} />
              </div>
            </div>
            {/* Preview */}
            {widget.wa_widget_enabled && widget.wa_widget_number && (
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Preview:</span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#25d366,#128c7e)", color: "#fff" }}>
                  💬 {widget.wa_widget_label || "Chat Admin"}
                </span>
              </div>
            )}
          </div>

          {/* WA Float Button 2 */}
          <div className="card p-6 space-y-4"
            style={{ border: widget.wa2_widget_enabled ? "2px solid rgba(16,185,129,0.4)" : "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>💬 Tombol WhatsApp 2 (Floating)</h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Tombol WA kedua — tampil terpisah di panel Live Support</p>
              </div>
              <button
                id="toggle-wa2-widget"
                onClick={() => setWidget((w) => ({ ...w, wa2_widget_enabled: !w.wa2_widget_enabled }))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0 transition-all"
                style={widget.wa2_widget_enabled
                  ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "2px solid #10b981" }
                  : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "2px solid var(--border)" }}
              >
                {widget.wa2_widget_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {widget.wa2_widget_enabled ? "Aktif" : "Nonaktif"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Nomor WA (628...)</label>
                <input id="wa2-widget-number" className="input-styled" placeholder="628123456789"
                  value={widget.wa2_widget_number} onChange={(e) => setWidget({ ...widget, wa2_widget_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Label Tombol</label>
                <input id="wa2-widget-label" className="input-styled" placeholder="Chat Admin 2"
                  value={widget.wa2_widget_label} onChange={(e) => setWidget({ ...widget, wa2_widget_label: e.target.value })} />
              </div>
            </div>
            {/* Preview */}
            {widget.wa2_widget_enabled && widget.wa2_widget_number && (
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Preview:</span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#25d366,#128c7e)", color: "#fff" }}>
                  💬 {widget.wa2_widget_label || "Chat Admin 2"}
                </span>
              </div>
            )}
          </div>

          {/* Telegram Float Button */}
          <div className="card p-6 space-y-4"
            style={{ border: widget.tg_widget_enabled ? "2px solid rgba(59,130,246,0.4)" : "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>✈️ Tombol Telegram (Floating)</h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Tambahkan tombol Telegram langsung di halaman frontend</p>
              </div>
              <button
                id="toggle-tg-widget"
                onClick={() => setWidget((w) => ({ ...w, tg_widget_enabled: !w.tg_widget_enabled }))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0 transition-all"
                style={widget.tg_widget_enabled
                  ? { background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "2px solid #3b82f6" }
                  : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "2px solid var(--border)" }}
              >
                {widget.tg_widget_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {widget.tg_widget_enabled ? "Aktif" : "Nonaktif"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Username Telegram <span style={{color:"var(--text-muted)",fontWeight:400}}>(tanpa @)</span></label>
                <input id="tg-widget-username" className="input-styled" placeholder="rajadigital"
                  value={widget.tg_widget_username} onChange={(e) => setWidget({ ...widget, tg_widget_username: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Label Tombol</label>
                <input id="tg-widget-label" className="input-styled" placeholder="Telegram"
                  value={widget.tg_widget_label} onChange={(e) => setWidget({ ...widget, tg_widget_label: e.target.value })} />
              </div>
            </div>
            {/* Preview */}
            {widget.tg_widget_enabled && widget.tg_widget_username && (
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Preview:</span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#229ed9,#1a7bbf)", color: "#fff" }}>
                  ✈️ {widget.tg_widget_label || "Telegram"}
                </span>
              </div>
            )}
          </div>

          {/* Custom Script */}
          <div className="card p-6 space-y-3">
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>🔧 Custom Script</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Script tambahan (Crisp, Tawk.to, dll) — diinjeksi sebelum &lt;/body&gt;</p>
            <textarea id="widget-script" className="input-styled font-mono" rows={6}
              placeholder={"<!-- Script kustom -->\n<script>...</script>"}
              value={seo.widget_script} onChange={(e) => setSeo({ ...seo, widget_script: e.target.value })} />
          </div>
        </div>
      )}

      {/* ── QRIS Tab ── */}
      {activeTab === "qris" && (
        <div className="card p-6">
          <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>📲 Kelola QRIS Pembayaran</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Upload barcode QRIS kamu. Hanya satu QRIS yang dapat aktif sekaligus — QRIS aktif akan ditampilkan di modal pembayaran frontend.
          </p>

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl p-3 mb-5"
            style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <QrCode size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: "#fbbf24" }}>
              Gunakan gambar QRIS berukuran minimal <strong>300×300px</strong>. Format yang disarankan: PNG atau JPG.
              Pastikan QR code terlihat jelas dan tidak terpotong.
            </p>
          </div>

          {/* QRIS List */}
          {qrisLoading ? (
            <div className="flex items-center justify-center py-8 gap-2" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={18} className="animate-spin" /> Memuat data QRIS...
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {qrisList.length === 0 && (
                <div className="text-center py-10 rounded-2xl"
                  style={{ background: "var(--bg-secondary)", border: "2px dashed var(--border)", color: "var(--text-muted)" }}>
                  <QrCode size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Belum ada QRIS. Tambahkan di bawah.</p>
                </div>
              )}
              {qrisList.map((qris) => (
                <div key={qris.id} className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                  style={{
                    background: qris.is_active ? "rgba(16,185,129,0.06)" : "var(--bg-secondary)",
                    border: qris.is_active ? "2px solid rgba(16,185,129,0.3)" : "1px solid var(--border)",
                  }}>
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "#fff", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qris.image_url} alt={qris.label} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{qris.label}</div>
                    <div className="text-xs truncate mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                      {qris.image_url}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`badge flex-shrink-0 ${qris.is_active ? "badge-green" : ""}`}
                    style={!qris.is_active ? { background: "var(--bg-primary)", color: "var(--text-muted)", border: "1px solid var(--border)" } : {}}>
                    {qris.is_active ? "✅ Aktif" : "Nonaktif"}
                  </span>

                  {/* Toggle */}
                  <button id={`toggle-qris-${qris.id}`} onClick={() => toggleQris(qris.id)}
                    title={qris.is_active ? "Nonaktifkan" : "Aktifkan"}
                    className="flex-shrink-0 transition-all hover:opacity-80"
                    style={{ color: qris.is_active ? "#10b981" : "var(--text-muted)" }}>
                    {qris.is_active
                      ? <ToggleRight size={26} />
                      : <ToggleLeft size={26} />}
                  </button>

                  {/* Delete */}
                  <button id={`remove-qris-${qris.id}`} onClick={() => removeQris(qris.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add QRIS form */}
          <div className="pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-4" style={{ color: "var(--text-muted)" }}>TAMBAH QRIS BARU</p>
            <div className="space-y-3">
              <input id="new-qris-label" className="input-styled" placeholder="Label (misal: QRIS BCA, QRIS GoPay)"
                value={newQrisLabel} onChange={(e) => setNewQrisLabel(e.target.value)} />

              <div className="flex gap-3">
                <input id="new-qris-url" className="input-styled flex-1"
                  placeholder="URL gambar QRIS (https://...)"
                  value={newQrisUrl}
                  onChange={(e) => {
                  const val = e.target.value;
                  setNewQrisUrl(val);
                  // Only preview if looks like a valid URL
                  setPreviewUrl(val.startsWith("http") ? val : "");
                }} />
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "#fff", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview QRIS"
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                      onError={() => setPreviewUrl("")} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Preview QRIS</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Pastikan QR code terlihat jelas</p>
                  </div>
                </div>
              )}

              <button id="add-qris-btn" onClick={addQris}
                className="btn-gold flex items-center gap-2"
                style={{ padding: "12px 20px" }}>
                <Plus size={16} /> Tambah QRIS
              </button>
            </div>
          </div>

          {/* Save QRIS */}
          <div className="mt-6 flex justify-end">
            <button id="save-qris-btn" onClick={saveQris} disabled={qrisSaving}
              className="btn-gold flex items-center gap-2" style={{ padding: "12px 28px" }}>
              {qrisSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saved ? "✅ Tersimpan!" : "Simpan QRIS"}
            </button>
          </div>
        </div>
      )}

      {/* ── Theme Tab ── */}
      {activeTab === "theme" && (
        <div className="space-y-6">
          {/* Preview bar */}
          <div className="card p-4 flex items-center gap-4 flex-wrap">
            <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Preview Aktif:</div>
            <div className="flex items-center gap-2 flex-wrap">
              {["gold", "purple", "amber"].map((key) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full border-2" style={{
                    background: key === "gold" ? colorTheme.goldLight
                      : key === "purple" ? colorTheme.purpleLight
                      : colorTheme.amberLight,
                    borderColor: "rgba(255,255,255,0.2)"
                  }} />
                  <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{key}</span>
                </div>
              ))}
              <div className="ml-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: colorTheme.goldLight, color: "#0a0a14" }}>
                {colorTheme.name}
              </div>
              {themePreview && (
                <span className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                  ⚡ Live Preview
                </span>
              )}
            </div>
          </div>

          {/* Preset themes */}
          <div className="card p-6">
            <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>🎨 Pilih Preset Tema</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Klik tema untuk melihat preview langsung. Klik Simpan untuk menerapkan ke seluruh website.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_THEMES.map((preset) => {
                const isActive = colorTheme.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    id={`theme-preset-${preset.id}`}
                    onClick={() => selectPreset(preset)}
                    className="text-left p-4 rounded-2xl transition-all"
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${preset.bgCardDark}, ${preset.bgSecondaryDark})` : "var(--bg-secondary)",
                      border: isActive ? `2px solid ${preset.goldLight}` : "2px solid var(--border)",
                      boxShadow: isActive ? `0 0 20px ${preset.gold}40` : "none",
                      transform: isActive ? "translateY(-2px)" : "none",
                    }}
                  >
                    {/* Color swatches */}
                    <div className="flex gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background: preset.goldLight, boxShadow: `0 0 10px ${preset.gold}60` }} />
                      <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background: preset.purpleLight, boxShadow: `0 0 10px ${preset.purple}60` }} />
                      <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background: preset.amberLight, boxShadow: `0 0 10px ${preset.amber}60` }} />
                      <div className="w-8 h-8 rounded-xl flex-shrink-0 border" style={{ background: preset.bgCardDark, borderColor: "rgba(255,255,255,0.1)" }} />
                    </div>
                    <div className="font-semibold text-sm" style={{ color: isActive ? preset.goldLight : "var(--text-primary)" }}>
                      {preset.name}
                    </div>
                    {isActive && (
                      <div className="text-xs mt-1 font-bold" style={{ color: preset.goldLight }}>✓ Dipilih</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom color pickers */}
          <div className="card p-6">
            <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>🖌️ Kustomisasi Warna</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Ubah warna individual untuk membuat tema unikmu sendiri.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Gold group */}
              <div className="space-y-3 p-4 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Warna Aksen 1 (Gold)</p>
                {([
                  { key: "goldLight",  label: "Light" },
                  { key: "gold",       label: "Base"  },
                  { key: "goldDark",   label: "Dark"  },
                ] as { key: keyof ColorTheme; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" id={`color-${key}`}
                      value={colorTheme[key] as string}
                      onChange={(e) => {
                        const updated = { ...colorTheme, [key]: e.target.value };
                        setColorTheme(updated);
                        applyThemeToDom(updated);
                        setThemePreview(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5"
                      style={{ background: "transparent" }}
                    />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{colorTheme[key] as string}</div>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-lg" style={{ background: colorTheme[key] as string }} />
                  </div>
                ))}
              </div>

              {/* Purple group */}
              <div className="space-y-3 p-4 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Warna Aksen 2 (Purple)</p>
                {([
                  { key: "purpleLight", label: "Light" },
                  { key: "purple",      label: "Base"  },
                  { key: "purpleDark",  label: "Dark"  },
                ] as { key: keyof ColorTheme; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" id={`color-${key}`}
                      value={colorTheme[key] as string}
                      onChange={(e) => {
                        const updated = { ...colorTheme, [key]: e.target.value };
                        setColorTheme(updated);
                        applyThemeToDom(updated);
                        setThemePreview(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5"
                      style={{ background: "transparent" }}
                    />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{colorTheme[key] as string}</div>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-lg" style={{ background: colorTheme[key] as string }} />
                  </div>
                ))}
              </div>

              {/* Amber group */}
              <div className="space-y-3 p-4 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Warna Aksen 3 (Amber)</p>
                {([
                  { key: "amberLight", label: "Light" },
                  { key: "amber",      label: "Base"  },
                ] as { key: keyof ColorTheme; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" id={`color-${key}`}
                      value={colorTheme[key] as string}
                      onChange={(e) => {
                        const updated = { ...colorTheme, [key]: e.target.value };
                        setColorTheme(updated);
                        applyThemeToDom(updated);
                        setThemePreview(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5"
                      style={{ background: "transparent" }}
                    />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{colorTheme[key] as string}</div>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-lg" style={{ background: colorTheme[key] as string }} />
                  </div>
                ))}
              </div>

              {/* Dark BG group */}
              <div className="space-y-3 p-4 rounded-2xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Background Dark Mode</p>
                {([
                  { key: "bgPrimaryDark",   label: "Primary BG"   },
                  { key: "bgSecondaryDark", label: "Secondary BG" },
                  { key: "bgCardDark",      label: "Card BG"      },
                ] as { key: keyof ColorTheme; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" id={`color-${key}`}
                      value={colorTheme[key] as string}
                      onChange={(e) => {
                        const updated = { ...colorTheme, [key]: e.target.value };
                        setColorTheme(updated);
                        applyThemeToDom(updated);
                        setThemePreview(updated);
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5"
                      style={{ background: "transparent" }}
                    />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{colorTheme[key] as string}</div>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-lg border" style={{ background: colorTheme[key] as string, borderColor: "rgba(255,255,255,0.15)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reset + Save */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
              id="reset-theme-btn"
              onClick={() => selectPreset(PRESET_THEMES[0])}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              <RefreshCw size={15} /> Reset ke Default
            </button>
            <button id="save-theme-btn" onClick={saveTheme} disabled={themeSaving}
              className="btn-gold flex items-center gap-2" style={{ padding: "12px 28px" }}>
              {themeSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saved ? "✅ Tema Tersimpan!" : "Simpan & Terapkan Tema"}
            </button>
          </div>
        </div>
      )}

      {/* ── Running Text Tab ── */}
      {activeTab === "runtext" && (
        <div className="space-y-5">

          {/* Enable/Disable card */}
          <div className="card p-5 flex items-center justify-between gap-4"
            style={{ border: rt.enabled ? "2px solid rgba(16,185,129,0.4)" : "1px solid var(--border)" }}>
            <div>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>📢 Running Text / Ticker</h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Teks berjalan tampil di bawah banner utama halaman depan.</p>
            </div>
            <button id="toggle-rt-enabled"
              onClick={() => setRt((p) => ({ ...p, enabled: !p.enabled }))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0 transition-all"
              style={rt.enabled
                ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "2px solid #10b981" }
                : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "2px solid var(--border)" }}>
              {rt.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {rt.enabled ? "Aktif" : "Nonaktif"}
            </button>
          </div>

          {/* Live preview */}
          <div className="card p-4">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>PREVIEW</p>
            <div className="overflow-hidden rounded-xl" style={{ background: rt.bgColor }}>
              <div style={{ padding: "10px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
                {rt.items.filter(i => i.active).map((item, idx) => (
                  <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: rt.textColor, fontSize: "13px", fontWeight: 700, padding: "0 20px" }}>
                    <span style={{ fontSize: "15px" }}>{item.emoji}</span>{item.text}
                    <span style={{ marginLeft: "10px", opacity: 0.5, fontSize: "10px" }}>{rt.separator}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Items list */}
          <div className="card p-6">
            <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>📋 Daftar Teks</h2>
            <div className="space-y-3 mb-5">
              {rt.items.length === 0 && (
                <div className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>Belum ada teks. Tambahkan di bawah.</div>
              )}
              {rt.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg-secondary)", border: item.active ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)" }}>
                  <GripVertical size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{item.text}</span>
                  <span className={`badge flex-shrink-0 ${item.active ? "badge-green" : ""}`}
                    style={!item.active ? { background: "var(--bg-primary)", color: "var(--text-muted)", border: "1px solid var(--border)" } : {}}>
                    {item.active ? "Aktif" : "Nonaktif"}
                  </span>
                  <button id={`toggle-rt-${item.id}`} onClick={() => toggleRtItem(item.id)}
                    className="flex-shrink-0" style={{ color: item.active ? "#10b981" : "var(--text-muted)" }}>
                    {item.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button id={`remove-rt-${item.id}`} onClick={() => removeRtItem(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new item */}
            <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>TAMBAH TEKS BARU</p>
              <div className="flex gap-3 flex-wrap">
                <input id="new-rt-emoji" className="input-styled" placeholder="Emoji" value={newRtEmoji}
                  onChange={(e) => setNewRtEmoji(e.target.value)}
                  style={{ width: "80px", flexShrink: 0 }} />
                <input id="new-rt-text" className="input-styled flex-1" placeholder="Teks berjalan..."
                  value={newRtText} onChange={(e) => setNewRtText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRtItem()} />
                <button id="add-rt-btn" onClick={addRtItem} className="btn-gold flex items-center gap-2 flex-shrink-0"
                  style={{ padding: "12px 18px" }}>
                  <Plus size={16} /> Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Style settings */}
          <div className="card p-6">
            <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>🎨 Tampilan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Speed */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  Kecepatan: <strong>{rt.speed}</strong>
                  <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>(lebih tinggi = lebih cepat)</span>
                </label>
                <input id="rt-speed" type="range" min={20} max={100} step={5} value={rt.speed}
                  onChange={(e) => setRt((p) => ({ ...p, speed: Number(e.target.value) }))}
                  className="w-full" style={{ accentColor: "var(--gold-light)" }} />
                <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  <span>Lambat</span><span>Cepat</span>
                </div>
              </div>

              {/* Separator */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Pemisah Antar Teks</label>
                <div className="flex gap-2 flex-wrap">
                  {["✦", "•", "❯", "★", "◆", "⚡", "|", "//"].map((sep) => (
                    <button key={sep} id={`rt-sep-${sep}`}
                      onClick={() => setRt((p) => ({ ...p, separator: sep }))}
                      className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                      style={rt.separator === sep
                        ? { background: "var(--gold-light)", color: "#0a0a14" }
                        : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      {sep}
                    </button>
                  ))}
                </div>
              </div>

              {/* BG Color */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Warna Background</label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: "Gold",   val: "#c8961a" },
                    { label: "Purple", val: "#6d28d9" },
                    { label: "Teal",   val: "#0d9488" },
                    { label: "Red",    val: "#dc2626" },
                    { label: "Dark",   val: "#1a1828" },
                  ].map((c) => (
                    <button key={c.val}
                      onClick={() => setRt((p) => ({ ...p, bgColor: c.val }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={rt.bgColor === c.val
                        ? { background: c.val, color: "#fff", border: "2px solid rgba(255,255,255,0.5)", boxShadow: `0 0 12px ${c.val}80` }
                        : { background: c.val, color: "#fff", border: "2px solid transparent", opacity: 0.6 }}>
                      {c.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-2">
                    <input type="color" id="rt-bg-custom" value={rt.bgColor.startsWith("#") ? rt.bgColor : "#c8961a"}
                      onChange={(e) => setRt((p) => ({ ...p, bgColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5" style={{ background: "transparent" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Custom</span>
                  </div>
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Warna Teks</label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: "Hitam", val: "#0a0a14" },
                    { label: "Putih", val: "#ffffff" },
                    { label: "Gold",  val: "#f5c842" },
                    { label: "Krem",  val: "#fef3c7" },
                  ].map((c) => (
                    <button key={c.val}
                      onClick={() => setRt((p) => ({ ...p, textColor: c.val }))}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={rt.textColor === c.val
                        ? { background: c.val === "#0a0a14" ? "#fff" : c.val, color: c.val === "#0a0a14" ? "#0a0a14" : "#0a0a14", border: `2px solid ${c.val}`, boxShadow: `0 0 10px ${c.val}60` }
                        : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      {c.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-2">
                    <input type="color" id="rt-text-custom" value={rt.textColor}
                      onChange={(e) => setRt((p) => ({ ...p, textColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5" style={{ background: "transparent" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Custom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button id="save-rt-btn" onClick={saveRunningText} disabled={rtSaving}
              className="btn-gold flex items-center gap-2" style={{ padding: "12px 28px" }}>
              {rtSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saved ? "✅ Tersimpan!" : "Simpan Running Text"}
            </button>
          </div>
        </div>
      )}

      {/* Save button for WA, SEO, Widget tabs */}
      {activeTab !== "qris" && activeTab !== "theme" && activeTab !== "runtext" && (
        <div className="mt-6 flex justify-end">
          <button id="save-settings-btn" onClick={handleSave}
            disabled={waSaving || seoSaving}
            className="btn-gold flex items-center gap-2" style={{ padding: "12px 28px" }}>
            {(waSaving || seoSaving) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saved ? "✅ Tersimpan!" : "Simpan Pengaturan"}
          </button>
        </div>
      )}
    </div>
  );
}
