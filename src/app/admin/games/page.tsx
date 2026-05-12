"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, X, Save, Loader2,
  RefreshCw, ToggleLeft, ToggleRight, Flame, Sparkles,
  Upload, ImageIcon, CheckCircle,
} from "lucide-react";
import type { Game, GameCurrency } from "@/lib/games";

const CURRENCY_PRESETS = [
  { label: "Diamond", icon: "💎" },
  { label: "UC",      icon: "🪙" },
  { label: "Koin",    icon: "🪙" },
  { label: "Chip",    icon: "🎰" },
  { label: "Gold",    icon: "🥇" },
  { label: "Voucher", icon: "🎫" },
];

const COLOR_PRESETS = [
  "#fbbf24","#3b82f6","#f97316","#eab308",
  "#22c55e","#a78bfa","#ec4899","#14b8a6",
];

type GameForm = Omit<Game, "id"> & { extraCurrencyInput: string; extraCurrencyIconInput: string };

const EMPTY_FORM: GameForm = {
  slug: "", name: "", publisher: "", description: "",
  cover: "", emoji: "🎮", currency: "Diamond", currencyIcon: "💎", currencyImage: "",
  extraCurrencies: [], extraCurrencyInput: "", extraCurrencyIconInput: "✨",
  color: "#fbbf24", gradient: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
  isActive: true, isHot: false, isNew: false, sortOrder: 0,
};

