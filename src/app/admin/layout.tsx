"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, ShoppingCart, Package, Settings, Users,
  LogOut, Menu, ChevronRight, Gamepad2, ImageIcon, Images, Zap,
} from "lucide-react";

// ── Permission key untuk setiap menu ──────────────────────────────────────────
export type PermKey =
  | "dashboard"
  | "transactions"
  | "transactions_history"
  | "bongkar_chip"
  | "bongkar_chip_history"
  | "products"
  | "banners"
  | "gallery"
  | "games"
  | "settings"
  | "admins";

export const ALL_PERMISSIONS: PermKey[] = [
  "dashboard",
  "transactions",
  "transactions_history",
  "bongkar_chip",
  "bongkar_chip_history",
  "products",
  "banners",
  "gallery",
  "games",
  "settings",
  "admins",
];

export const OP_CS_PERMISSIONS: PermKey[] = [
  "transactions",
  "transactions_history",
  "bongkar_chip",
  "bongkar_chip_history",
];

// Definisi nav + permission key tiap item ─────────────────────────────────────
const navItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permKey: "dashboard" as PermKey,
  },
  {
    label: "Transaksi",
    icon: ShoppingCart,
    subItems: [
      { href: "/admin/transactions",         label: "Transaksi Masuk",   permKey: "transactions" as PermKey },
      { href: "/admin/transactions/history", label: "History Transaksi", permKey: "transactions_history" as PermKey },
    ],
  },
  {
    label: "Bongkar Chip",
    icon: Zap,
    subItems: [
      { href: "/admin/bongkar",         label: "Bongkar Chip Masuk",   permKey: "bongkar_chip" as PermKey },
      { href: "/admin/bongkar/history", label: "History Bongkar Chip", permKey: "bongkar_chip_history" as PermKey },
    ],
  },
  { href: "/admin/products", label: "Produk",       icon: Package,   permKey: "products" as PermKey },
  { href: "/admin/banners",  label: "Banner",        icon: ImageIcon, permKey: "banners" as PermKey },
  { href: "/admin/gallery",  label: "Gallery",       icon: Images,    permKey: "gallery" as PermKey },
  { href: "/admin/games",    label: "Kelola Game",   icon: Gamepad2,  permKey: "games" as PermKey },
  { href: "/admin/settings", label: "Pengaturan",   icon: Settings,  permKey: "settings" as PermKey },
  { href: "/admin/admins",   label: "Kelola Admin",  icon: Users,     permKey: "admins" as PermKey },
];

