"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, X, User, Shield, Save, Key,
  Eye, EyeOff, RefreshCw, Loader2, Pencil,
  ToggleLeft, ToggleRight, AlertTriangle, Tag,
  ShieldCheck, Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ALL_PERMISSIONS, OP_CS_PERMISSIONS, type PermKey } from "@/app/admin/layout";

interface Admin {
  id: string;
  username: string;
  display_name?: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  permissions?: string[] | null;
}

type FormMode = "add" | "edit" | "password" | "permissions" | null;

const ROLE_PRESETS = [
  "Superadmin", "Admin", "OP", "CS", "Kapten", "Finance", "Teknisi",
];

const PERMISSION_META: Record<PermKey, { label: string; emoji: string; group: string }> = {
  dashboard:             { label: "Dashboard",          emoji: "📊", group: "Umum" },
  transactions:          { label: "Transaksi Masuk",    emoji: "🛒", group: "Transaksi" },
  transactions_history:  { label: "History Transaksi",  emoji: "📜", group: "Transaksi" },
  bongkar_chip:          { label: "Bongkar Chip Masuk", emoji: "⚡", group: "Bongkar Chip" },
  bongkar_chip_history:  { label: "History Bongkar",    emoji: "🗂️", group: "Bongkar Chip" },
  products:              { label: "Produk",              emoji: "📦", group: "Konten" },
  banners:               { label: "Banner",              emoji: "🖼️", group: "Konten" },
  gallery:               { label: "Gallery",             emoji: "🗃️", group: "Konten" },
  games:                 { label: "Kelola Game",         emoji: "🎮", group: "Konten" },
  settings:              { label: "Pengaturan Sistem",   emoji: "⚙️", group: "Admin" },
  admins:                { label: "Kelola Admin",        emoji: "👥", group: "Admin" },
};

const PERM_GROUPS = ["Umum", "Transaksi", "Bongkar Chip", "Konten", "Admin"];

const getRoleBadge = (role: string) => {
  const r = role.toLowerCase();
  if (r === "superadmin")                          return { bg: "#fbbf24", text: "#0f172a", icon: "👑" };
  if (r === "kapten")                              return { bg: "#ef4444", text: "#fff",    icon: "⚓" };
  if (r === "cs" || r.includes("customer"))        return { bg: "#06b6d4", text: "#fff",    icon: "💬" };
  if (r === "op" || r.includes("operator"))        return { bg: "#a78bfa", text: "#fff",    icon: "🔧" };
  if (r === "finance" || r.includes("keuangan"))   return { bg: "#10b981", text: "#fff",    icon: "💰" };
  if (r === "teknisi")                             return { bg: "#f59e0b", text: "#0f172a", icon: "🛠️" };
  if (r === "admin")                               return { bg: "#6366f1", text: "#fff",    icon: "🛡️" };
  return { bg: "#64748b", text: "#fff", icon: "👤" };
};

const EMPTY_FORM = { username: "", display_name: "", email: "", password: "", role: "Admin" };
const DEFAULT_PERMS: PermKey[] = ["transactions", "transactions_history", "bongkar_chip", "bongkar_chip_history"];

// Cek apakah user yang login adalah superadmin (untuk gating UI)
function getMyRole(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_role") ?? "";
}

