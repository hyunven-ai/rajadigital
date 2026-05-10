"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, RefreshCw, Trash2, CheckCircle, XCircle, Clock,
  Loader2, CalendarDays, FilterX, ChevronDown, Copy, Check,
  Zap, MessageCircle, Save, History, Plus, X, AlertCircle, BarChart2,
} from "lucide-react";

interface BongkarRequest {
  id: string;
  invoice_id: string;
  player_id: string;
  nominal_bongkar: number;
  bank: string;
  nomor_rekening: string;
  nama_rekening: string;
  whatsapp: string;
  status: "pending" | "diproses" | "selesai" | "batal";
  admin_notes?: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  admin_username: string;
  action: string;
  details?: string;
  created_at: string;
}

const STATUS_CFG = {
  pending:  { label: "Pending",  color: "#f59e0b", icon: Clock },
  diproses: { label: "Diproses", color: "#6366f1", icon: Loader2 },
  selesai:  { label: "Selesai",  color: "#10b981", icon: CheckCircle },
  batal:    { label: "Batal",    color: "#ef4444", icon: XCircle },
};

const BANK_LIST = [
  "BCA", "BNI", "BRI", "Mandiri", "BSI", "CIMB Niaga",
  "Danamon", "Permata", "BTN", "Maybank", "OCBC NISP",
  "Panin Bank", "Bank Jago", "Jenius (BTPN)", "SeaBank",
  "GoPay", "OVO", "DANA", "ShopeePay", "LinkAja",
];

const EMPTY_FORM = {
  player_id: "",
  nominal_bongkar: "",
  bank: "",
  nomor_rekening: "",
  nama_rekening: "",
  whatsapp: "",
  status: "pending" as "pending" | "diproses" | "selesai" | "batal",
};

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "diproses", label: "Diproses" },
  { key: "selesai", label: "Selesai" },
  { key: "batal", label: "Batal" },
];

