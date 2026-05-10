"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare, Square, Clock, CheckCircle, XCircle,
  Search, MessageCircle, RefreshCw, Plus, X, Loader2,
  AlertTriangle, Zap, Save, Copy, Check, Trash2, History, ChevronDown,
  CalendarDays, CalendarRange, FilterX, FileDown, FileSpreadsheet, FileText,
} from "lucide-react";
import { useAlarm } from "@/hooks/useAlarm";
import AlarmControl from "@/components/AlarmControl";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { GAMES } from "@/lib/games";

interface Transaction {
  id: string;
  invoice_id: string;
  game_id: string;
  game_name: string;
  username?: string;
  whatsapp: string;
  product_name: string;
  product_price: number;
  status: "pending" | "selesai" | "batal";
  is_processed: boolean;
  notes?: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  game_name: string;
  price: number;
  amount?: string;
  is_active: boolean;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  details?: string;
  created_at: string;
}

const EMPTY_FORM = {
  game_slug:     "",       // slug untuk pilih game di dropdown
  game_id:       "",       // ID player / User ID / Server ID
  username:      "",
  game_name:     "",
  whatsapp:      "",
  product_id:    "",
  product_name:  "",
  product_price: "",
  notes:         "",
  status:        "pending" as Transaction["status"],
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b", icon: Clock },
  selesai: { label: "Selesai", color: "#10b981", icon: CheckCircle },
  batal:   { label: "Batal",   color: "#ef4444", icon: XCircle },
};

