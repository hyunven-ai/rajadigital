"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { GAMES } from "@/lib/games";
import { useAlarm } from "@/hooks/useAlarm";
import AlarmControl from "@/components/AlarmControl";
import {
  Search, RefreshCw, Trash2, CheckCircle, XCircle, Clock,
  Loader2, CalendarDays, FilterX, ChevronDown, Copy, Check,
  Zap, MessageCircle, Save, History, Plus, X, AlertCircle, BarChart2,
} from "lucide-react";

interface BongkarRequest {
  id: string;
  invoice_id: string;
  game_name?: string;
  player_id: string;
  nominal_bongkar: number;
  nominal_pembayaran?: number;
  bank: string;
  nomor_rekening: string;
  nama_rekening: string;
  whatsapp: string;
  status: "pending" | "diproses" | "selesai" | "batal";
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
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
  game_name: "",
  player_id: "",
  nominal_bongkar: "",
  bank: "",
  nomor_rekening: "",
  nama_rekening: "",
  whatsapp: "",
  status: "pending" as "pending" | "diproses" | "selesai" | "batal",
};

const FILTERS = [
  { key: "pending,diproses", label: "Semua Masuk" },
  { key: "pending", label: "Pending" },
  { key: "diproses", label: "Diproses" },
];

export default function AdminBongkarChipPage() {
  const [rows, setRows]         = useState<BongkarRequest[]>([]);
  const [filter, setFilter]     = useState("pending,diproses");
  const [gameFilter, setGameFilter] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  const [adminRole, setAdminRole] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAdminRole(localStorage.getItem("admin_role") ?? "");
    }
  }, []);

  const [deleteTarget, setDeleteTarget] = useState<BongkarRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pendingCount = rows.filter(r => r.status === "pending").length;
  const getPending   = useCallback(() => pendingCount, [pendingCount]);
  const { config: alarmConfig, updateConfig, testAlarm, unlock, triggerImmediate } = useAlarm(getPending);

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

  // Modal pembayaran — muncul saat status diubah ke "selesai"
  const [payModal, setPayModal] = useState<{ id: string; nominal: string } | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Date
  // Pakai tanggal lokal WIB — bukan UTC (toISOString bisa balik tanggal kemarin sebelum jam 07:00 WIB)
  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const [showToday, setShowToday] = useState(false);
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const hasDate = showToday || dateFrom || dateTo;

  /* fetch */
  const fetch_ = useCallback(async () => {
    try {
      const p = new URLSearchParams({ limit: "200" });
      if (filter && filter !== "all") p.set("status", filter);
      else p.set("status", "pending,diproses");
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

  /* realtime */
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("admin-bongkar-chip")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "bongkar_chip_requests" },
        (payload: { new: BongkarRequest }) => {
          const r = payload.new;
          setRows(prev => {
            if (prev.some(x => x.id === r.id)) return prev;
            return [r, ...prev];
          });
          triggerImmediate("Bongkar Chip Baru!", `Request ${r.nominal_bongkar}B dari ${r.player_id}`);
        }
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "bongkar_chip_requests" },
        (payload: { new: BongkarRequest }) => {
          const updated = payload.new;
          if (updated.status === "selesai" || updated.status === "batal") {
             setRows(prev => prev.filter(x => x.id !== updated.id));
          } else {
             setRows(prev => prev.map(x => x.id === updated.id ? updated : x));
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* filtered */
  const uniqueGames = Array.from(new Set(rows.map(r => r.game_name).filter(Boolean))).sort() as string[];
  const activeGames = GAMES.filter(g => g.isActive);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.invoice_id.toLowerCase().includes(q) || r.player_id.toLowerCase().includes(q)
      || r.whatsapp.includes(q) || r.nama_rekening.toLowerCase().includes(q) || r.bank.toLowerCase().includes(q);
    const matchGame = !gameFilter || r.game_name === gameFilter;
    const matchBank = !bankFilter || r.bank === bankFilter;
    return matchSearch && matchGame && matchBank;
  });

  /* limit / pagination */
  const [limit, setLimit] = useState<10 | 20 | 50>(20);
  const paginated = filtered.slice(0, limit);

  /* totals untuk summary row */
  const totalNominalBongkar = filtered.reduce((s, r) => s + (r.nominal_bongkar ?? 0), 0);
  const totalNominalPembayaran = filtered.reduce((s, r) => s + (r.nominal_pembayaran ?? 0), 0);

  /* select helpers */
  const allIds        = filtered.map(r => r.id);
  const allSelected   = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected  = allIds.some(id => selected.has(id)) && !allSelected;
  const toggleOne     = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll     = () => setSelected(allSelected ? new Set() : new Set(allIds));

  /* single status */
  const updateStatus = async (id: string, status: string) => {
    // Jika status selesai, tampilkan modal input nominal pembayaran
    if (status === "selesai") {
      setPayModal({ id, nominal: "" });
      return;
    }
    setUpdating(id);
    if (status === "selesai" || status === "batal") {
      setRows(prev => prev.filter(r => r.id !== id));
    } else {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: status as BongkarRequest["status"] } : r));
    }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
      const res = await fetch(`/api/bongkar-chip/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { fetch_(); }
    } catch { fetch_(); }
    finally { setUpdating(null); }
  };

  /* konfirmasi selesai + nominal pembayaran */
  const handleConfirmPayment = async () => {
    if (!payModal) return;
    setPaySubmitting(true);
    const nominalNum = payModal.nominal ? parseInt(payModal.nominal) : undefined;
    setRows(prev => prev.filter(r => r.id !== payModal.id));
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
      await fetch(`/api/bongkar-chip/${payModal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "selesai", nominal_pembayaran: nominalNum ?? null }),
      });
      setPayModal(null);
    } catch { fetch_(); setPayModal(null); }
    finally { setPaySubmitting(false); }
  };

  /* bulk status */
  const handleBulkStatus = async () => {
    if (!selected.size) return;
    setBulkUpdating(true);
    const ids = Array.from(selected);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
      await Promise.all(ids.map(id =>
        fetch(`/api/bongkar-chip/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: bulkStatus }),
        })
      ));
      if (bulkStatus === "selesai" || bulkStatus === "batal") {
        setRows(prev => prev.filter(r => !ids.includes(r.id)));
      } else {
        setRows(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: bulkStatus as BongkarRequest["status"] } : r));
      }
      setSelected(new Set());
    } catch { fetch_(); }
    finally { setBulkUpdating(false); }
  };

  /* bulk delete */
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
      await Promise.all(ids.map(id =>
        fetch(`/api/bongkar-chip/${id}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      ));
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
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
      const res = await fetch(`/api/bongkar-chip/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
    if (!form.game_name)             return setFormError("Pilih game terlebih dahulu.");
    if (!form.player_id.trim())      return setFormError("Player ID wajib diisi.");
    if (!form.nominal_bongkar)       return setFormError("Nominal bongkar wajib diisi.");
    const nom = parseInt(form.nominal_bongkar);
    if (isNaN(nom) || nom < 1)       return setFormError("Minimal nominal bongkar adalah 1B.");
    if (nom > 40)                    return setFormError("Maksimal 40B dalam 1x request.");
    if (!form.bank)                  return setFormError("Pilih bank / e-wallet tujuan.");
    if (!form.nomor_rekening.trim()) return setFormError("Nomor rekening wajib diisi.");
    if (!form.nama_rekening.trim())  return setFormError("Nama rekening wajib diisi.");
    if (!form.whatsapp.trim())       return setFormError("Nomor WhatsApp wajib diisi.");
    const waRegex = /^(08|628)\d{8,12}$/;
    if (!waRegex.test(form.whatsapp.trim())) return setFormError("Nomor WhatsApp tidak valid (contoh: 08123456789 atau 628...)");

    setSaving(true);
    try {
      const res = await fetch("/api/bongkar-chip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_name:       form.game_name,
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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            <Zap size={22} style={{ color: "#f87171" }} /> Bongkar Chip Masuk
          </h1>
          <p className="text-sm flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            Kelola dan proses semua request bongkar chip
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={
                realtimeConnected
                  ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }
                  : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }
              }
            >
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: realtimeConnected ? "#10b981" : "#ef4444",
                  display: "inline-block",
                  boxShadow: realtimeConnected ? "0 0 6px #10b981" : "none",
                  animation: realtimeConnected ? "pulse 2s ease-in-out infinite" : "none",
                }}
              />
              {realtimeConnected ? "Realtime aktif" : "Menghubungkan..."}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AlarmControl config={alarmConfig} onChange={updateConfig} onTest={testAlarm} pendingCount={pendingCount} />
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
          {/* Game filter dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              id="bongkar-game-filter"
              value={gameFilter}
              onChange={e => setGameFilter(e.target.value)}
              style={{
                height: "100%", padding: "10px 32px 10px 12px",
                borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: gameFilter ? "rgba(167,139,250,0.12)" : "var(--bg-secondary)",
                border: gameFilter ? "1px solid rgba(167,139,250,0.4)" : "1px solid var(--border)",
                color: gameFilter ? "#a78bfa" : "var(--text-secondary)",
                outline: "none", cursor: "pointer", appearance: "none",
                minWidth: 140,
              }}
            >
              <option value="">🎮 Semua Game</option>
              {activeGames.map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "var(--text-muted)" }}>▼</span>
          </div>
          {/* Bank filter dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              id="bongkar-bank-filter"
              value={bankFilter}
              onChange={e => setBankFilter(e.target.value)}
              style={{
                height: "100%", padding: "10px 32px 10px 12px",
                borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: bankFilter ? "rgba(16,185,129,0.12)" : "var(--bg-secondary)",
                border: bankFilter ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--border)",
                color: bankFilter ? "#10b981" : "var(--text-secondary)",
                outline: "none", cursor: "pointer", appearance: "none",
                minWidth: 140,
              }}
            >
              <option value="">🏦 Semua Bank</option>
              {BANK_LIST.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "var(--text-muted)" }}>▼</span>
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
          {adminRole === "superadmin" && (
            <button id="bulk-delete-btn" onClick={() => setShowBulkDelConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}>
              <Trash2 size={12} /> Hapus {selected.size}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Limit toggle */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-wrap gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Menampilkan {Math.min(limit, filtered.length)} dari {filtered.length} transaksi
          </span>
          <div className="flex gap-1.5">
            {([10, 20, 50] as const).map(n => (
              <button key={n} onClick={() => setLimit(n)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={limit === n
                  ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#0f172a" }
                  : { background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
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
                  <th>Invoice</th><th>Game</th><th>Player ID</th><th>Nominal</th>
                  <th>Bank</th><th>No. Rekening</th><th>Nama Rekening</th>
                  <th>WhatsApp</th><th>Waktu</th><th>Pembayaran</th><th>Status</th><th>Ubah Status</th><th>Diproses Oleh</th><th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
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
                        <span className="text-xs font-semibold" style={{ color: r.game_name ? "#a78bfa" : "var(--text-muted)" }}>
                          {r.game_name || "—"}
                        </span>
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
                      {/* Kolom Pembayaran */}
                      <td>
                        {r.status === "selesai" ? (
                          r.nominal_pembayaran ? (
                            <span className="text-xs font-black" style={{ color: "#10b981" }}>
                              Rp {r.nominal_pembayaran.toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <button
                              onClick={() => setPayModal({ id: r.id, nominal: "" })}
                              className="text-xs px-2 py-1 rounded-lg font-semibold"
                              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                            >
                              + Isi Nominal
                            </button>
                          )
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit"
                          style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}>
                          <SI size={11} /> {s.label}
                        </span>
                      </td>
                      <td>
                        {(r.status === "selesai" || r.status === "batal") ? (
                          /* Already decided — locked */
                          <div className="flex items-center gap-1.5">
                            <span
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                              title={`Status sudah ${r.status} — tidak dapat diubah`}
                              style={{
                                background: r.status === "selesai" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                border: `1.5px solid ${r.status === "selesai" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                                color: r.status === "selesai" ? "#10b981" : "#ef4444",
                                cursor: "default",
                              }}
                            >
                              {r.status === "selesai" ? <CheckCircle size={11} /> : <XCircle size={11} />}
                              {r.status === "selesai" ? "Confirmed" : "Rejected"}
                            </span>
                            <span title="Status sudah final" style={{ fontSize: 14, lineHeight: 1 }}>🔒</span>
                          </div>
                        ) : (
                          /* Pending / Diproses — show Confirm + Reject */
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`confirm-bongkar-${r.id}`}
                              title="Konfirmasi Selesai"
                              disabled={updating === r.id}
                              onClick={() => updateStatus(r.id, "selesai")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                              style={{
                                background: "rgba(16,185,129,0.15)",
                                border: "1.5px solid rgba(16,185,129,0.5)",
                                color: "#10b981",
                                opacity: updating === r.id ? 0.5 : 1,
                                cursor: updating === r.id ? "not-allowed" : "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {updating === r.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <CheckCircle size={11} />}
                              Confirm
                            </button>
                            <button
                              id={`reject-bongkar-${r.id}`}
                              title="Tolak (Batal)"
                              disabled={updating === r.id}
                              onClick={() => updateStatus(r.id, "batal")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                              style={{
                                background: "rgba(239,68,68,0.12)",
                                border: "1.5px solid rgba(239,68,68,0.4)",
                                color: "#ef4444",
                                opacity: updating === r.id ? 0.5 : 1,
                                cursor: updating === r.id ? "not-allowed" : "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {updating === r.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <XCircle size={11} />}
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {r.processed_by ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
                            >
                              {r.processed_by.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{r.processed_by}</div>
                              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{r.processed_at ? new Date(r.processed_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : ""}</div>
                            </div>
                          </div>
                        ) : <span className="text-xs" style={{ color: "var(--border)" }}>—</span>}
                      </td>
                       <td className="text-right">
                        {adminRole === "superadmin" && (
                          <button id={`delete-bongkar-${r.id}`} onClick={() => setDeleteTarget(r)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary row */}
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  <td colSpan={4} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Total ({filtered.length} transaksi)
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="font-black text-sm" style={{ color: "#f87171" }}>{totalNominalBongkar}B</span>
                  </td>
                  <td colSpan={5} />
                  <td style={{ padding: "12px 16px" }}>
                    {totalNominalPembayaran > 0 ? (
                      <span className="font-black text-sm" style={{ color: "#10b981" }}>Rp {totalNominalPembayaran.toLocaleString("id-ID")}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
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

              {/* Game */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>🎮 Game *</label>
                <select id="form-bongkar-game" className="input-styled"
                  value={form.game_name} onChange={e => setForm(f => ({ ...f, game_name: e.target.value }))}>
                  <option value="" disabled>— Pilih Game —</option>
                  {activeGames.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
              </div>

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
                  value={form.whatsapp} onChange={e => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 0 && val[0] !== '0' && val[0] !== '6') val = "";
                    else if (val.length >= 2 && val.startsWith('6') && val[1] !== '2') val = "6";
                    setForm(f => ({ ...f, whatsapp: val }));
                  }} />
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

      {/* ── MODAL KONFIRMASI PEMBAYARAN ── */}
      {payModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card p-6" style={{ maxWidth: "400px", width: "100%" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                <CheckCircle size={20} style={{ color: "#10b981" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Konfirmasi Selesai</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Masukkan nominal yang telah dibayarkan</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>💰 Nominal Pembayaran (Rp)</label>
              <input
                id="pay-modal-nominal"
                type="number"
                placeholder="Contoh: 113000"
                value={payModal.nominal}
                onChange={e => setPayModal(prev => prev ? { ...prev, nominal: e.target.value } : null)}
                className="input-styled"
                autoFocus
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>Kosongkan jika tidak ingin mencatat nominal pembayaran</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPayModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                Batal
              </button>
              <button
                id="confirm-pay-btn"
                onClick={handleConfirmPayment}
                disabled={paySubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}
              >
                {paySubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {paySubmitting ? "Menyimpan..." : "Tandai Selesai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