export default function AdminBongkarChipPage() {
  const [rows, setRows]         = useState<BongkarRequest[]>([]);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BongkarRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form tambah manual
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  // Log history
  const [showLogs, setShowLogs]       = useState(false);
  const [logs, setLogs]               = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Bulk
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus]   = useState("selesai");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDelConfirm, setShowBulkDelConfirm] = useState(false);

  // Date
  const todayStr = new Date().toISOString().slice(0, 10);
  const [showToday, setShowToday] = useState(false);
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const hasDate = showToday || dateFrom || dateTo;

  /* fetch */
  const fetch_ = useCallback(async () => {
    try {
      const p = new URLSearchParams({ limit: "200" });
      if (filter !== "all") p.set("status", filter);
      if (showToday) { p.set("date_from", todayStr); p.set("date_to", todayStr); }
      else { if (dateFrom) p.set("date_from", dateFrom); if (dateTo) p.set("date_to", dateTo); }
      const res  = await fetch(`/api/bongkar-chip?${p}`);
      const data = await res.json();
      if (data.requests) setRows(data.requests);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter, showToday, dateFrom, dateTo, todayStr]);

  useEffect(() => { setLoading(true); fetch_(); }, [fetch_]);

  /* fetch logs */
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/activity-logs?action=DELETE_BONGKAR_CHIP&limit=50");
      const d   = await res.json();
      setLogs(d.logs ?? []);
    } catch { /* silent */ }
    finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => { if (showLogs) fetchLogs(); }, [showLogs, fetchLogs]);

  /* filtered */
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || r.invoice_id.toLowerCase().includes(q) || r.player_id.toLowerCase().includes(q)
      || r.whatsapp.includes(q) || r.nama_rekening.toLowerCase().includes(q) || r.bank.toLowerCase().includes(q);
  });

  /* select helpers */
  const allIds        = filtered.map(r => r.id);
  const allSelected   = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected  = allIds.some(id => selected.has(id)) && !allSelected;
  const toggleOne     = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll     = () => setSelected(allSelected ? new Set() : new Set(allIds));

  /* single status */
  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: status as BongkarRequest["status"] } : r));
    try {
      const res = await fetch(`/api/bongkar-chip/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { fetch_(); } // revert on fail
    } catch { fetch_(); }
    finally { setUpdating(null); }
  };

  /* bulk status */
  const handleBulkStatus = async () => {
    if (!selected.size) return;
    setBulkUpdating(true);
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/bongkar-chip/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatus }),
        })
      ));
      setRows(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: bulkStatus as BongkarRequest["status"] } : r));
      setSelected(new Set());
    } catch { fetch_(); }
    finally { setBulkUpdating(false); }
  };

  /* bulk delete */
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map(id => fetch(`/api/bongkar-chip/${id}`, { method: "DELETE" })));
      setRows(prev => prev.filter(r => !ids.includes(r.id)));
      setSelected(new Set());
      setShowBulkDelConfirm(false);
      if (showLogs) fetchLogs();
    } catch (e: any) { alert(e.message); }
    finally { setBulkDeleting(false); }
  };

  /* single delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bongkar-chip/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      setRows(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      if (showLogs) fetchLogs();
    } catch (e: any) { alert(e.message); }
    finally { setDeleting(false); }
  };

  /* handle save manual */
  const handleSave = async () => {
    setFormError("");
    if (!form.player_id.trim())      return setFormError("Player ID wajib diisi.");
    if (!form.nominal_bongkar)       return setFormError("Nominal bongkar wajib diisi.");
    const nom = parseInt(form.nominal_bongkar);
    if (isNaN(nom) || nom < 1)       return setFormError("Minimal nominal bongkar adalah 1B.");
    if (nom > 40)                    return setFormError("Maksimal 40B dalam 1x request.");
    if (!form.bank)                  return setFormError("Pilih bank / e-wallet tujuan.");
    if (!form.nomor_rekening.trim()) return setFormError("Nomor rekening wajib diisi.");
    if (!form.nama_rekening.trim())  return setFormError("Nama rekening wajib diisi.");
    if (!form.whatsapp.trim())       return setFormError("Nomor WhatsApp wajib diisi.");

    setSaving(true);
    try {
      const res = await fetch("/api/bongkar-chip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id:       form.player_id.trim(),
          nominal_bongkar: nom,
          bank:            form.bank,
          nomor_rekening:  form.nomor_rekening.trim(),
          nama_rekening:   form.nama_rekening.trim(),
          whatsapp:        form.whatsapp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      // Prepend new row & close form
      if (data.request) {
        setRows(prev => [{ ...data.request, status: form.status } as BongkarRequest, ...prev]);
      }
      // If status differs from default 'pending', update it
      if (form.status !== "pending" && data.request?.id) {
        await fetch(`/api/bongkar-chip/${data.request.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: form.status }),
        });
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetch_();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000); };
  const pendingCount = rows.filter(r => r.status === "pending").length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            <Zap size={22} style={{ color: "#f87171" }} /> Bongkar Chip
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Kelola dan proses semua request bongkar chip</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/bongkar-chip/analytics"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}
          >
            <BarChart2 size={14} /> Analitik
          </Link>
          <button id="refresh-bongkar-btn" onClick={() => { setLoading(true); fetch_(); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button id="btn-tambah-bongkar"
            onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setFormError(""); }}
            className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Plus size={16} /> Tambah Manual
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap mb-6">
        {[
          { label: "Total", val: rows.length, color: "#a78bfa" },
          { label: "Pending", val: pendingCount, color: "#f59e0b" },
          { label: "Diproses", val: rows.filter(r => r.status === "diproses").length, color: "#6366f1" },
          { label: "Selesai", val: rows.filter(r => r.status === "selesai").length, color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, color: s.color }}>
            {s.label}: <strong>{s.val}</strong>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card p-4 mb-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input id="bongkar-search" className="input-styled pl-9" placeholder="Cari Invoice, Player ID, WhatsApp, Nama..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(btn => (
              <button key={btn.key} id={`bongkar-filter-${btn.key}`} onClick={() => setFilter(btn.key)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={filter === btn.key
                  ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }
                  : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {btn.label}
                {btn.key === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "#f59e0b", color: "#000" }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button id="bongkar-today" onClick={() => { setShowToday(v => !v); setDateFrom(""); setDateTo(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={showToday ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }
              : { background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <CalendarDays size={13} /> Hari Ini
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>atau</span>
          <input type="date" value={dateFrom} max={dateTo || todayStr}
            onChange={e => { setDateFrom(e.target.value); setShowToday(false); }}
            className="text-xs rounded-lg px-2 py-1.5"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", colorScheme: "dark" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>s/d</span>
          <input type="date" value={dateTo} min={dateFrom} max={todayStr}
            onChange={e => { setDateTo(e.target.value); setShowToday(false); }}
            className="text-xs rounded-lg px-2 py-1.5"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", colorScheme: "dark" }} />
          {hasDate && (
            <button onClick={() => { setShowToday(false); setDateFrom(""); setDateTo(""); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
              <FilterX size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap mb-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(248,113,113,0.08)", border: "1.5px solid rgba(248,113,113,0.35)" }}>
          <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: "#f87171", color: "#fff" }}>
            {selected.size} dipilih
          </span>
          <button onClick={() => setSelected(new Set())} className="text-xs font-semibold hover:opacity-70"
            style={{ color: "var(--text-muted)" }}>Batal pilih</button>
          <div className="flex-1 h-px" style={{ background: "rgba(248,113,113,0.2)" }} />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Ubah ke:</span>
            <select id="bulk-status-select" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
              <option value="pending">Pending</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
              <option value="batal">Batal</option>
            </select>
            <button id="bulk-apply-btn" onClick={handleBulkStatus} disabled={bulkUpdating}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }}>
              {bulkUpdating ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Terapkan
            </button>
          </div>
          <button id="bulk-delete-btn" onClick={() => setShowBulkDelConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}>
            <Trash2 size={12} /> Hapus {selected.size}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-4 rounded" />
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Zap size={40} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Belum ada request bongkar chip</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-styled">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center", padding: "10px 8px" }}>
                    <input type="checkbox" id="select-all-bongkar"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                      style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#f87171" }} />
                  </th>
                  <th>Invoice</th><th>Player ID</th><th>Nominal</th>
                  <th>Bank</th><th>No. Rekening</th><th>Nama Rekening</th>
                  <th>WhatsApp</th><th>Waktu</th><th>Status</th><th>Ubah Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const s = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
                  const SI = s.icon;
                  const isSelected = selected.has(r.id);
                  return (
                    <tr key={r.id} style={isSelected ? { background: "rgba(248,113,113,0.05)", outline: "1px solid rgba(248,113,113,0.2)" } : undefined}>
                      <td style={{ textAlign: "center", padding: "8px" }}>
                        <input type="checkbox" id={`select-bongkar-${r.id}`}
                          checked={isSelected} onChange={() => toggleOne(r.id)}
                          style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#f87171" }} />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono" style={{ color: "#f87171" }}>{r.invoice_id}</code>
                          <button onClick={() => copy(r.invoice_id, r.id + "-inv")} style={{ color: copied === r.id + "-inv" ? "#10b981" : "var(--text-muted)", opacity: 0.7 }}>
                            {copied === r.id + "-inv" ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono">{r.player_id}</span>
                          <button onClick={() => copy(r.player_id, r.id + "-pid")} style={{ color: copied === r.id + "-pid" ? "#10b981" : "var(--text-muted)", opacity: 0.7 }}>
                            {copied === r.id + "-pid" ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td><span className="font-black text-sm" style={{ color: "#f87171" }}>{r.nominal_bongkar}B</span></td>
                      <td><span className="text-sm font-semibold">{r.bank}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono">{r.nomor_rekening}</span>
                          <button onClick={() => copy(r.nomor_rekening, r.id + "-rek")} style={{ color: copied === r.id + "-rek" ? "#10b981" : "var(--text-muted)", opacity: 0.7 }}>
                            {copied === r.id + "-rek" ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td><span className="text-sm">{r.nama_rekening}</span></td>
                      <td>
                        <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "#25D366" }}>
                          <MessageCircle size={12} /> {r.whatsapp}
                        </a>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit"
                          style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}>
                          <SI size={11} /> {s.label}
                        </span>
                      </td>
                      <td>
                        <div className="relative">
                          <select id={`bongkar-status-${r.id}`} value={r.status}
                            disabled={updating === r.id}
                            onChange={e => updateStatus(r.id, e.target.value)}
                            className="text-xs px-2 py-1.5 rounded-lg cursor-pointer"
                            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", appearance: "none", paddingRight: "24px" }}>
                            <option value="pending">Pending</option>
                            <option value="diproses">Diproses</option>
                            <option value="selesai">Selesai</option>
                            <option value="batal">Batal</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: "var(--text-muted)" }} />
                          {updating === r.id && <Loader2 size={10} className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--text-muted)" }} />}
                        </div>
                      </td>
                      <td>
                        <button id={`delete-bongkar-${r.id}`} onClick={() => setDeleteTarget(r)}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <Trash2 size={12} /> Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── LOG HISTORY PANEL ── */}
      <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <button id="toggle-bongkar-log"
          onClick={() => setShowLogs(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 transition-all hover:opacity-80"
          style={{ background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-2">
            <History size={15} style={{ color: "#a78bfa" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Log History Hapus Bongkar Chip</span>
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
                <p className="text-sm">Belum ada riwayat penghapusan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-styled w-full">
                  <thead>
                    <tr>
                      <th>Admin</th><th>Invoice</th><th>Player ID</th>
                      <th>Nominal</th><th>Bank</th><th>No. Rekening</th>
                      <th>Nama Rekening</th><th>WhatsApp</th><th>Status</th><th>Waktu Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      let d: any = {};
                      try { d = JSON.parse(log.details ?? "{}"); } catch { /* */ }
                      const sColor = d.status === "selesai" ? "#10b981" : d.status === "batal" ? "#ef4444" : d.status === "diproses" ? "#6366f1" : "#f59e0b";
                      return (
                        <tr key={log.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                                {log.admin_username?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{log.admin_username}</span>
                            </div>
                          </td>
                          <td><code className="text-xs font-mono" style={{ color: "#f87171" }}>{d.invoice_id ?? "-"}</code></td>
                          <td><span className="text-xs font-mono">{d.player_id ?? "-"}</span></td>
                          <td><span className="text-xs font-black" style={{ color: "#f87171" }}>{d.nominal_bongkar ? `${d.nominal_bongkar}B` : "-"}</span></td>
                          <td><span className="text-xs font-semibold">{d.bank ?? "-"}</span></td>
                          <td><span className="text-xs font-mono">{d.nomor_rekening ?? "-"}</span></td>
                          <td><span className="text-xs">{d.nama_rekening ?? "-"}</span></td>
                          <td>
                            <a href={`https://wa.me/${d.whatsapp}`} target="_blank" rel="noreferrer"
                              className="text-xs flex items-center gap-1" style={{ color: "#25D366" }}>
                              <MessageCircle size={11} />{d.whatsapp ?? "-"}
                            </a>
                          </td>
                          <td>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: `${sColor}18`, color: sColor, border: `1px solid ${sColor}30` }}>
                              {d.status ?? "-"}
                            </span>
                          </td>
                          <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</span></td>
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

      {/* Single Delete Modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card p-6" style={{ maxWidth: "380px", width: "100%" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                <Trash2 size={18} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Hapus Request</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{deleteTarget.invoice_id}</p>
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Hapus request bongkar <strong>{deleteTarget.nominal_bongkar}B</strong> dari <strong>{deleteTarget.nama_rekening}</strong>? Tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Batal</button>
              <button id="confirm-delete-bongkar" onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "rgba(239,68,68,0.9)", color: "#fff" }}>
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {showBulkDelConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card p-6" style={{ maxWidth: "380px", width: "100%" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                <Trash2 size={18} style={{ color: "#ef4444" }} />
              </div>
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Hapus {selected.size} Request?</h3>
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Semua <strong>{selected.size} request</strong> yang dipilih akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkDelConfirm(false)} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Batal</button>
              <button id="confirm-bulk-delete-bongkar" onClick={handleBulkDelete} disabled={bulkDeleting}
                className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "rgba(239,68,68,0.9)", color: "#fff" }}>
                {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL TAMBAH MANUAL ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
          <div className="card" style={{ maxWidth: "520px", width: "100%", margin: "auto" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(248,113,113,0.15)" }}>
                  <Zap size={18} style={{ color: "#f87171" }} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Tambah Request Manual</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Buat request bongkar chip dari admin</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); setFormError(""); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-all"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              {/* Player ID */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>🎮 Player ID *</label>
                <input id="form-bongkar-player-id" className="input-styled" placeholder="Masukkan Player ID"
                  value={form.player_id} onChange={e => setForm(f => ({ ...f, player_id: e.target.value }))} />
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>💰 Nominal Bongkar (B) *</label>
                <input id="form-bongkar-nominal" type="number" min="1" max="40" className="input-styled" placeholder="Contoh: 2 (artinya 2B)"
                  value={form.nominal_bongkar} onChange={e => setForm(f => ({ ...f, nominal_bongkar: e.target.value }))} />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Minimal 1B, maksimal 40B dalam 1x request</p>
              </div>

              {/* Bank */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>🏦 Bank / E-Wallet *</label>
                <select id="form-bongkar-bank" className="input-styled"
                  value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}>
                  <option value="" disabled>— Pilih Bank —</option>
                  {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Nomor & Nama Rekening */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>💳 Nomor Rekening *</label>
                  <input id="form-bongkar-norek" className="input-styled" placeholder="Nomor rekening"
                    value={form.nomor_rekening} onChange={e => setForm(f => ({ ...f, nomor_rekening: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>👤 Nama Rekening *</label>
                  <input id="form-bongkar-namarek" className="input-styled" placeholder="Nama sesuai rekening"
                    value={form.nama_rekening} onChange={e => setForm(f => ({ ...f, nama_rekening: e.target.value }))} />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>📱 Nomor WhatsApp *</label>
                <input id="form-bongkar-wa" type="tel" className="input-styled" placeholder="Contoh: 628123456789"
                  value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Status Awal</label>
                <div className="flex gap-2">
                  {(["pending", "diproses", "selesai", "batal"] as const).map(s => {
                    const cfg = STATUS_CFG[s];
                    const Icon = cfg.icon;
                    return (
                      <button key={s} type="button"
                        id={`form-status-${s}`}
                        onClick={() => setForm(f => ({ ...f, status: s }))}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={form.status === s
                          ? { background: `${cfg.color}20`, color: cfg.color, border: `1.5px solid ${cfg.color}` }
                          : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        <Icon size={12} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowForm(false); setFormError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Batal
              </button>
              <button id="save-bongkar-manual" onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Menyimpan..." : "Simpan Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
