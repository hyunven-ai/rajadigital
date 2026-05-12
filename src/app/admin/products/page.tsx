"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, X, Gem, Coins, Save,
  RefreshCw, ToggleLeft, ToggleRight, Loader2,
  ChevronDown, CheckSquare, Square, CheckCheck,
  EyeOff, Eye, AlertTriangle, Clock, ArrowUpDown, ArrowUp, ArrowDown,
  Upload, ImageIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Game } from "@/lib/games";

interface Product {
  id: string; name: string; category: string; price: number;
  amount: string; game_name: string; is_active: boolean;
  is_popular: boolean; sort_order: number; created_at: string;
  special_image?: string;
}

/* ── Warna badge per kategori ─────────────────────────────── */
const CAT_META: Record<string, { icon: string; bg: string; color: string; border: string }> = {
  diamond: { icon: "💎", bg: "rgba(251,191,36,0.15)",  color: "#fbbf24", border: "rgba(251,191,36,0.4)"  },
  koin:    { icon: "🪙", bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.4)" },
  uc:      { icon: "🎖️", bg: "rgba(251,191,36,0.15)",  color: "#fbbf24", border: "rgba(251,191,36,0.4)"  },
  voucher: { icon: "🎫", bg: "rgba(52,211,153,0.15)",  color: "#34d399", border: "rgba(52,211,153,0.4)"  },
  chip:    { icon: "🎰", bg: "rgba(251,146,60,0.15)",  color: "#fb923c", border: "rgba(251,146,60,0.4)"  },
  spesial: { icon: "⭐", bg: "rgba(59,130,246,0.15)",  color: "#3b82f6", border: "rgba(59,130,246,0.4)"  },
};