export default function AdminAdminsPage() {
  const [admins,      setAdmins]      = useState<Admin[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [mode,        setMode]        = useState<FormMode>(null);
  const [target,      setTarget]      = useState<Admin | null>(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [showPass,    setShowPass]    = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [error,       setError]       = useState("");
  const [editPerms,   setEditPerms]   = useState<PermKey[]>(DEFAULT_PERMS);

  const myRole = typeof window !== "undefined" ? getMyRole() : "";
  const isMeSuperadmin = myRole.toLowerCase() === "superadmin";

  /* ── Fetch ── */
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/admins");
      const data = await res.json();
      if (data.admins) setAdmins(data.admins);
      else if (data.error) setError(data.error);
    } catch {
      setError("Gagal mengambil data admin");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  /* ── Open modals ── */
  const openAdd = () => {
    setTarget(null);
    setForm(EMPTY_FORM);
    setEditPerms(DEFAULT_PERMS);
    setError("");
    setMode("add");
  };

  const openEdit = (a: Admin) => {
    setTarget(a);
    setForm({ username: a.username, display_name: a.display_name ?? "", email: a.email, password: "", role: a.role });
    setError("");
    setMode("edit");
  };

  const openPermissions = (a: Admin) => {
    setTarget(a);
    setEditPerms((a.permissions as PermKey[]) ?? DEFAULT_PERMS);
    setError("");
    setMode("permissions");
  };

  const openPassword = (a: Admin) => {
    setTarget(a);
    setNewPassword("");
    setError("");
    setMode("password");
  };

  const closeModal = () => { setMode(null); setTarget(null); setError(""); };

  /* ── Add Admin ── */
  const handleAdd = async () => {
    if (!form.username || !form.email || !form.password) { setError("Lengkapi semua field wajib"); return; }
    if (!form.role.trim()) { setError("Role wajib diisi"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:     form.username.trim(),
          display_name: form.display_name.trim() || null,
          email:        form.email.trim(),
          password:     form.password,
          role:         form.role.trim(),
          permissions:  form.role.toLowerCase() === "superadmin" ? null : editPerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal menambah admin"); return; }
      setAdmins((prev) => [...prev, data.admin]);
      closeModal();
    } catch { setError("Terjadi kesalahan jaringan"); }
    finally { setSaving(false); }
  };

  /* ── Edit Admin ── */
  const handleEdit = async () => {
    if (!target) return;
    if (!form.role.trim()) { setError("Role wajib diisi"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/admins/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role:         form.role.trim(),
          email:        form.email.trim(),
          display_name: form.display_name.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal mengubah admin"); return; }
      setAdmins((prev) => prev.map((a) => a.id === target.id ? { ...a, ...data.admin } : a));
      closeModal();
    } catch { setError("Terjadi kesalahan jaringan"); }
    finally { setSaving(false); }
  };

  /* ── Save Permissions ── */
  const handleSavePermissions = async () => {
    if (!target) return;
    setSaving(true); setError("");
    const isSA = target.role.toLowerCase() === "superadmin";
    const payload = { permissions: isSA ? null : editPerms };
    try {
      const res = await fetch(`/api/admin/admins/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal menyimpan akses"); return; }
      setAdmins((prev) => prev.map((a) => a.id === target.id ? { ...a, ...data.admin } : a));
      closeModal();
    } catch { setError("Terjadi kesalahan jaringan"); }
    finally { setSaving(false); }
  };

  /* ── Change Password ── */
  const handleChangePassword = async () => {
    if (!target || !newPassword) { setError("Masukkan password baru"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/admins/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal mengubah password"); return; }
      closeModal();
      alert(`✅ Password ${target.username} berhasil diubah!`);
    } catch { setError("Terjadi kesalahan jaringan"); }
    finally { setSaving(false); }
  };

  /* ── Toggle Active ── */
  const toggleActive = async (a: Admin) => {
    setAdmins((prev) => prev.map((x) => x.id === a.id ? { ...x, is_active: !x.is_active } : x));
    try {
      await fetch(`/api/admin/admins/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !a.is_active }),
      });
    } catch {
      setAdmins((prev) => prev.map((x) => x.id === a.id ? { ...x, is_active: a.is_active } : x));
    }
  };

  /* ── Delete ── */
  const handleDelete = async (a: Admin) => {
    if (!confirm(`Hapus admin "${a.username}"? Aksi ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/admin/admins/${a.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Gagal menghapus"); return; }
      setAdmins((prev) => prev.filter((x) => x.id !== a.id));
    } catch { alert("Gagal menghapus admin"); }
  };

  /* ── Permission toggle helper ── */
  const togglePerm = (key: PermKey) => {
    if (key === "dashboard") return; // dashboard selalu aktif
    setEditPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  /* ── Role Input ── */
  const RoleInput = ({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
        Role <span style={{ color: "#ef4444" }}>*</span>
        <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>(pilih atau ketik custom)</span>
      </label>
      <div className="relative">
        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          id={id} type="text" list={`${id}-list`} className="input-styled pl-9"
          placeholder="Contoh: OP, CS, Kapten..."
          value={value} onChange={(e) => onChange(e.target.value)}
        />
        <datalist id={`${id}-list`}>
          {ROLE_PRESETS.map((p) => <option key={p} value={p} />)}
        </datalist>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {ROLE_PRESETS.map((p) => {
          const rb = getRoleBadge(p);
          return (
            <button key={p} type="button" onClick={() => onChange(p)}
              className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all hover:scale-105"
              style={{
                background: value.toLowerCase() === p.toLowerCase() ? rb.bg : `${rb.bg}22`,
                color:      value.toLowerCase() === p.toLowerCase() ? rb.text : rb.bg,
                border:     `1px solid ${rb.bg}55`,
              }}>
              {rb.icon} {p}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── Permission Picker UI ── */
  const PermissionPicker = ({
    perms,
    isSuperadminRole,
    onToggle,
    onPreset,
  }: {
    perms: PermKey[];
    isSuperadminRole: boolean;
    onToggle: (k: PermKey) => void;
    onPreset: (p: PermKey[]) => void;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          🔐 Hak Akses Menu
        </label>
        {isSuperadminRole && (
          <span className="text-xs px-2 py-1 rounded-lg font-semibold"
            style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
            👑 Superadmin — akses penuh
          </span>
        )}
      </div>

      {isSuperadminRole ? (
        <div className="p-4 rounded-xl text-sm text-center"
          style={{ background: "rgba(251,191,36,0.06)", border: "1px dashed rgba(251,191,36,0.3)", color: "#fbbf24" }}>
          Superadmin secara otomatis mendapatkan akses ke semua menu. Pengaturan hak akses tidak diperlukan.
        </div>
      ) : (
        <>
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" onClick={() => onPreset([...OP_CS_PERMISSIONS])}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
              🔧 Preset OP/CS
            </button>
            <button type="button"
              onClick={() => onPreset(ALL_PERMISSIONS.filter(p => p !== "settings" && p !== "admins") as PermKey[])}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
              🛡️ Preset Admin Umum
            </button>
            <button type="button" onClick={() => onPreset([...ALL_PERMISSIONS])}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
              ✅ Semua Akses
            </button>
            <button type="button" onClick={() => onPreset(["dashboard"])}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              🚫 Hapus Semua
            </button>
          </div>

          {/* Permission grid by group */}
          <div className="space-y-3">
            {PERM_GROUPS.map((group) => {
              const groupKeys = ALL_PERMISSIONS.filter(
                (k) => PERMISSION_META[k]?.group === group
              ) as PermKey[];
              if (!groupKeys.length) return null;
              return (
                <div key={group}>
                  <div className="text-xs font-bold mb-2 opacity-60 uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}>
                    {group}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {groupKeys.map((key) => {
                      const meta = PERMISSION_META[key];
                      const active = perms.includes(key);
                      const isDashboard = key === "dashboard";
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onToggle(key)}
                          disabled={isDashboard}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                          style={{
                            background: active
                              ? "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(99,102,241,0.1))"
                              : "var(--bg-secondary)",
                            border: active
                              ? "1.5px solid rgba(99,102,241,0.5)"
                              : "1.5px solid var(--border)",
                            color: active ? "#818cf8" : "var(--text-muted)",
                            opacity: isDashboard ? 0.7 : 1,
                            cursor: isDashboard ? "not-allowed" : "pointer",
                          }}
                        >
                          <span style={{ fontSize: "16px", flexShrink: 0 }}>{meta.emoji}</span>
                          <span className="truncate">{meta.label}</span>
                          {active && (
                            <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: "#6366f1", fontSize: "9px", color: "#fff", fontWeight: 900 }}>
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <ShieldCheck size={12} />
            <span>{perms.length} dari {ALL_PERMISSIONS.length} menu diaktifkan</span>
          </div>
        </>
      )}
    </div>
  );

  /* ── Render permission chips (tabel) ── */
  const PermChips = ({ admin }: { admin: Admin }) => {
    const isSA = admin.role.toLowerCase() === "superadmin";
    if (isSA) return (
      <span className="text-xs font-bold px-2 py-1 rounded-full"
        style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
        👑 Semua Akses
      </span>
    );
    const count = admin.permissions?.length ?? DEFAULT_PERMS.length;
    const total = ALL_PERMISSIONS.length;
    return (
      <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 w-fit"
        style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}>
        <Lock size={10} />
        {count}/{total} menu
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            👥 Kelola Admin
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {admins.length} akun admin · Atur role dan hak akses menu per admin
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAdmins}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button id="btn-add-admin" onClick={openAdd}
            className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Plus size={16} /> Tambah Admin
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="card p-4 mb-4 flex items-start gap-3">
        <ShieldCheck size={20} className="flex-shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Sistem Hak Akses Menu</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Superadmin dapat mengklik tombol <strong>🔐 Akses</strong> pada setiap admin untuk mengatur menu mana saja yang bisa mereka akses.
            OP/CS secara default hanya mendapat akses Transaksi &amp; Bongkar Chip.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-48" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-6 w-14 rounded-full" />
                <div className="skeleton h-8 w-24 rounded-lg ml-auto" />
              </div>
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: "#fbbf24" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Belum ada admin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Nama Tampilan</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Hak Akses</th>
                  <th>Status</th>
                  <th>Login Terakhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => {
                  const rb = getRoleBadge(a.role);
                  const isSA = a.role.toLowerCase() === "superadmin";
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: `${rb.bg}22`, color: rb.bg }}>
                            {(a.display_name ?? a.username)[0]?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm">{a.username}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: a.display_name ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {a.display_name || <span className="italic text-xs">—</span>}
                        </span>
                      </td>
                      <td><span className="text-sm" style={{ color: "var(--text-muted)" }}>{a.email}</span></td>
                      <td>
                        <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit"
                          style={{ background: `${rb.bg}22`, color: rb.bg, border: `1px solid ${rb.bg}44` }}>
                          {rb.icon} {a.role}
                        </span>
                      </td>
                      <td><PermChips admin={a} /></td>
                      <td>
                        <button onClick={() => toggleActive(a)}
                          className={`badge cursor-pointer transition-all hover:opacity-80 ${a.is_active ? "badge-green" : "badge-red"}`}>
                          {a.is_active
                            ? <><ToggleRight size={14} /> Aktif</>
                            : <><ToggleLeft size={14} /> Nonaktif</>}
                        </button>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {a.last_login ? formatDate(a.last_login) : "—"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          {/* Edit */}
                          <button id={`edit-admin-${a.id}`} onClick={() => openEdit(a)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }} title="Edit">
                            <Pencil size={14} />
                          </button>
                          {/* Akses — hanya tampil untuk superadmin */}
                          {isMeSuperadmin && !isSA && (
                            <button id={`perm-admin-${a.id}`} onClick={() => openPermissions(a)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                              style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }} title="Atur Hak Akses">
                              <ShieldCheck size={14} />
                            </button>
                          )}
                          {/* Password */}
                          <button id={`change-pw-${a.id}`} onClick={() => openPassword(a)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }} title="Ganti Password">
                            <Key size={14} />
                          </button>
                          {/* Delete */}
                          <button id={`delete-admin-${a.id}`} onClick={() => handleDelete(a)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Tambah Admin ── */}
      {mode === "add" && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Tambah Admin Baru</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Isi data, role, dan hak akses menu</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Username <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input id="new-admin-username" type="text" className="input-styled pl-9" placeholder="Contoh: operator2"
                    value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Nama Tampilan <span className="font-normal text-xs ml-1" style={{ color: "var(--text-muted)" }}>(opsional)</span>
                </label>
                <input id="new-admin-display-name" type="text" className="input-styled" placeholder="Contoh: Budi Operator"
                  value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Email <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input id="new-admin-email" type="email" className="input-styled" placeholder="op2@rajadigital.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Password <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="relative">
                  <input id="new-admin-password" type={showPass ? "text" : "password"} className="input-styled pr-10"
                    placeholder="Min. 6 karakter" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <RoleInput id="new-admin-role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />

              {/* Divider */}
              <div style={{ height: "1px", background: "var(--border)" }} />

              {/* Permission picker */}
              <PermissionPicker
                perms={editPerms}
                isSuperadminRole={form.role.toLowerCase() === "superadmin"}
                onToggle={togglePerm}
                onPreset={(p) => setEditPerms(p)}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-outline flex-1">Batal</button>
              <button id="save-admin-btn" onClick={handleAdd} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Menyimpan..." : "Tambah Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Admin ── */}
      {mode === "edit" && target && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  Edit: <span style={{ color: "#fbbf24" }}>{target.username}</span>
                </h2>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Nama Tampilan</label>
                <input id="edit-admin-display-name" type="text" className="input-styled"
                  placeholder={`Contoh: ${target.username}`}
                  value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input id="edit-admin-email" className="input-styled" type="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <RoleInput id="edit-admin-role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-outline flex-1">Batal</button>
              <button id="save-edit-admin-btn" onClick={handleEdit} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Hak Akses ── */}
      {mode === "permissions" && target && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  🔐 Hak Akses — <span style={{ color: "#818cf8" }}>{target.username}</span>
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Centang menu yang boleh diakses admin ini
                </p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <PermissionPicker
              perms={editPerms}
              isSuperadminRole={target.role.toLowerCase() === "superadmin"}
              onToggle={togglePerm}
              onPreset={(p) => setEditPerms(p)}
            />

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-outline flex-1">Batal</button>
              <button id="save-perms-btn" onClick={handleSavePermissions} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                {saving ? "Menyimpan..." : "Simpan Hak Akses"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Ganti Password ── */}
      {mode === "password" && target && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>🔑 Ganti Password</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Ganti password untuk akun <strong style={{ color: "var(--text-primary)" }}>{target.username}</strong>
            </p>
            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            <div className="relative mb-6">
              <input id="new-password-input" type={showNewPass ? "text" : "password"}
                className="input-styled pr-10" placeholder="Password baru (min. 6 karakter)"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="btn-outline flex-1">Batal</button>
              <button id="confirm-change-pw" onClick={handleChangePassword} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                {saving ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