const FILTER_BUTTONS = [
  { key: "all",     label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "selesai", label: "Selesai" },
  { key: "batal",   label: "Batal" },
];

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter,  setFilter]  = useState<"all"|"pending"|"selesai"|"batal">("all");
  const [gameFilter, setGameFilter] = useState("");
  const [search,  setSearch]  = useState("");
  const [limit,   setLimit]   = useState(50);
  const [loading,       setLoading]       = useState(true);
  const [updating,      setUpdating]       = useState<string|null>(null);
  const [copiedGameId,  setCopiedGameId]   = useState<string|null>(null);
  const [deleteTarget,  setDeleteTarget]   = useState<Transaction|null>(null);
  const [deleting,      setDeleting]       = useState(false);
  const [showLogs,      setShowLogs]       = useState(false);
  const [logs,          setLogs]           = useState<ActivityLog[]>([]);
  const [loadingLogs,   setLoadingLogs]    = useState(false);
  const [newIds,  setNewIds]  = useState<Set<string>>(new Set());

  /* ── Export state ── */
  const [showExport, setShowExport] = useState(false);
  const [exporting,  setExporting]  = useState<"csv"|"xlsx"|null>(null);

  /* ── Bulk select state ── */
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [bulkStatus,    setBulkStatus]    = useState<string>("selesai");
  const [bulkDeleting,  setBulkDeleting]  = useState(false);
  const [bulkUpdating,  setBulkUpdating]  = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  /* ── Date filter state ── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const [showToday, setShowToday] = useState(false);
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const hasDateFilter = showToday || dateFrom || dateTo;

  /* ── Modal state ── */
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const pendingCount = transactions.filter(t => t.status === "pending").length;
  const getPending   = useCallback(() => pendingCount, [pendingCount]);
  const { config: alarmConfig, updateConfig, testAlarm, unlock } = useAlarm(getPending);

  /* ── Fetch transaksi ── */
  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (filter !== "all") params.set("status", filter);
      if (showToday) {
        params.set("date_from", todayStr);
        params.set("date_to",   todayStr);
      } else {
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo)   params.set("date_to",   dateTo);
      }
      const res  = await fetch(`/api/admin/transactions?${params}`);
      const data = await res.json();
      if (data.transactions) setTransactions(data.transactions);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter, showToday, dateFrom, dateTo, todayStr, limit]);

  useEffect(() => { setLoading(true); fetchTransactions(); }, [fetchTransactions]);

  /* Helper: clear semua date filter */
  const clearDateFilter = () => { setShowToday(false); setDateFrom(""); setDateTo(""); };

  /* ── Realtime ── */
  useEffect(() => {
    const channel = supabase
      .channel("transactions-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, (payload) => {
        const tx = payload.new as Transaction;
        setTransactions(prev => [tx, ...prev]);
        setNewIds(prev => new Set(prev).add(tx.id));
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(tx.id); return n; }), 4000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions" }, (payload) => {
        const updated = payload.new as Transaction;
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Fetch logs ── */
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/activity-logs?action=DELETE_TRANSACTION&limit=50");
      const d   = await res.json();
      setLogs(d.logs ?? []);
    } catch { /* silent */ }
    finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => { if (showLogs) fetchLogs(); }, [showLogs, fetchLogs]);

  /* ── Bulk select helpers — declared after filtered below ── */

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── Bulk update status ── */
  const handleBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/admin/transactions/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatus }),
        })
      ));
      setTransactions(prev => prev.map(t =>
        ids.includes(t.id) ? { ...t, status: bulkStatus as Transaction["status"] } : t
      ));
      setSelectedIds(new Set());
    } catch { fetchTransactions(); }
    finally { setBulkUpdating(false); }
  };

  /* ── Bulk delete ── */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
    const ids   = Array.from(selectedIds);
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/admin/transactions/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      if (showLogs) fetchLogs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  /* ── Delete transaksi (single) ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
      const res = await fetch(`/api/admin/transactions/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setTransactions(prev => prev.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      if (showLogs) fetchLogs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const fetchProducts = useCallback(async (gameName: string) => {
    if (!gameName) { setProducts([]); return; }
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/products?limit=100`);
      const d   = await res.json();
      const list: Product[] = (d.products ?? []).filter(
        (p: Product) => p.is_active && p.game_name?.toLowerCase() === gameName.toLowerCase()
      );
      setProducts(list);
    } catch { setProducts([]); }
    finally { setLoadingProducts(false); }
  }, []);

  /* ── Saat pilih game ── */
  const handleGameChange = (slug: string) => {
    const game = GAMES.find(g => g.id === slug || g.slug === slug);
    const gameName = game?.name ?? slug;
    // game_slug = slug pilihan dropdown; game_id di-reset (isi ID player belakangan)
    setForm(f => ({ ...f, game_slug: slug, game_name: gameName, game_id: "", product_id: "", product_name: "", product_price: "" }));
    fetchProducts(gameName);
  };

  /* ── Saat pilih produk ── */
  const handleProductChange = (productId: string) => {
    if (productId === "__custom") {
      setForm(f => ({ ...f, product_id: "", product_name: "", product_price: "" }));
      return;
    }
    const p = products.find(p => p.id === productId);
    if (p) setForm(f => ({ ...f, product_id: p.id, product_name: p.name, product_price: String(p.price) }));
  };

  /* ── Submit ── */
  const handleSave = async () => {
    setFormError("");
    if (!form.game_slug)     return setFormError("Pilih game terlebih dahulu.");
    if (!form.game_id)       return setFormError("ID Game / Server ID wajib diisi.");
    if (!form.whatsapp)      return setFormError("Nomor WhatsApp wajib diisi.");
    if (!form.product_name)  return setFormError("Nama produk wajib diisi.");
    if (!form.product_price) return setFormError("Harga wajib diisi.");

    setSaving(true);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id:       form.game_id,        // ID player
          username:      form.username,
          game_name:     form.game_name,      // nama game ("PUBG Mobile" dll)
          whatsapp:      form.whatsapp,
          product_id:    form.product_id || null,
          product_name:  form.product_name,
          product_price: Number(form.product_price),
          notes:         form.notes || null,
          status:        form.status,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Gagal membuat transaksi");

      setShowForm(false);
      setForm(EMPTY_FORM);
      setProducts([]);
      fetchTransactions();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Build rows for export ── */
  const buildExportRows = () =>
    filtered.map(t => {
      const { username, notes } = parseNotes(t.notes);
      return {
        "Invoice ID":    t.invoice_id,
        "Game":          t.game_name,
        "Game ID":       t.game_id,
        "Nama Pengguna": username || "-",
        "Produk":        t.product_name,
        "Harga (Rp)":    t.product_price,
        "WhatsApp":      t.whatsapp,
        "Status":        t.status,
        "Diproses":      t.is_processed ? "Ya" : "Tidak",
        "Catatan":       notes,
        "Tanggal":       new Date(t.created_at).toLocaleString("id-ID"),
      };
    });

  const getExportFilename = (ext: string) => {
    const d = showToday ? todayStr : dateFrom && dateTo ? `${dateFrom}_sd_${dateTo}` : "semua";
    return `transaksi_${d}_${new Date().toISOString().slice(0,10)}.${ext}`;
  };

  /* ── Export CSV ── */
  const exportCSV = async () => {
    setExporting("csv");
    try {
      const rows = buildExportRows();
      if (!rows.length) { alert("Tidak ada data untuk diekspor."); return; }
      const headers = Object.keys(rows[0]);
      const escape  = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv     = [headers.map(escape).join(","),
        ...rows.map(r => headers.map(h => escape((r as any)[h])).join(","))
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url; a.download = getExportFilename("csv"); a.click();
      URL.revokeObjectURL(url);
      setShowExport(false);
    } finally { setExporting(null); }
  };

  /* ── Export XLSX ── */
  const exportXLSX = async () => {
    setExporting("xlsx");
    try {
      const rows = buildExportRows();
      if (!rows.length) { alert("Tidak ada data untuk diekspor."); return; }
      const XLSX = await import("xlsx");
      const ws   = XLSX.utils.json_to_sheet(rows);
      // Auto column width
      const colWidths = Object.keys(rows[0]).map(k => ({
        wch: Math.max(k.length, ...rows.map(r => String((r as any)[k] ?? "").length)) + 2
      }));
      ws["!cols"] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
      XLSX.writeFile(wb, getExportFilename("xlsx"));
      setShowExport(false);
    } finally { setExporting(null); }
  };

  /* ── Update status ── */
  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: status as Transaction["status"] } : t));
    try {
      await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch { fetchTransactions(); }
    finally { setUpdating(null); }
  };

  const toggleProcess = async (t: Transaction) => {
    const newVal = !t.is_processed;
    setTransactions(prev => prev.map(x => x.id === t.id ? { ...x, is_processed: newVal } : x));
    try {
      await fetch(`/api/admin/transactions/${t.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: t.status, is_processed: newVal }),
      });
    } catch { fetchTransactions(); }
  };

  /* ── Helper: parse notes field (supports JSON, legacy prefix, plain string) ── */
  const parseNotes = (raw?: string): { username: string; notes: string } => {
    if (!raw) return { username: "", notes: "" };
    // New format: JSON {username, notes}
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        return { username: parsed.username ?? "", notes: parsed.notes ?? "" };
      }
    } catch { /* not JSON */ }
    // Legacy format: "Nama Pengguna: xxx"
    if (raw.startsWith("Nama Pengguna: ")) {
      return { username: raw.replace("Nama Pengguna: ", ""), notes: "" };
    }
    // Plain string = admin notes only
    return { username: "", notes: raw };
  };

  const uniqueGames = Array.from(new Set(transactions.map(t => t.game_name).filter(Boolean))).sort();

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const { username, notes } = parseNotes(t.notes);
    const matchSearch = !q || t.invoice_id.toLowerCase().includes(q) || t.game_id.includes(q)
      || username.toLowerCase().includes(q)
      || t.whatsapp.includes(q)
      || notes.toLowerCase().includes(q);
    const matchGame = !gameFilter || t.game_name === gameFilter;
    return matchSearch && matchGame;
  });

  const totalHarga = filtered.reduce((s, t) => s + (t.product_price ?? 0), 0);
  const totalSelesaiHarga = filtered.filter(t => t.status === "selesai").reduce((s, t) => s + (t.product_price ?? 0), 0);

  const activeGames = GAMES.filter(g => g.isActive);

  /* ── Bulk select helpers (needs filtered) ── */
  const allFilteredIds = filtered.map(t => t.id);
  const allSelected    = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
  const someSelected   = allFilteredIds.some(id => selectedIds.has(id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  /* ════════════════════════════════════════════ */
  return (
    <>
    <div onClick={unlock} onKeyDown={unlock}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            Manajemen Transaksi
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Kelola dan pantau semua transaksi masuk</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button id="refresh-tx-btn"
            onClick={() => { setLoading(true); fetchTransactions(); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          {/* ── TOMBOL EXPORT ── */}
          <button id="btn-export-tx"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}>
            <FileDown size={14} /> Export
            {filtered.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }}>{filtered.length}</span>
            )}
          </button>

          {/* ── TOMBOL TAMBAH ── */}
          <button id="btn-tambah-transaksi"
            onClick={() => { setShowForm(true); setFormError(""); setForm(EMPTY_FORM); setProducts([]); }}
            className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Plus size={16} /> Tambah Transaksi
          </button>

          <AlarmControl config={alarmConfig} onChange={updateConfig} onTest={testAlarm} pendingCount={pendingCount} />
        </div>
      </div>


      {/* Realtime indicator */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl mb-6 text-xs font-medium w-fit"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Realtime aktif — Transaksi baru masuk otomatis
      </div>

      {/* ── Filter & Search ── */}
      <div className="card p-4 mb-4 flex flex-col gap-3">
        {/* Row 1: Search + Game Filter + Status */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input id="tx-search" className="input-styled pl-9"
              placeholder="Cari Invoice ID, Game ID, atau WhatsApp..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Game filter dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              id="tx-game-filter"
              value={gameFilter}
              onChange={e => setGameFilter(e.target.value)}
              style={{
                height: "100%", padding: "10px 32px 10px 12px",
                borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: gameFilter ? "rgba(167,139,250,0.12)" : "var(--bg-secondary)",
                border: gameFilter ? "1px solid rgba(167,139,250,0.4)" : "1px solid var(--border)",
                color: gameFilter ? "#a78bfa" : "var(--text-secondary)",
                outline: "none", cursor: "pointer", appearance: "none",
                minWidth: 150,
              }}
            >
              <option value="">🎮 Semua Game</option>
              {uniqueGames.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "var(--text-muted)" }}>▼</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_BUTTONS.map(btn => (
              <button key={btn.key} id={`filter-${btn.key}`}
                onClick={() => setFilter(btn.key as typeof filter)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={filter === btn.key
                  ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }
                  : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {btn.label}
                {btn.key === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "#f59e0b", color: "#000" }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date filter */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Hari ini shortcut */}
          <button id="filter-today"
            onClick={() => { setShowToday(v => !v); setDateFrom(""); setDateTo(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={showToday
              ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", boxShadow: "0 2px 10px rgba(99,102,241,0.3)" }
              : { background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <CalendarDays size={13} /> Hari Ini
          </button>

          {/* Separator */}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>atau</span>

          {/* From date */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Dari</label>
            <input
              id="date-from" type="date"
              value={dateFrom}
              max={dateTo || todayStr}
              onChange={e => { setDateFrom(e.target.value); setShowToday(false); }}
              className="text-xs rounded-lg px-2 py-1.5 cursor-pointer"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Sampai</label>
            <input
              id="date-to" type="date"
              value={dateTo}
              min={dateFrom}
              max={todayStr}
              onChange={e => { setDateTo(e.target.value); setShowToday(false); }}
              className="text-xs rounded-lg px-2 py-1.5 cursor-pointer"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
            />
          </div>

          {/* Clear button (muncul jika ada filter aktif) */}
          {hasDateFilter && (
            <button id="clear-date-filter" onClick={clearDateFilter}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
              <FilterX size={12} /> Hapus Filter
            </button>
          )}

          {/* Active filter badge */}
          {hasDateFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ml-auto"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
              <CalendarRange size={11} />
              {showToday
                ? `Hari ini (${todayStr})`
                : `${dateFrom || "…"} → ${dateTo || "…"}`}
            </div>
          )}

          {/* Limit / Per Page Selector */}
          <div className={`flex items-center gap-1.5 ${hasDateFilter ? "" : "ml-auto"}`}>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Tampilkan:</label>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="text-xs rounded-lg px-2 py-1.5 cursor-pointer"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <option value={10}>10 baris</option>
              <option value={20}>20 baris</option>
              <option value={30}>30 baris</option>
              <option value={50}>50 baris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary hari ini */}
      {showToday && !loading && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {[
            { label: "Total Hari Ini", val: filtered.length, color: "#a78bfa" },
            { label: "Selesai",        val: filtered.filter(t => t.status === "selesai").length, color: "#10b981" },
            { label: "Pending",        val: filtered.filter(t => t.status === "pending").length, color: "#f59e0b" },
            { label: "Revenue",        val: `Rp ${filtered.filter(t=>t.status==="selesai").reduce((s,t)=>s+t.product_price,0).toLocaleString("id-ID")}`, color: "#fbbf24" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: `${item.color}12`, border: `1px solid ${item.color}30`, color: item.color }}>
              {item.label}: <strong>{item.val}</strong>
            </div>
          ))}
        </div>
      )}


      {/* ── BULK ACTION BAR — appears when rows are selected ── */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 flex-wrap mb-3 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1.5px solid rgba(251,191,36,0.35)",
            animation: "slide-up 0.25s ease",
          }}
        >
          {/* Count badge */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: "#fbbf24", color: "#0f172a" }}
            >
              {selectedIds.size} dipilih
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-semibold hover:opacity-70 transition-all"
              style={{ color: "var(--text-muted)" }}
            >
              Batal pilih
            </button>
          </div>

          <div className="flex-1 h-px" style={{ background: "rgba(251,191,36,0.2)" }} />

          {/* Bulk status change */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Ubah status ke:</span>
            <select
              id="bulk-status-select"
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg cursor-pointer"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <option value="pending">Pending</option>
              <option value="selesai">Selesai</option>
              <option value="batal">Batal</option>
            </select>
            <button
              id="bulk-update-status-btn"
              onClick={handleBulkStatus}
              disabled={bulkUpdating}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }}
            >
              {bulkUpdating
                ? <Loader2 size={12} className="animate-spin" />
                : <Save size={12} />}
              Terapkan
            </button>
          </div>

          {/* Bulk delete */}
          <button
            id="bulk-delete-btn"
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}
          >
            <Trash2 size={12} />
            Hapus {selectedIds.size} Transaksi
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-5 w-5 rounded" />
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-7 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-styled">
              <thead>
                <tr>
                  {/* SELECT ALL checkbox in header */}
                  <th style={{ width: 44, textAlign: "center", padding: "10px 8px" }}>
                    <input
                      type="checkbox"
                      id="select-all-checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#fbbf24" }}
                    />
                  </th>
                  <th>Invoice</th><th>Game ID</th><th>Nama</th>
                  <th>Paket</th><th>Harga</th><th>WhatsApp</th><th>Catatan</th>
                  <th>Waktu</th><th>Status</th><th>Ubah Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const s = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = s.icon;
                  const isNew  = newIds.has(t.id);
                  const isBusy = updating === t.id;
                  return (
                    <tr key={t.id} style={isNew ? {
                      background: "rgba(251,191,36,0.07)",
                      outline: "1px solid rgba(251,191,36,0.3)",
                      animation: "pulse 1s ease-in-out 3",
                    } : selectedIds.has(t.id) ? {
                      background: "rgba(251,191,36,0.05)",
                      outline: "1px solid rgba(251,191,36,0.2)",
                    } : undefined}>
                      {/* Per-row checkbox */}
                      <td style={{ textAlign: "center", padding: "8px" }}>
                        <input
                          type="checkbox"
                          id={`select-${t.id}`}
                          checked={selectedIds.has(t.id)}
                          onChange={() => toggleOne(t.id)}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#fbbf24" }}
                        />
                      </td>
                      <td>
                        <code className="text-xs font-mono" style={{ color: "#fbbf24" }}>{t.invoice_id}</code>
                        {isNew && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#fbbf24", color: "#000" }}>NEW</span>}
                      </td>
                      <td>
                        <div className="group/gid flex items-center gap-1.5">
                          <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>{t.game_id}</span>
                          <button
                            id={`copy-gameid-${t.id}`}
                            title="Copy Game ID"
                            onClick={() => {
                              navigator.clipboard.writeText(t.game_id);
                              setCopiedGameId(t.id);
                              setTimeout(() => setCopiedGameId(null), 2000);
                            }}
                            className="opacity-0 group-hover/gid:opacity-100 transition-all flex items-center justify-center rounded-md hover:scale-110 active:scale-95"
                            style={{
                              width: 22, height: 22,
                              background: copiedGameId === t.id ? "rgba(16,185,129,0.15)" : "rgba(124,58,237,0.12)",
                              border: `1px solid ${copiedGameId === t.id ? "rgba(16,185,129,0.4)" : "rgba(124,58,237,0.3)"}`,
                              color: copiedGameId === t.id ? "#10b981" : "#a78bfa",
                              flexShrink: 0,
                            }}
                          >
                            {copiedGameId === t.id
                              ? <Check size={11} />
                              : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td><span className="text-sm">{parseNotes(t.notes).username || "-"}</span></td>
                      <td><span className="text-sm font-semibold">{t.product_name}</span></td>
                      <td><span className="font-bold text-sm">{formatCurrency(t.product_price)}</span></td>
                      <td>
                        <a href={`https://wa.me/${t.whatsapp}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "#25D366" }}>
                          <MessageCircle size={12} /> {t.whatsapp}
                        </a>
                      </td>
                      <td>
                        {(() => {
                          const { notes } = parseNotes(t.notes);
                          return notes
                            ? <span className="text-xs" style={{ color: "var(--text-muted)", maxWidth: 140, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={notes}>📝 {notes}</span>
                            : <span className="text-xs" style={{ color: "var(--border)" }}>—</span>;
                        })()}
                      </td>
                      <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(t.created_at)}</span></td>
                      <td>
                        <span className="badge text-xs" style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
                          <StatusIcon size={10} />{s.label}
                        </span>
                      </td>
                      <td>
                        <select id={`status-select-${t.id}`} value={t.status}
                          onChange={e => updateStatus(t.id, e.target.value)} disabled={isBusy}
                          className="text-xs px-2 py-1.5 rounded-lg cursor-pointer"
                          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", opacity: isBusy ? 0.5 : 1 }}>
                          <option value="pending">Pending</option>
                          <option value="selesai">Selesai</option>
                          <option value="batal">Batal</option>
                        </select>
                      </td>
                      <td className="text-right">
                        <button
                          id={`del-tx-${t.id}`}
                          title="Hapus transaksi"
                          onClick={() => setDeleteTarget(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                      <MessageCircle size={36} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{search ? `Tidak ada hasil untuk "${search}"` : "Belum ada transaksi"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* ── Summary tfoot ── */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--border)", background: "rgba(255,255,255,0.015)" }}>
                    <td colSpan={5} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Total ({filtered.length} transaksi{gameFilter ? ` — ${gameFilter}` : ""})
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-sm" style={{ color: "#fbbf24" }}>
                          {formatCurrency(totalHarga)}
                        </span>
                        {totalSelesaiHarga !== totalHarga && (
                          <span className="text-xs" style={{ color: "#10b981" }}>
                            Selesai: {formatCurrency(totalSelesaiHarga)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 text-xs flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Menampilkan <strong>{filtered.length}</strong> transaksi
            {gameFilter && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>
                🎮 {gameFilter}
                <button onClick={() => setGameFilter("")} style={{ marginLeft: 2, cursor: "pointer", color: "#a78bfa", opacity: 0.7 }}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── LOG HISTORY PANEL ── */}
      <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <button id="toggle-log-history"
          onClick={() => setShowLogs(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 transition-all hover:opacity-80"
          style={{ background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-2">
            <History size={15} style={{ color: "#a78bfa" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Log History Hapus Transaksi</span>
            {logs.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                {logs.length} log
              </span>
            )}
          </div>
          <ChevronDown size={15} className={`transition-transform ${showLogs ? "rotate-180" : ""}`}
            style={{ color: "var(--text-muted)" }} />
        </button>

        {showLogs && (
          <div className="p-4">
            <div className="flex justify-end mb-3">
              <button onClick={fetchLogs}
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <RefreshCw size={11} className={loadingLogs ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {loadingLogs ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                <History size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Belum ada riwayat penghapusan transaksi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-styled w-full">
                  <thead>
                    <tr>
                      <th>Admin</th><th>Invoice</th><th>Game ID</th>
                      <th>Produk</th><th>Harga</th><th>Status</th>
                      <th>WhatsApp</th><th>Waktu Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      let d: any = {};
                      try { d = JSON.parse(log.details ?? "{}"); } catch { /* */ }
                      const sColor = d.status === "selesai" ? "#10b981" : d.status === "batal" ? "#ef4444" : "#f59e0b";
                      return (
                        <tr key={log.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                                {log.admin_username?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                {log.admin_username}
                              </span>
                            </div>
                          </td>
                          <td><code className="text-xs font-mono" style={{ color: "#fbbf24" }}>{d.invoice_id ?? "-"}</code></td>
                          <td><span className="text-xs font-mono">{d.game_id ?? "-"}</span></td>
                          <td><span className="text-xs">{d.product_name ?? "-"}</span></td>
                          <td><span className="text-xs font-bold">{d.product_price ? formatCurrency(d.product_price) : "-"}</span></td>
                          <td>
                            <span className="badge text-xs" style={{ background: `${sColor}18`, color: sColor, border: `1px solid ${sColor}30` }}>
                              {d.status ?? "-"}
                            </span>
                          </td>
                          <td>
                            <a href={`https://wa.me/${d.whatsapp}`} target="_blank" rel="noreferrer"
                              className="text-xs flex items-center gap-1" style={{ color: "#25D366" }}>
                              <MessageCircle size={11} />{d.whatsapp ?? "-"}
                            </a>
                          </td>
                          <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(log.created_at)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL DELETE CONFIRM ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)" }}>
                <Trash2 size={22} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Hapus Transaksi?</h2>
                <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>Tindakan ini tidak dapat dibatalkan.</p>
                <div className="space-y-1 text-xs p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--text-muted)" }}>Invoice</span>
                    <code style={{ color: "#fbbf24" }}>{deleteTarget.invoice_id}</code>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--text-muted)" }}>Produk</span>
                    <span style={{ color: "var(--text-primary)" }}>{deleteTarget.product_name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--text-muted)" }}>Harga</span>
                    <strong style={{ color: "var(--text-primary)" }}>{formatCurrency(deleteTarget.product_price)}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--text-muted)" }}>WhatsApp</span>
                    <span style={{ color: "#25D366" }}>{deleteTarget.whatsapp}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
              <AlertTriangle size={12} />
              Hapus akan dicatat di log history dengan ID admin Anda.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-outline flex-1">Batal</button>
              <button id="confirm-delete-tx" onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "#ef4444", color: "white", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Menghapus..." : "Hapus Transaksi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL BULK DELETE CONFIRM ── */}
      {showBulkDeleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBulkDeleteConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)" }}>
                <Trash2 size={22} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
                  Hapus {selectedIds.size} Transaksi?
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Semua transaksi yang dipilih akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-5 text-xs"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
            >
              <AlertTriangle size={13} />
              {selectedIds.size} transaksi akan dihapus sekaligus dan dicatat di log history.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
                className="btn-outline flex-1"
              >
                Batal
              </button>
              <button
                id="confirm-bulk-delete-btn"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "#ef4444", color: "white", opacity: bulkDeleting ? 0.7 : 1 }}
              >
                {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {bulkDeleting ? "Menghapus..." : `Hapus ${selectedIds.size} Transaksi`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL TAMBAH TRANSAKSI ══════════ */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 580, maxHeight: "92vh", overflowY: "auto" }}>

            {/* Header modal */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(251,191,36,0.15)" }}>
                  <Zap size={18} style={{ color: "#fbbf24" }} />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Tambah Transaksi Manual</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Invoice akan digenerate otomatis</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  <AlertTriangle size={14} className="flex-shrink-0" /> {formError}
                </div>
              )}

              {/* Game */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  🎮 Game *
                </label>
                <select id="form-game" className="input-styled"
                  value={form.game_slug}
                  onChange={e => handleGameChange(e.target.value)}>
                  <option value="">— Pilih Game —</option>
                  {activeGames.map(g => (
                    <option key={g.id} value={g.slug}>{g.emoji} {g.name}</option>
                  ))}
                </select>
              </div>

              {/* Game ID (ID player / Server ID) */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  🆔 ID Game / Server ID *
                </label>
                <input id="form-game-id" className="input-styled"
                  placeholder="Contoh: 123456789 (1234)"
                  value={form.game_id}
                  onChange={e => setForm(f => ({ ...f, game_id: e.target.value }))} />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  ID akun game pelanggan (User ID / Server ID)
                </p>
              </div>

              {/* Username / Game */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  👤 Nama Pengguna / Game
                </label>
                <input id="form-username" className="input-styled"
                  placeholder="Contoh: xxxx"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  📱 Nomor WhatsApp *
                </label>
                <input id="form-whatsapp" className="input-styled" placeholder="Contoh: 628123456789"
                  value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
              </div>

              {/* Produk */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  📦 Pilih Produk {loadingProducts && <Loader2 size={11} className="inline animate-spin ml-1" />}
                </label>
                <select id="form-product" className="input-styled"
                  value={form.product_id || "__custom"}
                  onChange={e => handleProductChange(e.target.value)}
                  disabled={!form.game_slug || loadingProducts}>
                  <option value="__custom">— Input Manual —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
                {form.game_name && products.length === 0 && !loadingProducts && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Tidak ada produk untuk game ini. Isi nama dan harga secara manual.
                  </p>
                )}
              </div>

              {/* Nama Produk + Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Nama Produk *
                  </label>
                  <input id="form-product-name" className="input-styled" placeholder="Contoh: 86 Diamond"
                    value={form.product_name}
                    onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Harga (Rp) *
                  </label>
                  <input id="form-price" type="number" className="input-styled" placeholder="Contoh: 18000"
                    value={form.product_price}
                    onChange={e => setForm(f => ({ ...f, product_price: e.target.value }))} />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  📝 Catatan (opsional)
                </label>
                <input id="form-notes" className="input-styled" placeholder="Catatan internal admin..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {/* Status awal */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  Status Awal
                </label>
                <div className="flex gap-2">
                  {(["pending", "selesai", "batal"] as const).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button key={s} type="button"
                        onClick={() => setForm(f => ({ ...f, status: s }))}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={form.status === s
                          ? { background: `${cfg.color}20`, color: cfg.color, border: `1.5px solid ${cfg.color}` }
                          : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        <cfg.icon size={12} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview invoice (simulasi) */}
              {form.product_price && form.product_name && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#fbbf24" }}>📋 Ringkasan Transaksi</p>
                  <div className="text-xs space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                    <div className="flex justify-between"><span>Game</span><span>{form.game_name || "-"}</span></div>
                    <div className="flex justify-between"><span>Produk</span><span>{form.product_name}</span></div>
                    <div className="flex justify-between"><span>Harga</span>
                      <strong style={{ color: "var(--text-primary)" }}>{form.product_price ? formatCurrency(Number(form.product_price)) : "-"}</strong>
                    </div>
                    <div className="flex justify-between"><span>WhatsApp</span><span>{form.whatsapp || "-"}</span></div>
                    <div className="flex justify-between"><span>Invoice</span><span style={{ color: "#fbbf24" }}>RDG-XXXXXXXX-XXXX (auto)</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Batal</button>
              <button id="save-transaction-btn" onClick={handleSave} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Menyimpan..." : "Buat Transaksi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* ══ MODAL EXPORT — di luar unlock wrapper ══ */}
      {showExport && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExport(false)}>
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)" }}>
                  <FileDown size={18} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Export Data Transaksi</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pilih format file yang ingin diunduh</p>
                </div>
              </div>
              <button onClick={() => setShowExport(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="rounded-xl p-4 mb-5" style={{ background: "var(--bg-secondary)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>📋 Data yang akan diekspor:</p>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span style={{ color: "var(--text-muted)" }}>Total baris</span>
                <strong className="text-right" style={{ color: "#a78bfa" }}>{filtered.length} transaksi</strong>
                <span style={{ color: "var(--text-muted)" }}>Status</span>
                <strong className="text-right" style={{ color: "var(--text-primary)" }}>{filter === "all" ? "Semua" : filter}</strong>
                <span style={{ color: "var(--text-muted)" }}>Selesai</span>
                <strong className="text-right" style={{ color: "#10b981" }}>{filtered.filter(t => t.status === "selesai").length}</strong>
                <span style={{ color: "var(--text-muted)" }}>Pending</span>
                <strong className="text-right" style={{ color: "#f59e0b" }}>{filtered.filter(t => t.status === "pending").length}</strong>
                <span style={{ color: "var(--text-muted)" }}>Periode</span>
                <strong className="text-right" style={{ color: "#818cf8", fontSize: 10 }}>
                  {showToday ? `Hari ini (${todayStr})`
                    : dateFrom && dateTo ? `${dateFrom} s.d. ${dateTo}`
                    : dateFrom ? `Dari ${dateFrom}` : dateTo ? `Sampai ${dateTo}` : "Semua"}
                </strong>
                <span style={{ color: "var(--text-muted)" }}>Revenue selesai</span>
                <strong className="text-right" style={{ color: "#fbbf24" }}>
                  {formatCurrency(filtered.filter(t => t.status === "selesai").reduce((s, t) => s + t.product_price, 0))}
                </strong>
              </div>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-2 mb-4 rounded-xl text-xs"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                ⚠️ Tidak ada data untuk diekspor
              </div>
            )}

            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Pilih format:</p>
            <div className="grid grid-cols-2 gap-3">
              <button id="export-csv-btn" onClick={exportCSV}
                disabled={!!exporting || filtered.length === 0}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
                  opacity: (exporting || filtered.length === 0) ? 0.5 : 1,
                  cursor: (exporting || filtered.length === 0) ? "not-allowed" : "pointer" }}>
                {exporting === "csv" ? <Loader2 size={28} className="animate-spin" style={{ color: "#10b981" }} /> : <FileText size={28} style={{ color: "#10b981" }} />}
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: "#10b981" }}>CSV</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Excel / Sheets</p>
                </div>
              </button>
              <button id="export-xlsx-btn" onClick={exportXLSX}
                disabled={!!exporting || filtered.length === 0}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)",
                  opacity: (exporting || filtered.length === 0) ? 0.5 : 1,
                  cursor: (exporting || filtered.length === 0) ? "not-allowed" : "pointer" }}>
                {exporting === "xlsx" ? <Loader2 size={28} className="animate-spin" style={{ color: "#818cf8" }} /> : <FileSpreadsheet size={28} style={{ color: "#818cf8" }} />}
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: "#818cf8" }}>XLSX</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Excel native</p>
                </div>
              </button>
            </div>
            <p className="text-xs mt-4 text-center" style={{ color: "var(--text-muted)" }}>File otomatis terunduh</p>
          </div>
        </div>
      )}
    </>
  );
}