function getCatMeta(cat: string) {
  return CAT_META[cat.toLowerCase()] ?? { icon: "📦", bg: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "rgba(148,163,184,0.4)" };
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// EMPTY tidak lagi hardcode category/game_name — akan diisi dinamis di openAdd()
const EMPTY: Omit<Product, "game_name" | "category"> & { game_name: string; category: string } = {
  id: "", name: "", category: "", price: 0,
  amount: "", game_name: "", is_active: true,
  is_popular: false, sort_order: 0, created_at: "",
};

export default function AdminProductsPage() {
  const [products,       setProducts]       = useState<Product[]>([]);
  const [games,          setGames]          = useState<Game[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [editing,        setEditing]        = useState<Product | null>(null);
  const [form,           setForm]           = useState<Product>(EMPTY);
  const [filterGame,     setFilterGame]     = useState<string>("all");
  const [filterCat,      setFilterCat]      = useState<string>("all");
  const [sortKey,        setSortKey]        = useState<string>("price");
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("asc");

  // Spesial Package State
  const [isSpecial, setIsSpecial] = useState(false);
  const [specialConfig, setSpecialConfig] = useState({ min: 10, max: 100, step: 1, unit: "B" });
  const [specialImage,     setSpecialImage]     = useState<string>("");       // URL yang sudah tersimpan
  const [specialImageFile, setSpecialImageFile] = useState<File | null>(null); // file baru dipilih
  const [specialImgPreview,setSpecialImgPreview]= useState<string>("");       // blob URL preview
  const [specialImgUploading,setSpecialImgUploading] = useState(false);
  const [imgInputMode, setImgInputMode] = useState<"file" | "url">("file"); // mode input gambar
  const [specialImgUrl, setSpecialImgUrl] = useState<string>("");             // URL yang diketik manual
  const specialImgRef = useRef<HTMLInputElement>(null);

  // Bulk select
  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [bulkLoading,    setBulkLoading]    = useState(false);

  // Custom confirm modal — replaces window.confirm
  const [confirmTarget,  setConfirmTarget]  = useState<Product | null>(null);
  const [deleting,       setDeleting]       = useState(false);

  /* ── Fetch ─────────────────────── */
  const fetchGames = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/games");
      const data = await res.json();
      if (data.games) setGames(data.games);
    } catch { /* silent */ }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res  = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGames(); fetchProducts(); }, [fetchGames, fetchProducts]);

  /* ── Filter + Sort ────────────────────────── */
  const filtered = products
    .filter((p) => {
      const gOk = filterGame === "all" || p.game_name === filterGame;
      const cOk = filterCat  === "all" || p.category  === filterCat;
      return gOk && cOk;
    })
    .sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "name":       av = a.name.toLowerCase();      bv = b.name.toLowerCase();      break;
        case "price":      av = a.price;                   bv = b.price;                   break;
        case "amount":     av = Number(a.amount) || 0;     bv = Number(b.amount) || 0;     break;
        case "sort_order": av = a.sort_order;              bv = b.sort_order;              break;
        case "game_name":  av = a.game_name.toLowerCase(); bv = b.game_name.toLowerCase(); break;
        case "category":   av = a.category.toLowerCase();  bv = b.category.toLowerCase();  break;
        case "created_at": av = a.created_at;              bv = b.created_at;              break;
        default: av = a.created_at; bv = b.created_at;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  /* ── Selection ─────────────────── */
  const allChecked  = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someChecked = filtered.some((p) => selected.has(p.id));

  const toggleOne = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((p) => p.id)));

  const selectedIds = Array.from(selected);
  const selectedCount = selectedIds.length;

  /* ── Bulk actions ──────────────── */
  const bulkDelete = async () => {
    if (!selectedCount) return;
    if (!confirm(`Hapus ${selectedCount} produk? Aksi ini tidak bisa dibatalkan.`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      await fetchProducts();
    } catch { alert("Gagal menghapus produk"); }
    finally { setBulkLoading(false); }
  };

  const bulkSetActive = async (is_active: boolean) => {
    if (!selectedCount) return;
    setBulkLoading(true);
    try {
      await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, updates: { is_active } }),
      });
      setProducts((prev) => prev.map((p) => selected.has(p.id) ? { ...p, is_active } : p));
      setSelected(new Set());
    } catch { alert("Gagal mengubah status"); }
    finally { setBulkLoading(false); }
  };

  /* ── Single delete (custom modal) ── */
  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${confirmTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Gagal");
      }
      setProducts((prev) => prev.filter((p) => p.id !== confirmTarget.id));
      setSelected((prev) => { const s = new Set(prev); s.delete(confirmTarget.id); return s; });
      setConfirmTarget(null);
    } catch (e) { alert(`Gagal menghapus: ${e instanceof Error ? e.message : "error"}`); }
    finally { setDeleting(false); }
  };

  /* ── Toggle single ─────────────── */
  const toggleActive  = async (p: Product) => {
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
  };
  const togglePopular = async (p: Product) => {
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_popular: !x.is_popular } : x));
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_popular: !p.is_popular }),
    });
  };

  /* ── Helpers untuk default kategori ─────────────────────────────── */
  /** Kembalikan kategori pertama yang tersedia untuk game tertentu */
  const getDefaultCategory = (gameName: string): string => {
    const g = games.find((x) => x.name === gameName);
    if (!g) return "";
    // Gunakan currency utama sebagai default pertama
    return g.currency?.toLowerCase() ?? "";
  };

  /* ── CRUD ──────────────────────── */
  const openAdd = () => {
    setEditing(null);
    setIsSpecial(false);
    setSpecialConfig({ min: 10, max: 100, step: 1, unit: "B" });
    setSpecialImage("");
    setSpecialImageFile(null);
    setSpecialImgPreview("");
    setSpecialImgUrl("");
    setImgInputMode("file");

    // Tentukan game default: pakai filter aktif jika ada, kalau tidak pakai game pertama
    const defaultGameName = filterGame !== "all"
      ? filterGame
      : (games[0]?.name ?? "");
    const defaultCategory = getDefaultCategory(defaultGameName);

    setForm({
      ...EMPTY,
      game_name: defaultGameName,
      category:  defaultCategory,
    } as Product);
    setShowForm(true);
  };

  const openEdit = (p: Product) => { 
    setEditing(p); 
    setForm(p); 
    const savedImg = p.special_image ?? "";
    setSpecialImage(savedImg);
    setSpecialImageFile(null);
    // Deteksi mode: jika ada URL tersimpan, tampilkan di mode URL
    if (savedImg.startsWith("http")) {
      setImgInputMode("url");
      setSpecialImgUrl(savedImg);
      setSpecialImgPreview(savedImg);
    } else {
      setImgInputMode("file");
      setSpecialImgUrl("");
      setSpecialImgPreview(savedImg);
    }
    if (p.category === "spesial" && p.amount?.startsWith("SPECIAL|")) {
      setIsSpecial(true);
      const parts = p.amount.split("|");
      setSpecialConfig({
        min: Number(parts[1]) || 1,
        max: Number(parts[2]) || 10,
        step: Number(parts[3]) || 1,
        unit: parts[4] || "B"
      });
    } else {
      setIsSpecial(false);
    }
    setShowForm(true); 
  };

  const handleSave = async () => {
    let finalAmount = form.amount;
    let finalCategory = form.category;
    
    if (isSpecial) {
      finalCategory = "spesial";
      finalAmount = `SPECIAL|${specialConfig.min}|${specialConfig.max}|${specialConfig.step}|${specialConfig.unit}`;
    }

    if (!form.name || !finalAmount || !form.price) { alert("Lengkapi semua field"); return; }
    setSaving(true);
    try {
      // Upload gambar paket spesial jika ada file baru
      let finalSpecialImage = specialImage;

      if (isSpecial) {
        if (imgInputMode === "url" && specialImgUrl.trim()) {
          // Pakai URL langsung tanpa upload
          finalSpecialImage = specialImgUrl.trim();
        } else if (imgInputMode === "file" && specialImageFile) {
          setSpecialImgUploading(true);
          try {
            if (editing) {
              const fd = new FormData();
              fd.append("file", specialImageFile);
              fd.append("product_id", editing.id);
              const res  = await fetch("/api/admin/products/upload-image", { method: "POST", body: fd });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              finalSpecialImage = data.imageUrl;
              setSpecialImage(data.imageUrl);
              setSpecialImgPreview(data.imageUrl);
              setSpecialImageFile(null);
            }
          } catch (e) {
            alert(`Upload gambar gagal: ${e instanceof Error ? e.message : "error"}`);
            return;
          } finally {
            setSpecialImgUploading(false);
          }
        }
      }

      if (editing) {
        const patchRes = await fetch(`/api/admin/products/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name, category: finalCategory, price: form.price,
            amount: finalAmount, game_name: form.game_name, is_active: form.is_active,
            is_popular: form.is_popular, sort_order: form.sort_order,
            ...(isSpecial ? { special_image: finalSpecialImage } : { special_image: null }),
          }),
        });
        if (!patchRes.ok) {
          const errData = await patchRes.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal menyimpan (${patchRes.status}). Pastikan kolom special_image sudah ditambahkan di Supabase.`);
        }
      } else {
        // Buat produk dulu — sertakan special_image jika URL mode
        const res = await fetch("/api/admin/products", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form, amount: finalAmount, category: finalCategory,
            ...(isSpecial ? { special_image: finalSpecialImage } : {}),
          }),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || `Gagal membuat produk (${res.status}). Pastikan kolom special_image sudah ditambahkan di Supabase.`);

        // Upload file gambar untuk produk baru jika mode file
        if (isSpecial && imgInputMode === "file" && specialImageFile && created.product?.id) {
          setSpecialImgUploading(true);
          try {
            const fd = new FormData();
            fd.append("file", specialImageFile);
            fd.append("product_id", created.product.id);
            await fetch("/api/admin/products/upload-image", { method: "POST", body: fd });
          } catch { /* silent — gambar bisa di-upload ulang saat edit */ }
          finally { setSpecialImgUploading(false); }
        }
      }
      setShowForm(false);
      fetchProducts();
    } catch (e) { alert(`Gagal menyimpan produk: ${e instanceof Error ? e.message : "error"}`); }
    finally { setSaving(false); }
  };

  const handleGameChange = (name: string) => {
    const g = games.find((x) => x.name === name);
    // Ketika menambah produk baru: set kategori ke primary currency game yang dipilih
    // Ketika edit: jangan ubah kategori yang sudah ada
    if (!editing) {
      const primaryCat = g?.currency?.toLowerCase() ?? "";
      setForm((f) => ({ ...f, game_name: name, category: primaryCat }));
    } else {
      setForm((f) => ({ ...f, game_name: name }));
    }
  };

  /* ── Semua kategori unik dari data produk + game ────── */
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category?.toLowerCase()).filter(Boolean)));
  const filterTabs: { key: string; label: string }[] = [
    { key: "all", label: "Semua" },
    ...uniqueCategories.map((k) => {
      const m = getCatMeta(k);
      return { key: k, label: `${m.icon} ${k.charAt(0).toUpperCase() + k.slice(1)}` };
    }),
  ];

  const gameStats = games.map((g) => ({ ...g, count: products.filter((p) => p.game_name === g.name).length }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>Produk</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{products.length} produk terdaftar</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchProducts}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button id="btn-add-product" onClick={openAdd} className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Plus size={16} /> Tambah Produk
          </button>
        </div>
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <button onClick={() => setFilterGame("all")}
          className="p-3 rounded-xl flex items-center gap-2 transition-all"
          style={filterGame === "all"
            ? { background: "rgba(251,191,36,0.15)", border: "2px solid rgba(251,191,36,0.5)" }
            : { background: "var(--bg-secondary)", border: "2px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "rgba(251,191,36,0.15)" }}>🎮</div>
          <div className="text-left overflow-hidden">
            <div className="text-xs font-bold truncate" style={{ color: filterGame === "all" ? "#fbbf24" : "var(--text-primary)" }}>Semua</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{products.length}</div>
          </div>
        </button>
        {gameStats.map((g) => (
          <button key={g.slug} onClick={() => setFilterGame(g.name)}
            className="p-3 rounded-xl flex items-center gap-2 transition-all"
            style={filterGame === g.name
              ? { background: `${g.color}18`, border: `2px solid ${g.color}60` }
              : { background: "var(--bg-secondary)", border: "2px solid var(--border)" }}>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={g.cover} alt={g.name} fill className="object-cover" sizes="32px" />
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-xs font-bold truncate" style={{ color: filterGame === g.name ? g.color : "var(--text-primary)" }}>{g.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{g.count}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Filter tabs + bulk bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filterTabs.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterCat(key)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={filterCat === key
              ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }
              : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            {label}
          </button>
        ))}

        {/* Bulk action bar — shown when items selected */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
              {selectedCount} dipilih
            </span>
            <button onClick={() => bulkSetActive(true)} disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
              <Eye size={13} /> Aktifkan
            </button>
            <button onClick={() => bulkSetActive(false)} disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" }}>
              <EyeOff size={13} /> Nonaktifkan
            </button>
            <button onClick={bulkDelete} disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
              {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Hapus
            </button>
            <button onClick={() => setSelected(new Set())}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg"
              style={{ color: "var(--text-muted)" }}>
              <X size={13} /> Batal
            </button>
          </div>
        )}

        {selectedCount === 0 && (
          <div className="ml-auto flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <ArrowUpDown size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <select
                id="sort-key-select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <option value="created_at">Terbaru</option>
                <option value="name">Nama (A-Z)</option>
                <option value="price">Harga</option>
                <option value="amount">Jumlah</option>
                <option value="sort_order">Urutan</option>
                <option value="game_name">Game</option>
                <option value="category">Kategori</option>
              </select>
              <button
                id="sort-dir-btn"
                onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                title={sortDir === "asc" ? "Ascending" : "Descending"}
                className="transition-all hover:opacity-70"
                style={{ color: "#fbbf24" }}
              >
                {sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              </button>
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} produk
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-4" />
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-6 w-14 rounded-full" />
                <div className="skeleton h-6 w-14 rounded-full" />
                <div className="skeleton h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-styled">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <button onClick={toggleAll} title="Pilih semua"
                      style={{ color: someChecked ? "#fbbf24" : "var(--text-muted)" }}>
                      {allChecked ? <CheckCheck size={16} /> : someChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  {[
                    { key: "name",       label: "Nama"       },
                    { key: "game_name",  label: "Game"       },
                    { key: "category",   label: "Kategori"   },
                    { key: "amount",     label: "Jumlah"     },
                    { key: "price",      label: "Harga"      },
                  ].map(({ key, label }) => (
                    <th key={key}>
                      <button
                        onClick={() => {
                          if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
                          else { setSortKey(key); setSortDir("asc"); }
                        }}
                        className="flex items-center gap-1 hover:opacity-70 transition-all font-semibold"
                        style={{ color: sortKey === key ? "#fbbf24" : "inherit" }}
                      >
                        {label}
                        {sortKey === key
                          ? (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
                          : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                      </button>
                    </th>
                  ))}
                  <th>Populer</th>
                  <th>Status</th>
                  <th>
                    <button
                      onClick={() => {
                        if (sortKey === "created_at") setSortDir((d) => d === "asc" ? "desc" : "asc");
                        else { setSortKey("created_at"); setSortDir("desc"); }
                      }}
                      className="flex items-center gap-1 hover:opacity-70 transition-all font-semibold"
                      style={{ color: sortKey === "created_at" ? "#fbbf24" : "inherit" }}
                    >
                      Ditambahkan
                      {sortKey === "created_at"
                        ? (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
                        : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                    </button>
                  </th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const gc  = games.find((g) => g.name === p.game_name);
                  const sel = selected.has(p.id);
                  return (
                    <tr key={p.id} style={sel ? { background: "rgba(251,191,36,0.05)" } : {}}>
                      {/* Checkbox */}
                      <td>
                        <button onClick={() => toggleOne(p.id)}
                          style={{ color: sel ? "#fbbf24" : "var(--text-muted)" }}>
                          {sel ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>

                      <td><span className="font-semibold text-sm">{p.name}</span></td>

                      <td>
                        <div className="flex items-center gap-2">
                          {gc ? (
                            <div className="relative w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
                              <Image src={gc.cover} alt={p.game_name} fill className="object-cover" sizes="24px" />
                            </div>
                          ) : <span>🎮</span>}
                          <span className="text-xs font-medium" style={{ color: gc?.color ?? "var(--text-secondary)" }}>
                            {p.game_name || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {(() => {
                          const m = getCatMeta(p.category ?? "");
                          return (
                            <span
                              className="badge"
                              style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
                            >
                              {m.icon} {p.category}
                            </span>
                          );
                        })()}
                      </td>

                      <td>
                        {p.category === "spesial" && p.amount?.startsWith("SPECIAL|") ? (
                          <span className="text-sm font-mono text-blue-400">
                            {p.amount.split("|")[1]} - {p.amount.split("|")[2]} {p.amount.split("|")[4]}
                          </span>
                        ) : (
                          <span className="text-sm font-mono">{p.amount}</span>
                        )}
                      </td>
                      <td>
                        <span className="font-bold text-sm" style={{ color: "#fbbf24" }}>
                          {formatCurrency(p.price)} {p.category === "spesial" ? "/ kelipatan" : ""}
                        </span>
                      </td>

                      <td>
                        <button onClick={() => togglePopular(p)}
                          className="flex items-center gap-1 text-xs font-semibold transition-all hover:opacity-80"
                          style={p.is_popular ? { color: "#10b981" } : { color: "var(--text-muted)" }}>
                          {p.is_popular ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          {p.is_popular ? "🔥 Ya" : "Tidak"}
                        </button>
                      </td>

                      <td>
                        <button onClick={() => toggleActive(p)}
                          className={`badge cursor-pointer transition-all hover:opacity-80 ${p.is_active ? "badge-green" : "badge-red"}`}>
                          {p.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      <td>
                        <div className="flex gap-2 items-center">
                          <Clock size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <span className="text-xs" style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {formatDate((p as Product & { created_at: string }).created_at)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="flex gap-2">
                          <button id={`edit-${p.id}`} onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
                            <Pencil size={14} />
                          </button>
                          <button
                            id={`delete-${p.id}`}
                            onClick={(e) => { e.stopPropagation(); setConfirmTarget(p); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                            title="Hapus produk"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                      Belum ada produk
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                {editing ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Game selector */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>🎮 Game</label>
                <div className="grid grid-cols-2 gap-2">
                  {games.map((g) => (
                    <button key={g.slug} type="button" onClick={() => handleGameChange(g.name)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
                      style={form.game_name === g.name
                        ? { background: `${g.color}18`, border: `2px solid ${g.color}60` }
                        : { background: "var(--bg-secondary)", border: "2px solid var(--border)" }}>
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={g.cover} alt={g.name} fill className="object-cover" sizes="32px" />
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: form.game_name === g.name ? g.color : "var(--text-primary)" }}>{g.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{g.currencyIcon} {g.currency}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Nama Produk / Nama Paket</label>
                <input id="product-name" className="input-styled" placeholder="Contoh: Paket Spesial 1"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* Tipe Paket Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: isSpecial ? "rgba(59,130,246,0.5)" : "var(--border)", background: isSpecial ? "rgba(59,130,246,0.05)" : "transparent" }}>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: isSpecial ? "#3b82f6" : "var(--text-primary)" }}>⭐ Jadikan Paket Spesial (Slider)</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Pembeli dapat memilih nominal dengan slider</div>
                </div>
                <button type="button" onClick={() => setIsSpecial(!isSpecial)}
                  className="flex items-center justify-center transition-all hover:scale-105"
                  style={{ color: isSpecial ? "#3b82f6" : "var(--text-muted)" }}>
                  {isSpecial ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {!isSpecial ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Kategori</label>
                    <div className="relative">
                      <select id="product-category" className="input-styled pr-8 appearance-none"
                        value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {(() => {
                          const selectedGame = games.find((g) => g.name === form.game_name);
                          const primary = selectedGame?.currency ?? "Diamond";
                          const extras  = selectedGame?.extraCurrencies ?? [];
                          const allOpts = [{ key: primary.toLowerCase(), label: primary, icon: selectedGame?.currencyIcon ?? "💎" }, ...extras];
                          return allOpts.map((o) => (
                            <option key={o.key} value={o.key}>{o.icon} {o.label}</option>
                          ));
                        })()}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Jumlah Nominal</label>
                    <input id="product-amount" className="input-styled" placeholder="Contoh: 1B"
                      value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.05)", border: "1px dashed rgba(59,130,246,0.3)" }}>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#3b82f6" }}>Minimal (Contoh: 10)</label>
                      <input type="number" className="input-styled" value={specialConfig.min} onChange={e => setSpecialConfig({ ...specialConfig, min: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#3b82f6" }}>Maksimal (Contoh: 19)</label>
                      <input type="number" className="input-styled" value={specialConfig.max} onChange={e => setSpecialConfig({ ...specialConfig, max: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#3b82f6" }}>Kelipatan (Contoh: 1)</label>
                      <input type="number" className="input-styled" value={specialConfig.step} onChange={e => setSpecialConfig({ ...specialConfig, step: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#3b82f6" }}>Satuan (Contoh: B)</label>
                      <input type="text" className="input-styled" placeholder="B" value={specialConfig.unit} onChange={e => setSpecialConfig({ ...specialConfig, unit: e.target.value })} />
                    </div>
                  </div>

                  {/* ── Gambar Paket Spesial ── */}
                  <div className="p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.05)", border: "1px dashed rgba(59,130,246,0.3)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold" style={{ color: "#3b82f6" }}>
                        🖼️ Gambar Paket Spesial
                        <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>— opsional, ganti ⭐ emoji</span>
                      </label>
                      {/* Tab mode */}
                      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(59,130,246,0.3)" }}>
                        {(["file", "url"] as const).map((mode) => (
                          <button key={mode} type="button"
                            onClick={() => {
                              setImgInputMode(mode);
                              // Reset state lain
                              if (mode === "file") { setSpecialImgUrl(""); }
                              else { setSpecialImageFile(null); }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold transition-all"
                            style={imgInputMode === mode
                              ? { background: "rgba(59,130,246,0.3)", color: "#93c5fd" }
                              : { background: "transparent", color: "var(--text-muted)" }}>
                            {mode === "file" ? "📁 Upload" : "🔗 URL"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Preview */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: "rgba(59,130,246,0.1)", border: "1px dashed rgba(59,130,246,0.4)" }}>
                        {specialImgPreview
                          ? <img src={specialImgPreview} alt="preview" style={{ width: 64, height: 64, objectFit: "contain" }}
                              onError={() => setSpecialImgPreview("")} />
                          : <ImageIcon size={24} style={{ color: "rgba(59,130,246,0.5)" }} />}
                      </div>

                      {/* Controls */}
                      <div className="flex-1 min-w-0">
                        {imgInputMode === "file" ? (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <label
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-80"
                                style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
                                {specialImgUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                Pilih File
                                <input
                                  ref={specialImgRef}
                                  type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    if (f.size > 1 * 1024 * 1024) { alert("Maks 1MB"); return; }
                                    setSpecialImageFile(f);
                                    setSpecialImgPreview(URL.createObjectURL(f));
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                              {specialImgPreview && (
                                <button type="button"
                                  onClick={() => { setSpecialImageFile(null); setSpecialImage(""); setSpecialImgPreview(""); }}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs"
                                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                  <X size={12} /> Hapus
                                </button>
                              )}
                            </div>
                            <p className="text-xs mt-1.5 truncate" style={{ color: "var(--text-muted)" }}>
                              {specialImageFile ? `📁 ${specialImageFile.name}` : specialImgPreview ? "✅ Gambar tersimpan" : "Belum ada gambar"}
                            </p>
                          </>
                        ) : (
                          <>
                            <input
                              type="url"
                              className="input-styled text-xs"
                              placeholder="https://example.com/gambar.png"
                              value={specialImgUrl}
                              onChange={(e) => {
                                setSpecialImgUrl(e.target.value);
                                // Live preview saat URL valid
                                const url = e.target.value.trim();
                                setSpecialImgPreview(url || "");
                                setSpecialImage(url);
                              }}
                            />
                            {specialImgUrl && (
                              <button type="button"
                                onClick={() => { setSpecialImgUrl(""); setSpecialImage(""); setSpecialImgPreview(""); }}
                                className="flex items-center gap-1 mt-1.5 text-xs"
                                style={{ color: "#ef4444" }}>
                                <X size={11} /> Hapus URL
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    {isSpecial ? "Harga per Kelipatan (Rp)" : "Harga (Rp)"}
                  </label>
                  <input id="product-price" type="number" className="input-styled" placeholder="53000"
                    value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Urutan</label>
                  <input id="product-sort" type="number" className="input-styled" placeholder="0"
                    value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
              </div>

              <div className="flex gap-6">
                {[{ key:"is_active",label:"Produk Aktif" },{ key:"is_popular",label:"Populer 🔥" }].map((o) => (
                  <label key={o.key} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "var(--text-secondary)" }}>
                    <input type="checkbox" checked={form[o.key as keyof Product] as boolean}
                      onChange={(e) => setForm({ ...form, [o.key]: e.target.checked })} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Batal</button>
              <button id="save-product-btn" onClick={handleSave} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirm Modal ── */}
      {confirmTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmTarget(null); }}
        >
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)" }}
              >
                <AlertTriangle size={22} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
                  Hapus Produk?
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Produk{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {confirmTarget.name}
                  </strong>{" "}
                  akan dihapus permanen dan tidak bisa dikembalikan.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                id="cancel-delete-btn"
                onClick={() => setConfirmTarget(null)}
                disabled={deleting}
                className="btn-outline flex-1"
              >
                Batal
              </button>
              <button
                id="confirm-delete-btn"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "#ef4444", color: "white" }}
              >
                {deleting
                  ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</>
                  : <><Trash2 size={16} /> Hapus Sekarang</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
