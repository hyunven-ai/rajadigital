"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, ShoppingCart, Package, Settings, Users,
  LogOut, Menu, X, Bell, ChevronRight, Gamepad2, ImageIcon, Images, Zap,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { href: "/admin/transactions", label: "Transaksi",          icon: ShoppingCart },
  { href: "/admin/bongkar-chip", label: "Bongkar Chip",       icon: Zap },
  { href: "/admin/products",     label: "Produk",             icon: Package },
  { href: "/admin/banners",      label: "Banner",             icon: ImageIcon },
  { href: "/admin/gallery",      label: "Gallery",            icon: Images },
  { href: "/admin/games",        label: "Kelola Game",        icon: Gamepad2 },
  { href: "/admin/settings",     label: "Pengaturan",         icon: Settings },
  { href: "/admin/admins",       label: "Kelola Admin",       icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  if (pathname === "/admin" || pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

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
        <nav className="px-3 py-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`admin-nav-item mb-1 ${active ? "active" : ""}`}
                id={`admin-nav-${item.label.toLowerCase()}`}
              >
                <Icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
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
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 md:ml-[260px] flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 px-4 md:px-6 h-14 flex items-center justify-between"
          style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
          >
            <Menu size={16} />
          </button>
          <div className="hidden md:block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {navItems.find((n) => pathname.startsWith(n.href))?.label ?? "Admin Panel"}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {adminName}
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white" }}>
              {adminName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
