"use client";

import { useState, useEffect, useCallback, useRef, DragEvent } from "react";
import Image from "next/image";
import {
  Grid3X3, List, Upload, Trash2, Copy, Check, Search,
  RefreshCw, X, Loader2, AlertTriangle, FolderOpen,
  ImageIcon, Download, Pencil, Save, Filter,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
interface GalleryImage {
  id: string;
  name: string;
  url: string;
  file_path: string;
  folder: string;
  alt: string;
  size: number;
  mime_type: string;
  created_at: string;
}

type ViewMode = "grid" | "list";

/* ── Helpers ────────────────────────────────────────────────── */
const FOLDERS = ["general", "banners", "games", "products", "icons"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Component ─────────────────────────────────────────────── */
export default function AdminGalleryPage() {
  const [images,        setImages]        = useState<GalleryImage[]>([]);
  const [filtered,      setFiltered]      = useState<GalleryImage[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [viewMode,      setViewMode]      = useState<ViewMode>("grid");
  const [search,        setSearch]        = useState("");
  const [folder,        setFolder]        = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [uploadProgress,setUploadProgress]= useState<{name: string; done: boolean}[]>([]);
  const [dragging,      setDragging]      = useState(false);
  const [copiedId,      setCopiedId]      = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GalleryImage | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [editTarget,    setEditTarget]    = useState<GalleryImage | null>(null);
  const [editAlt,       setEditAlt]       = useState("");
  const [editFolder,    setEditFolder]    = useState("");
  const [preview,       setPreview]       = useState<GalleryImage | null>(null);
  const [uploadFolder,  setUploadFolder]  = useState("general");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch ── */
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folder) params.set("folder", folder);
      const res = await fetch(`/api/admin/gallery?${params}`);
      const d   = await res.json();
      setImages(d.images ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [folder]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  /* ── Filter by search ── */
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? images.filter(i => i.name.toLowerCase().includes(q) || i.alt.toLowerCase().includes(q)) : images);
  }, [images, search]);

  /* ── Upload handler ── */
  const handleUpload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true);
    setUploadProgress(list.map(f => ({ name: f.name, done: false })));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const fd   = new FormData();
      fd.append("file",   file);
      fd.append("folder", uploadFolder);
      fd.append("alt",    file.name.replace(/\.[^/.]+$/, ""));
      try {
        await fetch("/api/admin/gallery", { method: "POST", body: fd });
      } catch { /* silent */ }
      setUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, done: true } : p));
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress([]);
      fetchImages();
    }, 600);
  };

  /* ── Drag & drop ── */
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  /* ── Copy URL ── */
  const copyUrl = (img: GalleryImage) => {
    navigator.clipboard.writeText(img.url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/gallery/${confirmDelete.id}`, { method: "DELETE" });
      setImages(prev => prev.filter(i => i.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch { alert("Gagal menghapus"); }
    finally { setDeleting(false); }
  };

  /* ── Edit alt/folder ── */
  const openEdit = (img: GalleryImage) => {
    setEditTarget(img); setEditAlt(img.alt); setEditFolder(img.folder);
  };
  const saveEdit = async () => {
    if (!editTarget) return;
    await fetch(`/api/admin/gallery/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt: editAlt, folder: editFolder }),
    });
    setImages(prev => prev.map(i => i.id === editTarget.id ? { ...i, alt: editAlt, folder: editFolder } : i));
    setEditTarget(null);
  };

  /* ── Total size ── */
  const totalSize = images.reduce((a, b) => a + b.size, 0);
  const folders   = [...new Set(images.map(i => i.folder))];

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            Image Gallery
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {images.length} gambar · {formatSize(totalSize)} digunakan
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchImages}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button id="btn-upload-gallery"
            onClick={() => fileInputRef.current?.click()}
            className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Upload size={16} /> Upload Gambar
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => e.target.files && handleUpload(e.target.files)} />
        </div>
      </div>

      {/* ── Filters + View toggle ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            className="input-styled pl-9" placeholder="Cari nama gambar..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Folder filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} style={{ color: "var(--text-muted)" }} />
          {["", ...folders].map(f => (
            <button key={f || "all"} onClick={() => setFolder(f)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={folder === f
                ? { background: "#fbbf24", color: "#0f172a" }
                : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              {f || "Semua"}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {([["grid", Grid3X3], ["list", List]] as const).map(([mode, Icon]) => (
            <button key={mode} id={`view-${mode}`} onClick={() => setViewMode(mode)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
              style={viewMode === mode
                ? { background: "rgba(124,58,237,0.15)", color: "#a78bfa" }
                : { color: "var(--text-muted)" }}>
              <Icon size={14} /> {mode === "grid" ? "Grid" : "List"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Upload zone ── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="mb-5 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all"
        style={{
          height: dragging ? 120 : 72,
          border: `2px dashed ${dragging ? "#fbbf24" : "var(--border)"}`,
          background: dragging ? "rgba(251,191,36,0.06)" : "transparent",
          transition: "all 0.25s ease",
        }}>
        {uploading ? (
          <div className="w-full px-6 space-y-1.5">
            {uploadProgress.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                {p.done
                  ? <Check size={13} style={{ color: "#10b981" }} />
                  : <Loader2 size={13} className="animate-spin" style={{ color: "#fbbf24" }} />}
                <span className="truncate">{p.name}</span>
                <span className="ml-auto">{p.done ? "✓ Selesai" : "Uploading..."}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <Upload size={18} style={{ color: dragging ? "#fbbf24" : "var(--text-muted)" }} />
            <span>
              {dragging ? "Lepas untuk upload" : "Drag & drop gambar atau "}
              {!dragging && <span style={{ color: "#fbbf24", fontWeight: 600 }}>klik untuk pilih</span>}
            </span>
            {/* Folder selector */}
            <select
              value={uploadFolder}
              onChange={e => { e.stopPropagation(); setUploadFolder(e.target.value); }}
              onClick={e => e.stopPropagation()}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={viewMode === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          : "space-y-2"}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl"
              style={{ height: viewMode === "grid" ? 140 : 56 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center" style={{ borderStyle: "dashed" }}>
          <ImageIcon size={40} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {search ? "Tidak ada hasil" : "Belum ada gambar"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {search ? "Coba kata kunci lain" : "Upload gambar pertama kamu"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(img => (
            <div key={img.id} className="group relative rounded-2xl overflow-hidden cursor-pointer"
              style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
              {/* Thumbnail */}
              <div className="relative" style={{ paddingBottom: "75%" }}
                onClick={() => setPreview(img)}>
                <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="220px"
                  onError={() => {}} />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: "rgba(0,0,0,0.55)" }}>
                  <span className="text-white text-xs font-semibold">Lihat</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-medium truncate mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {img.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatSize(img.size)}
                </p>
              </div>

              {/* Action buttons — appear on hover */}
              <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button id={`copy-${img.id}`}
                  onClick={e => { e.stopPropagation(); copyUrl(img); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ background: copiedId === img.id ? "#10b981" : "rgba(15,23,42,0.85)", color: "#fff" }}
                  title="Copy URL">
                  {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <button id={`edit-${img.id}`}
                  onClick={e => { e.stopPropagation(); openEdit(img); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ background: "rgba(124,58,237,0.85)", color: "#fff" }}
                  title="Edit">
                  <Pencil size={12} />
                </button>
                <button id={`del-${img.id}`}
                  onClick={e => { e.stopPropagation(); setConfirmDelete(img); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ background: "rgba(239,68,68,0.85)", color: "#fff" }}
                  title="Hapus">
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Folder badge */}
              <div className="absolute top-1.5 left-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{ background: "rgba(0,0,0,0.65)", color: "#cbd5e1" }}>
                  {img.folder}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="card overflow-hidden">
          <table className="table-styled w-full">
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Nama</th>
                <th className="hidden sm:table-cell">Folder</th>
                <th className="hidden md:table-cell">Ukuran</th>
                <th className="hidden lg:table-cell">Ditambahkan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(img => (
                <tr key={img.id} className="hover:bg-opacity-50 cursor-pointer"
                  onClick={() => setPreview(img)}>
                  {/* Thumbnail */}
                  <td style={{ width: 60 }}>
                    <div className="relative rounded-lg overflow-hidden"
                      style={{ width: 48, height: 36 }}>
                      <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="48px"
                        onError={() => {}} />
                    </div>
                  </td>
                  {/* Name + alt */}
                  <td>
                    <div className="font-medium text-sm truncate max-w-xs" style={{ color: "var(--text-primary)" }}>
                      {img.name}
                    </div>
                    <div className="text-xs truncate max-w-xs" style={{ color: "var(--text-muted)" }}>
                      {img.alt}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="badge" style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
                      {img.folder}
                    </span>
                  </td>
                  <td className="hidden md:table-cell text-sm" style={{ color: "var(--text-muted)" }}>
                    {formatSize(img.size)}
                  </td>
                  <td className="hidden lg:table-cell text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDate(img.created_at)}
                  </td>
                  {/* Actions */}
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button id={`list-copy-${img.id}`} onClick={() => copyUrl(img)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: copiedId === img.id ? "rgba(16,185,129,0.12)" : "var(--bg-secondary)", color: copiedId === img.id ? "#10b981" : "var(--text-muted)" }}>
                        {copiedId === img.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <button id={`list-edit-${img.id}`} onClick={() => openEdit(img)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>
                        <Pencil size={13} />
                      </button>
                      <a href={img.url} target="_blank" rel="noreferrer"
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>
                        <Download size={13} />
                      </a>
                      <button id={`list-del-${img.id}`} onClick={() => setConfirmDelete(img)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════ MODALS ══════════ */}

      {/* ── Image Preview ── */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content" style={{ maxWidth: 720, background: "transparent", border: "none", padding: 0 }}
            onClick={e => e.stopPropagation()}>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {/* Image */}
              <div className="relative w-full" style={{ paddingBottom: "56.25%", background: "#0f172a" }}>
                <Image src={preview.url} alt={preview.alt} fill className="object-contain" sizes="720px" />
              </div>
              {/* Meta */}
              <div className="p-5 flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold mb-1 truncate" style={{ color: "var(--text-primary)" }}>{preview.name}</p>
                  <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                    {preview.folder} · {formatSize(preview.size)} · {formatDate(preview.created_at)}
                  </p>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    <code className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
                      {preview.url}
                    </code>
                    <button onClick={() => copyUrl(preview)}
                      className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ background: copiedId === preview.id ? "#10b981" : "#fbbf24", color: "#0f172a" }}>
                      {copiedId === preview.id ? <><Check size={12}/> Copied</> : <><Copy size={12}/> Copy URL</>}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setPreview(null); openEdit(preview); }}
                    className="btn-outline text-sm flex items-center gap-1.5" style={{ padding: "8px 16px" }}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setPreview(null)}
                    className="flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditTarget(null)}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Edit Gambar</h2>
              <button onClick={() => setEditTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden mb-4" style={{ height: 120 }}>
              <Image src={editTarget.url} alt={editTarget.alt} fill className="object-cover" sizes="420px" />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Alt Text</label>
                <input className="input-styled" value={editAlt} onChange={e => setEditAlt(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Folder</label>
                <select className="input-styled" value={editFolder} onChange={e => setEditFolder(e.target.value)}>
                  {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditTarget(null)} className="btn-outline flex-1">Batal</button>
              <button onClick={saveEdit} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <Save size={14} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal-content" style={{ maxWidth: 380 }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)" }}>
                <AlertTriangle size={20} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h2 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Hapus Gambar?</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{confirmDelete.name}</strong> akan dihapus permanen dari storage.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="btn-outline flex-1">Batal</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "#ef4444", color: "white" }}>
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
