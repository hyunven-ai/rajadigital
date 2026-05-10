"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, X, Save, RefreshCw, Loader2,
  ToggleLeft, ToggleRight, AlertTriangle, ExternalLink,
  ImageIcon, GripVertical, Eye, EyeOff,
} from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  link_label: string;
  badge_text: string;
  show_title: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const EMPTY: Omit<Banner, "id" | "created_at"> = {
  title: "",
  subtitle: "",
  image_url: "",
  link_url: "",
  link_label: "Top Up Sekarang",
  badge_text: "🔥 Promo Hari Ini",
  show_title: true,
  is_active: true,
  sort_order: 0,
};

const GAME_IMAGES = [
  { label: "Royal Dream",    src: "/games/royal-dream.png" },
  { label: "Mobile Legends", src: "/games/mobile-legends.png" },
  { label: "Free Fire",      src: "/games/free-fire.png" },
  { label: "PUBG Mobile",    src: "/games/pubg-mobile.png" },
  { label: "Higgs Domino",   src: "/games/higgs-domino.png" },
  { label: "Ragnarok",       src: "/games/ragnarok-origin.jpg" },
];

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminBannersPage() {
  const [banners,          setBanners]          = useState<Banner[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [showForm,         setShowForm]         = useState(false);
  const [editing,          setEditing]          = useState<Banner | null>(null);
  const [form,             setForm]             = useState<Omit<Banner, "id" | "created_at">>(EMPTY);
  const [confirmTarget,    setConfirmTarget]    = useState<Banner | null>(null);
  const [deleting,         setDeleting]         = useState(false);
  const [previewTab,       setPreviewTab]       = useState<"desktop" | "mobile">("desktop");
  // true jika kolom show_title sudah ada di database
  const [dbHasShowTitle,   setDbHasShowTitle]   = useState<boolean | null>(null);

  /* ── Fetch ── */
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const d   = await res.json();
      if (d.banners) {
        setBanners(d.banners);
        // Deteksi apakah kolom show_title sudah ada di DB
        // Jika ada banner, cek apakah field show_title terdefinisi (bukan undefined)
        if (d.banners.length > 0) {
          setDbHasShowTitle("show_title" in d.banners[0]);
        } else {
          // Tidak ada banner, coba fetch satu row untuk cek kolom
          setDbHasShowTitle(null); // unknown
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.image_url) { alert("URL Gambar wajib diisi"); return; }
    // Judul hanya wajib jika show_title aktif
    if (form.show_title && !form.title) { alert("Judul Banner wajib diisi jika 'Tampilkan Judul' diaktifkan"); return; }
    setSaving(true);
    try {
      // Jika show_title=false & title kosong, simpan placeholder agar kolom NOT NULL tidak error
      const payload = {
        ...form,
        title: form.title.trim() || (form.show_title ? "" : "banner"),
      };
      if (editing) {
        const res = await fetch(`/api/admin/banners/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
      }
      setShowForm(false);
      fetchBanners();
    } catch { alert("Gagal menyimpan banner"); }
    finally { setSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/banners/${confirmTarget.id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((b) => b.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch { alert("Gagal menghapus banner"); }
    finally { setDeleting(false); }
  };

  /* ── Toggle active ── */
  const toggleActive = async (b: Banner) => {
    setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !b.is_active }),
    });
  };

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title, subtitle: b.subtitle ?? "", image_url: b.image_url,
      link_url: b.link_url ?? "", link_label: b.link_label ?? "",
      badge_text: b.badge_text ?? "",
      // Gunakan nilai dari DB jika kolom ada, default true hanya jika kolom belum ada
      show_title: dbHasShowTitle ? (b.show_title ?? true) : true,
      is_active: b.is_active, sort_order: b.sort_order,
    });
    setShowForm(true);
  };

  return (
    <div>
      {/* ── Migration Warning: show_title kolom belum ada ── */}
      {dbHasShowTitle === false && (
        <div className="mb-5 rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)" }}>
          <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="font-bold text-sm mb-1" style={{ color: "#ef4444" }}>
              ⚠️ Fitur "Sembunyikan Judul" memerlukan update database
            </div>
            <p className="text-xs mb-2" style={{ color: "#fca5a5" }}>
              Kolom <code className="px-1 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)" }}>show_title</code> belum ada di tabel <code className="px-1 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)" }}>banners</code>.
              Toggle judul tidak akan tersimpan sampai SQL berikut dijalankan.
            </p>
            <div className="rounded-lg p-3 font-mono text-xs select-all cursor-text"
              style={{ background: "rgba(0,0,0,0.4)", color: "#86efac", border: "1px solid rgba(134,239,172,0.2)" }}>
              ALTER TABLE banners ADD COLUMN IF NOT EXISTS show_title BOOLEAN NOT NULL DEFAULT TRUE;
            </div>
            <p className="text-xs mt-2" style={{ color: "#fca5a5" }}>
              Jalankan SQL di atas di <strong>Supabase Dashboard → SQL Editor</strong>, lalu klik Refresh.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            Banner &amp; Carousel
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {banners.length} banner terdaftar — tampil di halaman beranda
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchBanners}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button id="btn-add-banner" onClick={openAdd} className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Plus size={16} /> Tambah Banner
          </button>
        </div>
      </div>

      {/* ── Banner Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden">
              {/* skeleton ikut rasio 16:7 */}
              <div className="skeleton" style={{ paddingTop: "43.75%", position: "relative" }} />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="card p-16 text-center" style={{ borderStyle: "dashed" }}>
          <ImageIcon size={40} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Belum ada banner</p>
          <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>Tambahkan banner untuk ditampilkan di carousel beranda</p>
          <button onClick={openAdd} className="btn-gold inline-flex items-center gap-2">
            <Plus size={16} /> Tambah Banner Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {banners.map((b, idx) => (
            <div key={b.id} className="card overflow-hidden group transition-all hover:-translate-y-1">
              {/* Thumbnail — rasio 16:7 (1280×560) tidak terpotong */}
              <div className="relative w-full" style={{ paddingTop: "43.75%" }}>
                <div className="absolute inset-0">
                {b.image_url ? (
                  <Image
                    src={b.image_url} alt={b.title} fill
                    className="object-contain"
                    style={{ background: "#0a0f1a" }}
                    sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
                    <ImageIcon size={32} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />

                {/* Order badge */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(251,191,36,0.9)", color: "#0f172a" }}>
                  {idx + 1}
                </div>

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span className={`badge ${b.is_active ? "badge-green" : "badge-red"}`}>
                    {b.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                {/* Badge text preview */}
                {b.badge_text && (
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ background: "rgba(251,191,36,0.85)", color: "#0f172a" }}>
                      {b.badge_text}
                    </span>
                  </div>
                )}
                </div>{/* /absolute inset-0 */}
              </div>{/* /paddingTop wrapper */}

              {/* Info */}
              <div className="p-4">
                <div className="font-bold text-sm mb-1 truncate" style={{ color: "var(--text-primary)" }}>{b.title}</div>
                {b.subtitle && (
                  <p className="text-xs truncate mb-2" style={{ color: "var(--text-muted)" }}>{b.subtitle}</p>
                )}
                {b.link_url && (
                  <div className="flex items-center gap-1 text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                    <ExternalLink size={11} />
                    <span className="truncate">{b.link_url}</span>
                  </div>
                )}
                <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Urutan: <strong style={{ color: "var(--text-secondary)" }}>{b.sort_order}</strong>
                  &nbsp;·&nbsp; {formatDate(b.created_at)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(b)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 flex-1 justify-center"
                    style={b.is_active
                      ? { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
                      : { background: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" }}>
                    {b.is_active ? <><ToggleRight size={14} /> Aktif</> : <><ToggleLeft size={14} /> Nonaktif</>}
                  </button>
                  <button id={`edit-banner-${b.id}`} onClick={() => openEdit(b)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                    style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}>
                    <Pencil size={14} />
                  </button>
                  <button id={`delete-banner-${b.id}`} onClick={() => setConfirmTarget(b)}
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

      {/* ── Panduan Ukuran Banner ── */}
      <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-3 flex items-center gap-2"
          style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <span>📐</span>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Panduan Ukuran Gambar Banner</span>
        </div>
        <div className="p-5">
          {/* Tabel rekomendasi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { device: "🖥 Desktop", size: "1280 × 560 px", ratio: "16:7", note: "Ideal, tidak terpotong", color: "#10b981" },
              { device: "📱 Tablet",  size: "900 × 450 px",  ratio: "16:8", note: "Rasio tengah",         color: "#fbbf24" },
              { device: "📲 Mobile",  size: "640 × 360 px",  ratio: "16:9", note: "Paling tinggi",       color: "#a78bfa" },
            ].map((d) => (
              <div key={d.device} className="rounded-xl p-3 text-center"
                style={{ background: `${d.color}10`, border: `1px solid ${d.color}30` }}>
                <div className="text-base mb-1">{d.device}</div>
                <div className="font-bold text-sm" style={{ color: d.color }}>{d.size}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Rasio {d.ratio} · {d.note}</div>
              </div>
            ))}
          </div>

          {/* Diagram safe zone */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px dashed var(--border)" }}>
            <div className="px-3 py-2 text-xs font-semibold" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
              Diagram Safe Zone — Area teks &amp; subjek utama yang aman dari pemotongan
            </div>
            <div className="relative p-2" style={{ background: "var(--bg-secondary)" }}>
              {/* Banner frame */}
              <div className="relative rounded-lg overflow-hidden mx-auto" style={{ height: 90, background: "#0f172a", maxWidth: 520 }}>
                {/* Safe zone overlay */}
                <div className="absolute inset-y-0 flex" style={{ left: "5%", width: "55%" }}>
                  <div className="flex-1 flex flex-col justify-center px-3 rounded-lg"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1.5px dashed rgba(16,185,129,0.5)" }}>
                    <div className="text-xs font-bold" style={{ color: "#10b981" }}>✅ SAFE ZONE KIRI</div>
                    <div className="text-xs" style={{ color: "#6ee7b7" }}>Teks, judul, badge &amp; tombol CTA</div>
                    <div className="text-xs mt-0.5" style={{ color: "#6ee7b7" }}>Tidak akan terpotong di device apapun</div>
                  </div>
                </div>
                {/* Right zone */}
                <div className="absolute inset-y-0 flex" style={{ left: "62%", right: "3%" }}>
                  <div className="flex-1 flex flex-col justify-center items-center rounded-lg"
                    style={{ background: "rgba(251,191,36,0.1)", border: "1.5px dashed rgba(251,191,36,0.4)" }}>
                    <div className="text-xs font-bold" style={{ color: "#fbbf24" }}>⚠️ KANAN</div>
                    <div className="text-xs text-center" style={{ color: "#fde68a" }}>Subjek visual</div>
                    <div className="text-xs text-center" style={{ color: "#fde68a" }}>Bisa terpotong di mobile</div>
                  </div>
                </div>
              </div>
              {/* Ruler */}
              <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--text-muted)", maxWidth: 520, margin: "4px auto 0" }}>
                <span>⬅ Kiri (aman)</span>
                <span>Kanan (mungkin terpotong) ➡</span>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { ok: true,  text: "Min resolusi 1280×560px (disarankan)" },
              { ok: true,  text: "Subjek utama di 60% kiri gambar" },
              { ok: true,  text: "Format: JPG, PNG, atau WebP" },
              { ok: true,  text: "Ukuran file max 2MB untuk loading cepat" },
              { ok: false, text: "Jangan letakkan teks di gambar (gunakan field Judul)" },
              { ok: false, text: "Hindari subjek penting di tepi kanan gambar" },
            ].map((c) => (
              <div key={c.text} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: c.ok ? "#10b981" : "#ef4444" }}>
                  {c.ok ? "✅" : "❌"}
                </span>
                {c.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                {editing ? "Edit Banner" : "Tambah Banner"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Live Preview */}
              {form.image_url && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>👁️ Preview</span>
                    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      {(["desktop", "mobile"] as const).map((t) => (
                        <button key={t} onClick={() => setPreviewTab(t)}
                          className="px-3 py-1 text-xs font-semibold transition-all"
                          style={previewTab === t
                            ? { background: "#fbbf24", color: "#0f172a" }
                            : { color: "var(--text-muted)" }}>
                          {t === "desktop" ? "🖥 Desktop" : "📱 Mobile"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-xl"
                    style={{
                      height: previewTab === "desktop" ? 180 : 120,
                      transition: "height 0.3s ease",
                    }}>
                    {/* Blurred background — hanya tampil jika show_title = true */}
                    {form.show_title && (
                      <Image src={form.image_url} alt="" fill className="object-cover"
                        style={{ filter: "blur(20px) brightness(0.4)", transform: "scale(1.1)" }}
                        sizes="600px" aria-hidden onError={() => {}} />
                    )}
                    <Image src={form.image_url} alt="preview" fill
                      className={form.show_title ? "object-contain" : "object-cover"}
                      sizes="600px" onError={() => {}} />
                    {form.show_title && (
                      <div className="absolute inset-0"
                        style={{ background: "linear-gradient(90deg, rgba(10,5,30,0.85) 0%, rgba(10,5,30,0.4) 60%, transparent 100%)" }} />
                    )}
                    <div className="absolute inset-0 flex flex-col justify-center p-4">
                      {form.badge_text && form.show_title && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 w-fit"
                          style={{ background: "rgba(251,191,36,0.85)", color: "#0f172a" }}>
                          {form.badge_text}
                        </span>
                      )}
                      {form.show_title && (
                        <div className="font-black text-white" style={{ fontSize: previewTab === "desktop" ? 18 : 13 }}>
                          {form.title || "Judul Banner"}
                        </div>
                      )}
                      {form.show_title && form.subtitle && (
                        <div className="text-xs mt-1" style={{ color: "#cbd5e1", maxWidth: "60%" }}>{form.subtitle}</div>
                      )}
                      {!form.show_title && (
                        <div className="text-xs text-center w-full" style={{ color: "rgba(255,255,255,0.4)" }}>
                          Judul disembunyikan — banner tampil full tanpa overlay
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Image Select */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  🖼️ Pilih Gambar Game
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GAME_IMAGES.map((g) => (
                    <button key={g.src} type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: g.src }))}
                      className="relative rounded-xl overflow-hidden transition-all hover:scale-105"
                      style={{
                        height: 56,
                        border: form.image_url === g.src ? "2px solid #fbbf24" : "2px solid var(--border)",
                        boxShadow: form.image_url === g.src ? "0 0 12px rgba(251,191,36,0.4)" : "none",
                      }}>
                      <Image src={g.src} alt={g.label} fill className="object-cover" sizes="120px" />
                      <div className="absolute inset-0 flex items-end p-1"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}>
                        <span className="text-white text-xs font-semibold">{g.label}</span>
                      </div>
                      {form.image_url === g.src && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: "#fbbf24" }}>
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom URL + size hint */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    URL Gambar Custom
                  </label>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                    📐 Ideal: 1280×560px
                  </span>
                </div>
                <input id="banner-image-url" className="input-styled" placeholder="https://... atau /games/nama.png"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Letakkan subjek utama di <strong style={{ color: "#fbbf24" }}>60% sisi kiri</strong> gambar agar aman di semua ukuran layar.
                </p>
              </div>

              {/* Title + show_title toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Judul Banner {form.show_title ? "*" : "(opsional — judul disembunyikan)"}
                  </label>
                  {/* Toggle Tampilkan Judul */}
                  <button
                    type="button"
                    id="toggle-show-title"
                    onClick={() => setForm({ ...form, show_title: !form.show_title })}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-all"
                    style={form.show_title
                      ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.4)" }
                      : { background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" }}
                  >
                    {form.show_title ? <><Eye size={12} /> Judul Tampil</> : <><EyeOff size={12} /> Judul Disembunyikan</>}
                  </button>
                </div>
                <input id="banner-title" className="input-styled" placeholder="Top-Up Game Favoritmu"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  disabled={!form.show_title}
                  style={!form.show_title ? { opacity: 0.4, pointerEvents: "none" } : {}}
                />
                {!form.show_title && (
                  <p className="mt-1.5 text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg"
                    style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                    <EyeOff size={12} />
                    Judul disembunyikan — blur background akan dihapus sehingga gambar tampil full.
                  </p>
                )}
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Subjudul (opsional)
                </label>
                <input id="banner-subtitle" className="input-styled" placeholder="Diamond, UC, Koin dengan harga terbaik..."
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>

              {/* Badge text */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Teks Badge (opsional)
                </label>
                <input id="banner-badge" className="input-styled" placeholder="🔥 Promo Hari Ini"
                  value={form.badge_text}
                  onChange={(e) => setForm({ ...form, badge_text: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Link URL */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    URL Tombol (opsional)
                  </label>
                  <input id="banner-link-url" className="input-styled" placeholder="#games atau /games/royal-dream"
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
                </div>
                {/* Link Label */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Label Tombol
                  </label>
                  <input id="banner-link-label" className="input-styled" placeholder="Top Up Sekarang"
                    value={form.link_label}
                    onChange={(e) => setForm({ ...form, link_label: e.target.value })} />
                </div>
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Urutan (angka terkecil tampil pertama)
                </label>
                <input id="banner-sort" type="number" className="input-styled" placeholder="0"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>

              {/* Status */}
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Banner Aktif (tampil di beranda)
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Batal</button>
              <button id="save-banner-btn" onClick={handleSave} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Menyimpan..." : "Simpan Banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {confirmTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmTarget(null)}>
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)" }}>
                <AlertTriangle size={22} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Hapus Banner?</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Banner <strong style={{ color: "var(--text-primary)" }}>{confirmTarget.title}</strong> akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button id="cancel-delete-banner" onClick={() => setConfirmTarget(null)} disabled={deleting} className="btn-outline flex-1">
                Batal
              </button>
              <button id="confirm-delete-banner" onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "#ef4444", color: "white" }}>
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</> : <><Trash2 size={16} /> Hapus</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
