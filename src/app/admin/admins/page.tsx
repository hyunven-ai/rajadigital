"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, X, User, Shield, Save, Key,
  Eye, EyeOff, RefreshCw, Loader2, Pencil,
  ToggleLeft, ToggleRight, AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

type FormMode = "add" | "edit" | "password" | null;

const EMPTY_FORM = { username: "", email: "", password: "", role: "admin" };

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
    setError("");
    setMode("add");
  };

  const openEdit = (a: Admin) => {
    setTarget(a);
    setForm({ username: a.username, email: a.email, password: "", role: a.role });
    setError("");
    setMode("edit");
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
    if (!form.username || !form.email || !form.password) { setError("Lengkapi semua field"); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    setSaving(true); setError("");
    try {
      const payload: Record<string, string> = { role: form.role, email: form.email };
      const res = await fetch(`/api/admin/admins/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal mengubah admin"); return; }
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
    // Jangan nonaktifkan diri sendiri
    setAdmins((prev) => prev.map((x) => x.id === a.id ? { ...x, is_active: !x.is_active } : x));
    try {
      await fetch(`/api/admin/admins/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !a.is_active }),
      });
    } catch {
      // Revert on failure
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

  /* ── Role badge ── */
  const roleBadge = (role: string) => {
    if (role === "superadmin") return { bg: "badge-gold", icon: <Shield size={10} /> };
    return { bg: "badge-purple", icon: <User size={10} /> };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
            Kelola Admin
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {admins.length} akun admin terdaftar
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAdmins}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button id="btn-add-admin" onClick={openAdd} className="btn-gold flex items-center gap-2" style={{ padding: "10px 18px" }}>
            <Plus size={16} /> Tambah Admin
          </button>
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
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-8 w-24 rounded-lg ml-auto" />
              </div>
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: "#fbbf24" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Belum ada admin</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Pastikan tabel <code>admins</code> sudah ada di Supabase
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Login Terakhir</th>
                  <th>Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => {
                  const rb = roleBadge(a.role);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              background: a.role === "superadmin" ? "rgba(251,191,36,0.15)" : "rgba(124,58,237,0.15)",
                              color:      a.role === "superadmin" ? "#fbbf24" : "#a78bfa",
                            }}>
                            {a.username[0]?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm">{a.username}</span>
                        </div>
                      </td>
                      <td><span className="text-sm" style={{ color: "var(--text-muted)" }}>{a.email}</span></td>
                      <td>
                        <span className={`badge ${rb.bg}`}>
                          {rb.icon} {a.role}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => toggleActive(a)}
                          className={`badge cursor-pointer transition-all hover:opacity-80 ${a.is_active ? "badge-green" : "badge-red"}`}
                          title="Klik untuk toggle status">
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
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatDate(a.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button id={`edit-admin-${a.id}`}
                            onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
                            title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button id={`change-pw-${a.id}`}
                            onClick={(e) => { e.stopPropagation(); openPassword(a); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                            title="Ganti Password">
                            <Key size={14} />
                          </button>
                          <button id={`delete-admin-${a.id}`}
                            onClick={(e) => { e.stopPropagation(); handleDelete(a); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                            title="Hapus">
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
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Tambah Admin Baru</h2>
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
              {[
                { key: "username", label: "Username", placeholder: "operator2", type: "text" },
                { key: "email",    label: "Email",    placeholder: "op2@rajadigital.com", type: "email" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{f.label}</label>
                  <input id={`new-admin-${f.key}`} type={f.type} className="input-styled" placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
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

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Role</label>
                <select id="new-admin-role" className="input-styled"
                  value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
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
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Edit: <span style={{ color: "#fbbf24" }}>{target.username}</span>
              </h2>
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input className="input-styled" type="email" placeholder="email@domain.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Role</label>
                <select className="input-styled" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn-outline flex-1">Batal</button>
              <button onClick={handleEdit} disabled={saving}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
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
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                🔑 Ganti Password
              </h2>
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