export default function AdminGamesPage() {
  const [games,        setGames]        = useState<Game[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<Game | null>(null);
  const [form,         setForm]         = useState<GameForm>(EMPTY_FORM);
  const [refreshKey,   setRefreshKey]   = useState(Date.now()); // cache-bust images

  // Cover image upload state
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading,    setUploading]    = useState(false);
  const [uploadDone,   setUploadDone]   = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currency icon upload state (key -> { preview, uploading, done })
  const [currencyIconUploading, setCurrencyIconUploading] = useState<Record<string, boolean>>({});
  const currencyIconRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* ── Fetch ── */
  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/games", { cache: "no-store" });
      const data = await res.json();
      if (data.games) setGames(data.games);
      setRefreshKey(Date.now()); // update key untuk refresh gambar
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  /* ── Open form ── */
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setUploadDone(false);
    setShowForm(true);
  };

  const openEdit = (g: Game) => {
    setEditing(g);
    setForm({ ...g, extraCurrencyInput: "", extraCurrencyIconInput: "✨" });
    setImageFile(null);
    setImagePreview(g.cover || "");
    setUploadDone(false);
    setShowForm(true);
  };

  /* ── Image handling ── */
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("File harus berupa gambar"); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Ukuran file maksimal 2MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadDone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const uploadImage = async (slug: string): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      fd.append("slug", slug);
      const res  = await fetch("/api/admin/games/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadDone(true);
      // Pakai coverBust (ada ?v=timestamp) untuk preview agar tidak cache
      if (data.coverBust) setImagePreview(data.coverBust);
      return data.cover; // path clean untuk disimpan ke DB
    } catch (e) {
      alert(`Upload gagal: ${e instanceof Error ? e.message : "error"}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  /* ── Extra currencies ── */
  const addExtraCurrency = (label: string, icon: string) => {
    const key = label.toLowerCase();
    setForm((f) => {
      const current = f.extraCurrencies || [];
      if (current.find((c) => c.key === key)) return f;
      return { ...f, extraCurrencies: [...current, { key, label, icon }] };
    });
  };
  const removeExtraCurrency = (key: string) =>
    setForm((f) => ({ ...f, extraCurrencies: (f.extraCurrencies || []).filter((c) => c.key !== key) }));

  /* ── Upload Currency Icon ── */
  const uploadCurrencyIcon = async (file: File, currencyKey: string) => {
    if (!file.type.startsWith("image/")) { alert("File harus berupa gambar"); return; }
    if (file.size > 500 * 1024) { alert("Ukuran file icon maksimal 500KB"); return; }

    const slug = editing?.slug ?? form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) { alert("Simpan game terlebih dahulu sebelum upload icon currency"); return; }

    setCurrencyIconUploading(prev => ({ ...prev, [currencyKey]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", slug);
      fd.append("currencyKey", currencyKey);
      const res  = await fetch("/api/admin/games/upload-currency", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update form state with new image URL
      if (currencyKey === "__primary__") {
        setForm(f => ({ ...f, currencyImage: data.imageUrl }));
      } else {
        setForm(f => ({
          ...f,
          extraCurrencies: f.extraCurrencies.map(c =>
            c.key === currencyKey ? { ...c, currencyImage: data.imageUrl } : c
          ),
        }));
      }
    } catch (e) {
      alert(`Upload icon gagal: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setCurrencyIconUploading(prev => ({ ...prev, [currencyKey]: false }));
    }
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.name || !form.currency) { alert("Nama dan mata uang wajib diisi"); return; }
    setSaving(true);
    try {
      // Determine slug
      const slug = editing?.slug ?? form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      // Upload image first if there's a new file
      let coverPath = form.cover;
      if (imageFile) {
        const uploaded = await uploadImage(slug);
        if (uploaded) coverPath = uploaded;
      }

      const payload = {
        name: form.name, publisher: form.publisher, description: form.description,
        emoji: form.emoji, currency: form.currency, currencyIcon: form.currencyIcon,
        currencyImage: form.currencyImage ?? "",
        extraCurrencies: form.extraCurrencies, color: form.color, gradient: form.gradient,
        isActive: form.isActive, isHot: form.isHot, isNew: form.isNew,
        sortOrder: form.sortOrder, cover: coverPath,
      };

      if (editing) {
        await fetch(`/api/admin/games/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/admin/games", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      }

      setShowForm(false);
      fetchGames();
    } catch (e) { alert(`Gagal: ${e instanceof Error ? e.message : "error"}`); }
    finally { setSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async (g: Game) => {
    if (!confirm(`Hapus game "${g.name}"? Semua produk game ini tidak akan terhapus.`)) return;
    try {
      await fetch(`/api/admin/games/${g.id}`, { method: "DELETE" });
      setGames((prev) => prev.filter((x) => x.id !== g.id));
    } catch { alert("Gagal menghapus game"); }
  };

  /* ── Toggle ── */
  const toggleActive = async (g: Game) => {
    setGames((prev) => prev.map((x) => x.id === g.id ? { ...x, isActive: !x.isActive } : x));
    await fetch(`/api/admin/games/${g.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !g.isActive }),
    });
  };

  const currentSlug = editing?.slug ?? form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            Kelola Game
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{games.length} game terdaftar</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchGames}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={openAdd} className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Plus size={16} /> Tambah Game
          </button>
        </div>
      </div>

      {/* Game cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="skeleton w-16 h-16 rounded-xl" />
                <div className="flex-1"><div className="skeleton h-5 w-32 mb-2" /><div className="skeleton h-3 w-24" /></div>
              </div>
              <div className="skeleton h-3 w-full mb-2" /><div className="skeleton h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => (
            <div key={g.id} className="card p-4 transition-all hover:border-opacity-100"
              style={{ borderColor: `${g.color}30` }}>
              <div className="flex items-start gap-4 mb-3">
                {/* Cover dengan unoptimized + cache-busting */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: `${g.color}20`, boxShadow: `0 0 16px ${g.color}30` }}>
                  {g.cover ? (
                    <Image
                      src={`${g.cover}?v=${refreshKey}`}
                      alt={g.name} fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center text-2xl"
                    style={{ zIndex: -1 }}>{g.emoji}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{g.name}</span>
                    {g.isHot && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>🔥</span>}
                    {g.isNew && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#10b98120", color: "#10b981" }}>✨</span>}
                  </div>
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{g.publisher}</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${g.color}20`, color: g.color, border: `1px solid ${g.color}40` }}>
                      {g.currencyIcon} {g.currency}
                    </span>
                    {(g.extraCurrencies ?? []).map((c: GameCurrency) => (
                      <span key={c.key} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        {c.icon} {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover path info */}
              <div className="text-xs mb-3 flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                style={{ background: "var(--bg-secondary)" }}>
                <ImageIcon size={12} style={{ color: g.cover ? "#10b981" : "var(--text-muted)", flexShrink: 0 }} />
                <span className="truncate font-mono" style={{ color: g.cover ? "#10b981" : "#ef4444" }}>
                  {g.cover || `Belum ada gambar`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(g)}
                  className={`badge cursor-pointer transition-all hover:opacity-80 ${g.isActive ? "badge-green" : "badge-red"}`}>
                  {g.isActive ? <><ToggleRight size={14} /> Aktif</> : <><ToggleLeft size={14} /> Nonaktif</>}
                </button>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => openEdit(g)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                    style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(g)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content" style={{ maxWidth: 580, maxHeight: "92vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                {editing ? `Edit: ${editing.name}` : "Tambah Game Baru"}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">

              {/* ── IMAGE UPLOAD SECTION ── */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  🖼️ Cover Game
                </label>

                <div className="flex gap-4 items-start">
                  {/* Preview */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
                    style={{
                      background: `${form.color}20`,
                      border: `2px dashed ${form.color}50`,
                    }}>
                    {imagePreview ? (
                      <Image src={imagePreview} alt="preview" fill className="object-cover" sizes="96px" unoptimized />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <ImageIcon size={24} style={{ color: `${form.color}80` }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>No image</span>
                      </div>
                    )}
                    {uploadDone && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(16,185,129,0.8)" }}>
                        <CheckCircle size={28} color="white" />
                      </div>
                    )}
                  </div>

                  {/* Drop zone */}
                  <div className="flex-1">
                    <div
                      className="relative rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                      style={{
                        height: 96,
                        border: dragOver ? `2px solid ${form.color}` : "2px dashed var(--border)",
                        background: dragOver ? `${form.color}10` : "var(--bg-secondary)",
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={20} style={{ color: form.color }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        Klik atau drag & drop gambar
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        PNG, JPG, WebP · Max 2MB
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                      />
                    </div>

                    {imageFile && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <ImageIcon size={12} style={{ color: "#fbbf24" }} />
                        <span className="text-xs truncate" style={{ color: "#fbbf24" }}>{imageFile.name}</span>
                        <button onClick={() => { setImageFile(null); setImagePreview(editing?.cover || ""); setUploadDone(false); }}
                          className="ml-auto" style={{ color: "var(--text-muted)" }}>
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    <p className="text-xs mt-2 px-1" style={{ color: "var(--text-muted)" }}>
                      Gambar akan disimpan ke: <code className="text-amber-400">public/games/{currentSlug || "slug"}.png</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Nama + Emoji */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Emoji</label>
                  <input className="input-styled text-center text-2xl" placeholder="🎮"
                    value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Nama Game *</label>
                  <input className="input-styled" placeholder="Contoh: Mobile Legends"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>

              {/* ── Currency Icon Images ── */}
              {(form.currency || form.extraCurrencies.length > 0) && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                    🖼️ Icon Mata Uang PNG
                    <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>— opsional, ganti emoji di card produk (maks 500KB)</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: "__primary__", label: form.currency || "Primary", emoji: form.currencyIcon || "💸", currentImage: form.currencyImage ?? "" },
                      ...form.extraCurrencies.map(c => ({ key: c.key, label: c.label, emoji: c.icon, currentImage: c.currencyImage ?? "" }))
                    ].map(({ key, label, emoji: catEmoji, currentImage }) => (
                      <div key={key} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                        {/* Preview 38x38 */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
                          {currentImage
                            ? <img src={`${currentImage}?v=${refreshKey}`} alt={label} style={{ width: 38, height: 38, objectFit: "contain" }} />
                            : <span style={{ fontSize: 20 }}>{catEmoji}</span>}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
                          <div className="text-xs truncate mt-0.5" style={{ color: currentImage ? "#10b981" : "var(--text-muted)" }}>
                            {currentImage || "Pakai emoji"}
                          </div>
                        </div>
                        {/* Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {currentImage && (
                            <button type="button"
                              onClick={() => {
                                if (key === "__primary__") setForm(f => ({ ...f, currencyImage: "" }));
                                else setForm(f => ({ ...f, extraCurrencies: f.extraCurrencies.map(c => c.key === key ? { ...c, currencyImage: "" } : c) }));
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                              <X size={12} />
                            </button>
                          )}
                          <label htmlFor={`currency-img-${key}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-80"
                            style={{ background: "rgba(251,191,36,0.15)", color: "#f59e0b", border: "1px solid rgba(251,191,36,0.3)" }}>
                            {currencyIconUploading[key] ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            Upload PNG
                          </label>
                          <input id={`currency-img-${key}`} type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            ref={el => { currencyIconRefs.current[key] = el; }}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCurrencyIcon(f, key); e.target.value = ""; }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Publisher / Developer</label>
                <input className="input-styled" placeholder="Contoh: Moonton"
                  value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Deskripsi</label>
                <textarea className="input-styled" rows={2} placeholder="Deskripsi singkat game..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Mata Uang Utama */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Mata Uang Utama *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CURRENCY_PRESETS.map((c) => (
                    <button key={c.label} type="button"
                      onClick={() => setForm({ ...form, currency: c.label, currencyIcon: c.icon })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={form.currency === c.label
                        ? { background: "rgba(251,191,36,0.2)", border: "2px solid #fbbf24", color: "#fbbf24" }
                        : { background: "var(--bg-secondary)", border: "2px solid var(--border)", color: "var(--text-secondary)" }}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-styled" placeholder="Nama custom (misal: Gems)"
                    value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                  <input className="input-styled text-center" placeholder="Icon 💎"
                    value={form.currencyIcon} onChange={(e) => setForm({ ...form, currencyIcon: e.target.value })} />
                </div>
              </div>

              {/* Mata Uang Tambahan */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Mata Uang Tambahan (opsional)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CURRENCY_PRESETS.filter((c) => c.label !== form.currency).map((c) => (
                    <button key={c.label} type="button" onClick={() => addExtraCurrency(c.label, c.icon)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={form.extraCurrencies.find((x) => x.key === c.label.toLowerCase())
                        ? { background: "rgba(16,185,129,0.15)", border: "2px solid #10b981", color: "#10b981" }
                        : { background: "var(--bg-secondary)", border: "2px solid var(--border)", color: "var(--text-secondary)" }}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
                {form.extraCurrencies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.extraCurrencies.map((c: GameCurrency) => (
                      <div key={c.key} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <span className="text-xs" style={{ color: "#10b981" }}>{c.icon} {c.label}</span>
                        <button onClick={() => removeExtraCurrency(c.key)} className="ml-1" style={{ color: "#10b981" }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-12 gap-2 mt-2">
                  <input className="input-styled col-span-7" placeholder="Nama custom (misal: Gems)"
                    value={form.extraCurrencyInput} onChange={(e) => setForm({ ...form, extraCurrencyInput: e.target.value })} 
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (form.extraCurrencyInput.trim()) {
                          addExtraCurrency(form.extraCurrencyInput.trim(), form.extraCurrencyIconInput || "✨");
                          setForm(f => ({ ...f, extraCurrencyInput: "", extraCurrencyIconInput: "✨" }));
                        }
                      }
                    }}
                  />
                  <input className="input-styled text-center col-span-3" placeholder="Icon ✨"
                    value={form.extraCurrencyIconInput} onChange={(e) => setForm({ ...form, extraCurrencyIconInput: e.target.value })} 
                  />
                  <button type="button"
                    onClick={() => {
                      if (form.extraCurrencyInput.trim()) {
                        addExtraCurrency(form.extraCurrencyInput.trim(), form.extraCurrencyIconInput || "✨");
                        setForm(f => ({ ...f, extraCurrencyInput: "", extraCurrencyIconInput: "✨" }));
                      }
                    }}
                    className="btn-gold flex items-center justify-center col-span-2 rounded-xl text-xs font-bold"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Warna brand */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Warna Brand</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                      style={{ background: c, border: form.color === c ? "3px solid white" : "2px solid transparent" }} />
                  ))}
                </div>
                <input type="text" className="input-styled font-mono" placeholder="#fbbf24"
                  value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Urutan Tampil</label>
                <input type="number" className="input-styled" placeholder="1"
                  value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-1 flex-wrap">
                {[
                  { key: "isActive", label: "Game Aktif",  icon: <ToggleRight size={16} /> },
                  { key: "isHot",    label: "🔥 HOT",       icon: <Flame size={14} /> },
                  { key: "isNew",    label: "✨ NEW",        icon: <Sparkles size={14} /> },
                ].map((o) => (
                  <label key={o.key} className="flex items-center gap-2 cursor-pointer text-sm"
                    style={{ color: "var(--text-secondary)" }}>
                    <input type="checkbox" checked={!!form[o.key as keyof GameForm]}
                      onChange={(e) => setForm({ ...form, [o.key]: e.target.checked })} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Batal</button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {(saving || uploading) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {uploading ? "Mengupload..." : saving ? "Menyimpan..." : "Simpan Game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