// Cek apakah user punya akses ke permKey tertentu ─────────────────────────────
function hasAccess(
  permKey: PermKey,
  isSuperadmin: boolean,
  permissions: string[] | null
): boolean {
  if (permKey === "dashboard") return true; // dashboard selalu tampil
  if (isSuperadmin) return true;            // superadmin selalu punya semua akses
  if (!permissions) return OP_CS_PERMISSIONS.includes(permKey); // null = preset OP/CS
  return permissions.includes(permKey);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName,   setAdminName]   = useState("Admin");
  const [adminRole,   setAdminRole]   = useState("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions,  setPermissions]  = useState<string[] | null>(null);
  const [permReady,    setPermReady]    = useState(false); // guard: jangan render sampai perm loaded

  useEffect(() => {
    if (pathname === "/admin" || pathname === "/admin/login") return;

    const token = localStorage.getItem("admin_token");
    if (!token) { router.push("/admin/login"); return; }

    // Baca dari localStorage
    const storedDisplayName = localStorage.getItem("admin_display_name");
    const storedUsername    = localStorage.getItem("admin_username");
    const storedRole        = localStorage.getItem("admin_role") ?? "";
    const storedPermsRaw    = localStorage.getItem("admin_permissions");

    setAdminRole(storedRole);
    const isSA = storedRole.toLowerCase() === "superadmin";
    setIsSuperadmin(isSA);

    let perms: string[] | null = null;
    if (!isSA && storedPermsRaw) {
      try { perms = JSON.parse(storedPermsRaw); } catch { /* ignore */ }
    }
    setPermissions(perms);

    if (storedDisplayName) setAdminName(storedDisplayName);
    else if (storedUsername) setAdminName(storedUsername);

    // Jika belum ada info di localStorage, decode JWT
    if (!storedRole && token !== "dev-token") {
      try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            window.atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const decoded = JSON.parse(jsonPayload);
          if (decoded) {
            if (decoded.display_name) {
              setAdminName(decoded.display_name);
              localStorage.setItem("admin_display_name", decoded.display_name);
            } else if (decoded.username) {
              setAdminName(decoded.username);
              localStorage.setItem("admin_username", decoded.username);
            }
            if (decoded.role) {
              setAdminRole(decoded.role);
              localStorage.setItem("admin_role", decoded.role);
              const sa = decoded.role.toLowerCase() === "superadmin";
              setIsSuperadmin(sa);
              if (!sa && decoded.permissions) {
                setPermissions(decoded.permissions);
                localStorage.setItem("admin_permissions", JSON.stringify(decoded.permissions));
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to decode admin token:", e);
      }
    }

    setPermReady(true);
  }, [pathname, router]);

  // ── Route Guard: redirect ke dashboard jika tidak punya akses ──────────────
  useEffect(() => {
    if (!permReady) return;
    if (pathname === "/admin" || pathname === "/admin/login" || pathname === "/admin/dashboard") return;

    // Temukan permKey dari pathname saat ini
    const allNavFlat = navItems.flatMap((n) =>
      n.subItems
        ? n.subItems.map((s) => ({ href: s.href, permKey: s.permKey }))
        : [{ href: n.href!, permKey: n.permKey! }]
    );

    const matched = allNavFlat.find(
      (n) => pathname === n.href || pathname.startsWith(n.href + "/")
    );

    if (matched && !hasAccess(matched.permKey, isSuperadmin, permissions)) {
      router.replace("/admin/dashboard");
    }
  }, [permReady, pathname, isSuperadmin, permissions, router]);

  if (pathname === "/admin" || pathname === "/admin/login") return <>{children}</>;

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    localStorage.removeItem("admin_display_name");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_permissions");
    router.push("/admin/login");
  };

  // ── Filter nav berdasarkan permissions ────────────────────────────────────
  const visibleNav = navItems
    .map((item) => {
      if (item.subItems) {
        const visibleSubs = item.subItems.filter((s) =>
          hasAccess(s.permKey, isSuperadmin, permissions)
        );
        if (!visibleSubs.length) return null;
        return { ...item, subItems: visibleSubs };
      }
      if (!hasAccess(item.permKey!, isSuperadmin, permissions)) return null;
      return item;
    })
    .filter(Boolean) as typeof navItems;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="https://res.cloudinary.com/dzojrrwtr/image/upload/v1778049885/logo-raja-digital-webp_hwu82q.webp"
              alt="RAJA DIGITAL"
              width={130}
              height={44}
              className="object-contain"
              style={{ height: "36px", width: "auto" }}
              priority
            />
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Admin Panel</div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 flex-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;

            if (item.subItems) {
              const isActiveGroup = item.subItems.some((sub) => pathname.startsWith(sub.href));
              return (
                <div key={item.label} className="mb-2">
                  <div
                    className={`admin-nav-item ${isActiveGroup ? "active" : ""}`}
                    style={{ pointerEvents: "none", opacity: 0.8 }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </div>
                  <div className="ml-7 mt-1 flex flex-col gap-1">
                    {item.subItems.map((sub) => {
                      const isSubActive =
                        pathname === sub.href || pathname.startsWith(sub.href + "/");
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all hover:bg-[var(--bg-secondary)]"
                          style={{
                            color: isSubActive ? "var(--text-primary)" : "var(--text-secondary)",
                            background: isSubActive ? "var(--bg-secondary)" : "transparent",
                            border: isSubActive ? "1px solid var(--border)" : "1px solid transparent",
                          }}
                        >
                          {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const active = item.href && pathname.startsWith(item.href);
            return (
              <Link
                key={item.href || item.label}
                href={item.href || "#"}
                onClick={() => setSidebarOpen(false)}
                className={`admin-nav-item mb-1 ${active ? "active" : ""}`}
                id={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Role badge + Logout */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
          {/* Mini role badge */}
          {adminRole && (
            <div
              className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl text-xs font-semibold"
              style={{
                background: isSuperadmin ? "rgba(251,191,36,0.1)" : "rgba(99,102,241,0.1)",
                color: isSuperadmin ? "#fbbf24" : "#a78bfa",
                border: `1px solid ${isSuperadmin ? "rgba(251,191,36,0.25)" : "rgba(99,102,241,0.25)"}`,
              }}
            >
              <span>{isSuperadmin ? "👑" : "🔐"}</span>
              <span>{adminRole}</span>
              {!isSuperadmin && permissions && (
                <span
                  className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#a78bfa" }}
                >
                  {permissions.length} akses
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            id="admin-logout-btn"
            className="admin-nav-item w-full text-left"
            style={{ color: "#ef4444" }}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 md:ml-[260px] flex flex-col">
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 px-4 md:px-6 h-14 flex items-center justify-between"
          style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
          >
            <Menu size={16} />
          </button>
          <div className="hidden md:block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {navItems.find((n) => n.href && pathname.startsWith(n.href))?.label ??
              navItems.flatMap((n) => n.subItems || []).find((sub) => pathname.startsWith(sub.href))?.label ??
              "Admin Panel"}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="text-right">
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {adminName}
              </div>
              {adminRole && (
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {adminRole}
                </div>
              )}
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white" }}
            >
              {adminName[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
