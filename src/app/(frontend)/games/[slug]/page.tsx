"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Gem, Coins, User,
  Phone, Loader2, RefreshCw, Star, Zap, Shield,
  LayoutGrid, List,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import TransactionStepper from "@/components/TransactionStepper";
import { formatCurrency, generateInvoiceId, formatWhatsApp, buildWhatsAppMessage } from "@/lib/utils";
import { useGame } from "@/hooks/useGames";
import type { Product } from "@/types";

export default function GamePage() {
  const params = useParams();
  const slug   = params?.slug as string;
  const { game, loading: gameLoading } = useGame(slug);

  // Redirect jika game tidak ditemukan (setelah loading selesai)
  useEffect(() => {
    if (!gameLoading && !game) notFound();
  }, [game, gameLoading]);

  const [products,        setProducts]        = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCategory,  setActiveCategory]  = useState<string>(""); // dinamis — set setelah produk dimuat
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [specialValues,   setSpecialValues]   = useState<Record<string, number>>({});
  const [gameId,          setGameId]          = useState("");
  const [username,        setUsername]        = useState("");
  const [whatsapp,        setWhatsapp]        = useState("");
  const [modalOpen,       setModalOpen]       = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [showOrder,       setShowOrder]       = useState(false);
  const [successInvoiceId, setSuccessInvoiceId] = useState<string | null>(null);
  const [viewMode,         setViewMode]         = useState<"grid" | "list">("grid");
  // pageStep: 2 = Pilih Paket, 3 = Isi Formulir



  /* ── Fetch produk berdasarkan game ── */
  const fetchProducts = useCallback(async () => {
    if (!game) return;
    setLoadingProducts(true);
    try {
      const res  = await fetch(`/api/products?game=${encodeURIComponent(game.name)}`, { cache: "no-store" });
      const data = await res.json();
      // Sort by price ascending (cheapest first)
      const list: Product[] = (data.products ?? []).sort((a: Product, b: Product) => (a.price ?? 0) - (b.price ?? 0));
      setProducts(list);
      // Auto-set kategori aktif ke kategori PERTAMA dari konfigurasi game (bukan dari produk)
      if (list.length > 0) {
        // Urutan kategori mengikuti konfigurasi game dari admin panel
        const gameCats = [
          game.currency?.toLowerCase(),
          ...(game.extraCurrencies ?? []).map((c: any) => c.key),
        ].filter(Boolean);
        const activeCats = new Set(list.filter(p => p.is_active).map(p => p.category?.toLowerCase()));
        const firstCat = gameCats.find(k => activeCats.has(k))
          ?? list.find(p => p.is_active)?.category
          ?? list[0].category;
        setActiveCategory(prev => prev || firstCat);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [game]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  if (gameLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={32} className="animate-spin mx-auto mb-3" />
        <p>Memuat game...</p>
      </div>
    );
  }
  if (!game) return null;

  const ALL_CATEGORIES = "__all__";

  const filteredProducts = activeCategory === ALL_CATEGORIES
    ? products.filter((p) => p.is_active)
    : products.filter(
        (p) => p.category?.toLowerCase() === activeCategory?.toLowerCase() && p.is_active
      );

  /* ── Kategori tabs — urutan mengikuti konfigurasi game dari admin panel ── */
  const availableCategories = (() => {
    // Urutan dari admin: currency utama + extraCurrencies
    const gameCatOrder: string[] = [
      game.currency?.toLowerCase(),
      ...(game.extraCurrencies ?? []).map((c: any) => c.key),
    ].filter(Boolean) as string[];

    // Set kategori yang benar-benar ada di produk aktif
    const activeCatSet = new Set(
      products.filter((p) => p.is_active).map((p) => p.category?.toLowerCase()).filter(Boolean)
    );

    // Tampilkan kategori sesuai urutan game, hanya yang ada produknya
    const ordered = gameCatOrder.filter((k) => activeCatSet.has(k));

    // Tambahkan kategori dari produk yang tidak terdaftar di game config (fallback)
    activeCatSet.forEach((cat) => {
      if (cat && !ordered.includes(cat)) ordered.push(cat);
    });

    // Kembalikan dengan original casing dari produk (bukan lowercase)
    return ordered.map((k) => {
      const prod = products.find((p) => p.is_active && p.category?.toLowerCase() === k);
      return prod?.category ?? k;
    });
  })();

  /* ── Resolve icon per-product: returns emoji string (fallback) ── */
  const getProductIconEmoji = (product: Product): string => {
    const catLower = product.category?.toLowerCase() ?? "";
    if (catLower === game.currency?.toLowerCase()) return game.currencyIcon || "💎";
    const extra = game.extraCurrencies?.find(
      (c: any) => c.key === catLower || c.label?.toLowerCase() === catLower
    );
    if (extra) return extra.icon;
    const CAT_MAP: Record<string, string> = {
      diamond: "💎", uc: "🪙", koin: "🪙", coin: "🪙",
      chip: "🎰", gold: "🥇", voucher: "🎫",
      spesial: "⭐", b: "🎰", m: "🎰", "100m": "💰",
    };
    return CAT_MAP[catLower] ?? game.currencyIcon ?? "📦";
  };

  /* ── Resolve icon per-product: returns PNG URL if configured, else null ── */
  const getProductIconImage = (product: Product): string | null => {
    const catLower = product.category?.toLowerCase() ?? "";
    if (catLower === game.currency?.toLowerCase()) return (game as any).currencyImage || null;
    const extra = game.extraCurrencies?.find(
      (c: any) => c.key === catLower || c.label?.toLowerCase() === catLower
    );
    return extra?.currencyImage || null;
  };

  /* ── Render icon: PNG jika ada, fallback emoji ── */
  const ProductIcon = ({ product, size = 22 }: { product: Product; size?: number }) => {
    const imgUrl = getProductIconImage(product);
    if (imgUrl) {
      return (
        <img
          src={`${imgUrl}?v=1`}
          alt={product.category ?? "icon"}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: "contain", display: "block" }}
        />
      );
    }
    return <span style={{ fontSize: size, lineHeight: 1 }}>{getProductIconEmoji(product)}</span>;
  };


  /* ── Order handlers ── */
  const handleOrder = () => {
    if (!gameId.trim())    { alert("Masukkan Game ID terlebih dahulu!"); return; }
    if (!username.trim())  { alert("Masukkan Nama Pengguna/Game terlebih dahulu!"); return; }
    if (!whatsapp.trim())  { alert("Masukkan nomor WhatsApp!"); return; }
    if (!selectedProduct)  { alert("Pilih paket terlebih dahulu!"); return; }
    setModalOpen(true);
  };

  const handleConfirm = async (paidViaQris: boolean = false, paymentProof?: File | null) => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const invoiceId = generateInvoiceId();

      // Upload bukti transfer jika ada
      let paymentProofUrl: string | null = null;
      if (paymentProof) {
        const fd = new FormData();
        fd.append("file", paymentProof);
        fd.append("invoice_id", invoiceId);
        try {
          const uploadRes = await fetch("/api/upload-proof", { method: "POST", body: fd });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            paymentProofUrl = uploadData.url ?? null;
          }
        } catch {
          // Upload gagal tidak menghentikan proses transaksi
        }
      }

      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id:    invoiceId,
          game_id:       gameId,
          username:      username,
          game_name:     game.name,
          whatsapp:      formatWhatsApp(whatsapp),
          product_id:    selectedProduct.id,
          product_name:  selectedProduct.name,
          product_price: selectedProduct.price,
          payment_proof: paymentProofUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice");

      // Tampilkan SuccessStep (tidak redirect WA otomatis)
      setSuccessInvoiceId(invoiceId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan. Pastikan Anda sudah menjalankan SQL migration untuk kolom username di Supabase (lihat instruksi AI).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* ── Game Hero ─────────────────────────────── */}
      <div
        className="relative overflow-hidden py-10 md:py-14"
        style={{ background: game.gradient }}
      >
        {/* BG blur blob */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: game.color }}
        />

        <div className="max-w-5xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <ChevronRight size={12} />
            <span style={{ color: "rgba(255,255,255,0.9)" }}>{game.name}</span>
          </div>

          <div className="flex items-start gap-6">
            {/* Cover */}
            <div
              className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: `0 0 30px ${game.color}50`, border: `2px solid ${game.color}50` }}
            >
              <Image
                src={`${game.cover}?v=${Date.now()}`}
                alt={game.name} fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {game.isHot && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#ef4444", color: "#fff" }}>
                    🔥 HOT
                  </span>
                )}
                {game.isNew && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#10b981", color: "#fff" }}>
                    ✨ NEW
                  </span>
                )}
              </div>
              <h1
                className="text-2xl md:text-4xl font-black text-white mb-1"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {game.emoji} {game.name}
              </h1>
              <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
                {game.publisher}
              </p>
              <p className="text-sm hidden md:block" style={{ color: "rgba(255,255,255,0.75)", maxWidth: "480px" }}>
                {game.description}
              </p>

              {/* Rating mock */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < 4 ? "#f59e0b" : "none"} style={{ color: "#f59e0b" }} />
                  ))}
                </div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>4.9 (2.4rb ulasan)</span>
              </div>
            </div>

            {/* CTA button desktop */}
            <div className="hidden md:flex flex-col gap-2">
              <button
                id="btn-topup-now"
                onClick={() => { setShowOrder(true); setTimeout(() => { document.getElementById("order-section")?.scrollIntoView({ behavior: "smooth" }); }, 100); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", boxShadow: "0 4px 20px rgba(245,158,11,0.45)" }}
              >
                <Zap size={16} />
                Lihat Harga &amp; Top Up
              </button>
              <div
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <Shield size={12} />
                Proses Otomatis via WhatsApp
              </div>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="mt-5 flex gap-3 md:hidden">
            <button
              onClick={() => { setShowOrder(true); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", boxShadow: "0 4px 20px rgba(245,158,11,0.4)" }}
            >
              <Zap size={16} />
              Lihat Harga &amp; Top Up
            </button>
          </div>
        </div>
      </div>

      {/* ── Order Section ─────────────────────────── */}
      <div id="order-section" className="max-w-5xl mx-auto px-4 py-10">

        {/* ── 4-Step Wizard Indicator ── */}
        <TransactionStepper currentStep={2} gameColor={game.color} />

        <div className="card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
              {"📝 Isi Formulir & Pilih Paket"} — {game.name}
            </h2>
            <button
              onClick={fetchProducts}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
              style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* ── STEP 2: Isi Data & Pilih Paket ── */}
          <div>

          {/* ── Formulir Isi Data (ditampilkan PERTAMA) ── */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <span style={{ fontSize: "18px" }}>📝</span> Isi Data Kamu
            </h3>

            {/* Game ID */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                <User size={14} className="inline mr-1" /> Game ID
              </label>
              <input
                id="input-game-id" type="text" className="input-styled"
                placeholder="Contoh: 123456789"
                value={gameId} onChange={(e) => setGameId(e.target.value)}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                Temukan Game ID di dalam game → Profil → ID Pengguna
              </p>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                <User size={14} className="inline mr-1" /> Nama Pengguna/Game
              </label>
              <input
                id="input-username" type="text" className="input-styled"
                placeholder="Contoh: RajaGamer123"
                value={username} onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* WhatsApp */}
            <div className="mb-0">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                <Phone size={14} className="inline mr-1" /> Nomor WhatsApp
              </label>
              <input
                id="input-whatsapp" type="tel" className="input-styled"
                placeholder="Contoh: 08123456789"
                value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </div>

          {/* ── Separator ── */}
          <div style={{ height: "1px", background: "var(--border)", margin: "24px 0" }} />

          {/* ── Pilih Nominal Top Up (ditampilkan KEDUA) ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Pilih Nominal
                {!loadingProducts && (
                  <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    ({filteredProducts.length} paket tersedia)
                  </span>
                )}
              </label>
              {/* Grid / List Toggle */}
              <div
                className="flex items-center gap-1 p-1 rounded-lg"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <button
                  id="game-view-grid"
                  onClick={() => setViewMode("grid")}
                  title="Grid 2 kolom"
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                  style={
                    viewMode === "grid"
                      ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a" }
                      : { color: "var(--text-muted)" }
                  }
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  id="game-view-list"
                  onClick={() => setViewMode("list")}
                  title="List view"
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                  style={
                    viewMode === "list"
                      ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a" }
                      : { color: "var(--text-muted)" }
                  }
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* Category tabs — hanya tampil jika ada > 1 kategori */}
            {availableCategories.length > 1 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {/* Tombol SEMUA */}
                <button
                  key="__all__"
                  id="category-semua"
                  onClick={() => { setActiveCategory(ALL_CATEGORIES); setSelectedProduct(null); }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={
                    activeCategory === ALL_CATEGORIES
                      ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", boxShadow: "0 4px 15px rgba(245,158,11,0.45)" }
                      : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
                  }
                >
                  🎯 Semua
                </button>

                {availableCategories.map((cat) => {
                  const catLower = cat?.toLowerCase() ?? "";
                  let icon = "📦";
                  let label = cat;
                  
                  if (catLower === game.currency?.toLowerCase()) {
                    icon = game.currencyIcon || "💎";
                    label = game.currency;
                  } else {
                    // Cari di extraCurrencies game (dari admin panel)
                    const extra = game.extraCurrencies?.find((c: any) => c.key === catLower || c.label.toLowerCase() === catLower);
                    if (extra) {
                      icon = extra.icon;
                      label = extra.label;
                    } else {
                      // Fallback untuk kategori standar
                      const CAT_MAP: Record<string, { icon: string; label: string }> = {
                        diamond:  { icon: "💎", label: "Diamond" },
                        uc:       { icon: "🪙", label: "UC" },
                        koin:     { icon: "🪙", label: "Koin" },
                        chip:     { icon: "🎰", label: "Chip" },
                        gold:     { icon: "🥇", label: "Gold" },
                        voucher:  { icon: "🎫", label: "Voucher" },
                        spesial:  { icon: "⭐", label: "Paket Spesial" },
                        b:        { icon: "🎰", label: "B" },
                        m:        { icon: "🎰", label: "M" },
                        "100m":   { icon: "💰", label: "100M" },
                      };
                      if (CAT_MAP[catLower]) {
                        icon = CAT_MAP[catLower].icon;
                        label = CAT_MAP[catLower].label;
                      } else {
                        // Untuk kategori custom yang tidak dikenal, gunakan nama aslinya
                        label = cat;
                        icon = "📦";
                      }
                    }
                  }
                  return (
                    <button
                      key={cat} id={`category-${cat}`}
                      onClick={() => { setActiveCategory(cat); setSelectedProduct(null); }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                      style={activeCategory?.toLowerCase() === catLower
                        ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", boxShadow: "0 4px 15px rgba(245,158,11,0.45)" }
                        : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                    >
                      {icon} {label}
                    </button>
                  );
                })}
              </div>
            )}

            {loadingProducts ? (
              <div style={viewMode === "grid"
                ? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }
                : { display: "flex", flexDirection: "column", gap: "8px" }
              }>
                {Array.from({ length: 8 }).map((_, i) => (
                  viewMode === "grid" ? (
                    <div key={i} className="product-card" style={{ cursor: "default" }}>
                      <div className="skeleton w-8 h-8 rounded-full mx-auto mb-2" />
                      <div className="skeleton h-4 w-12 mx-auto mb-1" />
                      <div className="skeleton h-3 w-10 mx-auto mb-2" />
                      <div className="skeleton h-4 w-16 mx-auto" />
                    </div>
                  ) : (
                    <div key={i} className="skeleton rounded-xl" style={{ height: "52px" }} />
                  )
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                className="text-center py-10 rounded-2xl"
                style={{ background: "var(--bg-secondary)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}
              >
                <span className="text-3xl block mb-2">📦</span>
                <p className="text-sm">Belum ada paket tersedia</p>
              </div>
            ) : (
              /* ── Grid or List container ── */
              <div
                style={
                  viewMode === "grid"
                    ? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }
                    : { display: "flex", flexDirection: "column", gap: "8px" }
                }
              >
                {filteredProducts.map((product) => {
                  const isSpesial = product.category === "spesial" && product.amount?.startsWith("SPECIAL|");

                  if (isSpesial) {
                    const parts = product.amount!.split("|");
                    const min = Number(parts[1]) || 1;
                    const max = Number(parts[2]) || 10;
                    const step = Number(parts[3]) || 1;
                    const unit = parts[4] || "B";
                    const basePrice = product.price;
                    const currentValue = specialValues[product.id] ?? min;
                    const calculatedPrice = (currentValue / step) * basePrice;
                    const isSelected = selectedProduct?.id === product.id || selectedProduct?.id === `${product.id}-dynamic`;

                    const handleSliderChange = (val: number) => {
                      setSpecialValues(prev => ({ ...prev, [product.id]: val }));
                      setSelectedProduct({
                        ...product,
                        id: `${product.id}-dynamic`,
                        amount: `${val}${unit}`,
                        name: `${product.name} - ${val}${unit}`,
                        price: (val / step) * basePrice,
                      });
                    };

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSliderChange(currentValue)}
                        style={{
                          gridColumn: "1 / -1",
                          background: isSelected ? `${game.color}15` : "var(--bg-secondary)",
                          border: isSelected ? `2px solid ${game.color}` : "2px solid var(--border)",
                          boxShadow: isSelected ? `0 4px 20px ${game.color}20` : "none",
                          borderRadius: "16px",
                          padding: "20px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {product.is_popular && <div className="popular-badge mb-2">🔥 Best Price</div>}
                        <div className="mb-4">
                          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{product.name}</h3>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            Pilih nominal mulai {min}{unit} sampai {max}{unit}. Harga otomatis dihitung {formatCurrency(basePrice)} per {step}{unit}.
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center mb-6 py-4 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
                          <div className="text-3xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
                            {currentValue}<span className="text-xl">{unit}</span>
                          </div>
                          <div className="text-lg font-bold" style={{ color: game.color }}>{formatCurrency(calculatedPrice)}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSliderChange(Math.max(min, currentValue - step)); }}
                            className="w-12 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-white text-black hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
                          >-{step}{unit}</button>
                          <div className="flex-1" onClick={e => e.stopPropagation()}>
                            <input
                              type="range" min={min} max={max} step={step} value={currentValue}
                              onChange={(e) => handleSliderChange(Number(e.target.value))}
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                              style={{ background: `linear-gradient(to right, ${game.color} ${((currentValue - min) / (max - min)) * 100}%, var(--border) ${((currentValue - min) / (max - min)) * 100}%)` }}
                            />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSliderChange(Math.min(max, currentValue + step)); }}
                            className="w-12 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-white text-black hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
                          >+{step}{unit}</button>
                        </div>
                      </div>
                    );
                  }

                  /* ── Static product: GRID card ── */
                  if (viewMode === "grid") {
                    const isSelected = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        id={`product-${product.id}`}
                        onClick={() => setSelectedProduct(product)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          padding: 0,
                          borderRadius: "14px",
                          border: isSelected
                            ? `2px solid ${game.color}`
                            : "1.5px solid var(--border)",
                          background: isSelected
                            ? `${game.color}18`
                            : "var(--bg-secondary)",
                          boxShadow: isSelected
                            ? `0 0 0 1px ${game.color}30, 0 8px 24px ${game.color}25`
                            : "0 1px 3px rgba(0,0,0,0.2)",
                          cursor: "pointer",
                          transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                          textAlign: "left",
                          overflow: "hidden",
                        }}
                      >
                        {/* Popular ribbon */}
                        {product.is_popular && (
                          <span
                            style={{
                              position: "absolute",
                              top: 0, left: 0, right: 0,
                              background: "linear-gradient(90deg,#fbbf24,#f59e0b)",
                              color: "#0f172a",
                              fontSize: "9px",
                              fontWeight: 800,
                              padding: "3px 0",
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              textAlign: "center",
                            }}
                          >🔥 Populer</span>
                        )}

                        {/* Selected checkmark (top-right) */}
                        {isSelected && (
                          <div
                            style={{
                              position: "absolute",
                              top: "8px", right: "8px",
                              width: "18px", height: "18px",
                              borderRadius: "50%",
                              background: game.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: `0 2px 8px ${game.color}60`,
                              zIndex: 1,
                            }}
                          >
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}

                        {/* ── Main content area ── */}
                        <div style={{ padding: product.is_popular ? "22px 10px 10px" : "10px 10px 10px", flex: 1 }}>
                          {/* Product name */}
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "12px",
                              color: "var(--text-primary)",
                              marginBottom: "10px",
                              lineHeight: 1.3,
                              paddingRight: isSelected ? "22px" : "0",
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            {product.name}
                          </div>

                          {/* Icon + Price row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                            <div style={{ flexShrink: 0, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <ProductIcon product={product} size={38} />
                            </div>
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "12px",
                                color: isSelected ? game.color : "var(--text-primary)",
                                transition: "color 0.2s ease",
                                minWidth: 0,
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                lineHeight: 1.3,
                              }}
                            >
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                        </div>

                        {/* ── Footer bar ── */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 10px",
                            background: "rgba(0,0,0,0.2)",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              letterSpacing: "0.07em",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                            }}
                          >
                            {product.category ?? "Regular"}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: "rgba(255,255,255,0.08)",
                              color: "var(--text-secondary)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            ⚡ FAST
                          </span>
                        </div>
                      </button>
                    );
                  }

                  /* ── Static product: LIST row ── */
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <button
                      key={product.id}
                      id={`product-list-${product.id}`}
                      onClick={() => setSelectedProduct(product)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        border: isSelected ? `2px solid ${game.color}` : "1.5px solid var(--border)",
                        background: isSelected ? `${game.color}10` : "var(--bg-secondary)",
                        boxShadow: isSelected ? `0 2px 12px ${game.color}25` : "none",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                        textAlign: "left",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "20px",
                          background: isSelected ? `${game.color}20` : "var(--bg-card)",
                          border: `1.5px solid ${isSelected ? game.color + "50" : "var(--border)"}`,
                        }}
                      >
                        <ProductIcon product={product} size={38} />
                      </div>
                      {/* Name + sub */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.2 }}>
                          {product.name}
                          {product.is_popular && (
                            <span style={{ marginLeft: "6px", color: "#ef4444", fontWeight: 700 }}>🔥</span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {product.amount} {product.category?.toUpperCase()}
                        </div>
                      </div>
                      {/* Price + checkmark */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <span style={{ fontWeight: 800, fontSize: "14px", color: game.color }}>
                          {formatCurrency(product.price)}
                        </span>
                        {isSelected && (
                          <div
                            style={{
                              width: "20px", height: "20px", borderRadius: "50%",
                              background: game.color, display: "flex",
                              alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                              <path d="M1 4L4 7L10 1" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div> {/* end product grid */}

          {/* ── Separator ── */}
          <div style={{ height: "1px", background: "var(--border)", margin: "24px 0" }} />

          {/* ── Paket Dipilih (summary) + Tombol Konfirmasi ── */}
          <div>
            {/* Paket dipilih (summary) */}
            {selectedProduct && (
              <div
                className="rounded-2xl p-3 mb-4 flex items-center justify-between"
                style={{ background: `${game.color}12`, border: `1.5px solid ${game.color}35` }}
              >
                <div>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>Paket dipilih</div>
                  <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{selectedProduct.name}</div>
                </div>
                <div className="text-base font-black" style={{ color: game.color }}>
                  {formatCurrency(selectedProduct.price)}
                </div>
              </div>
            )}

            {/* Tombol Konfirmasi */}
            <button
              id="btn-order-now"
              onClick={() => { setSuccessInvoiceId(null); handleOrder(); }}
              disabled={isSubmitting || !gameId.trim() || !username.trim() || !whatsapp.trim() || !selectedProduct}
              className="w-full flex items-center justify-center gap-2 text-base font-bold py-4 rounded-2xl transition-all hover:opacity-90"
              style={{
                background: (gameId.trim() && username.trim() && whatsapp.trim() && selectedProduct)
                  ? `linear-gradient(135deg, ${game.color}, ${game.color}cc)`
                  : "var(--bg-secondary)",
                color: (gameId.trim() && username.trim() && whatsapp.trim() && selectedProduct) ? "#0f172a" : "var(--text-muted)",
                boxShadow: (gameId.trim() && username.trim() && whatsapp.trim() && selectedProduct) ? `0 4px 20px ${game.color}30` : "none",
                cursor: (gameId.trim() && username.trim() && whatsapp.trim() && selectedProduct) ? "pointer" : "not-allowed",
              }}
            >
              {isSubmitting
                ? <Loader2 size={18} className="animate-spin" />
                : <ChevronRight size={18} />}
              {!gameId.trim() || !username.trim() || !whatsapp.trim()
                ? "Isi data kamu terlebih dahulu"
                : !selectedProduct
                  ? "Pilih paket terlebih dahulu"
                  : "Cek & Konfirmasi Pesanan"}
            </button>
          </div> {/* end submit */}

          </div> {/* end step wrapper */}

        </div>

        {/* Info box */}
        <div
          className="mt-6 p-4 rounded-2xl text-sm flex items-start gap-3"
          style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
        >
          <Shield size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Proses via WhatsApp</div>
            <div className="text-xs opacity-80">
              Setelah konfirmasi, kamu akan diarahkan ke WhatsApp admin kami.
              Pastikan Game ID yang dimasukkan sudah benar — kesalahan ID di luar tanggung jawab kami.
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronLeft size={14} />
            Kembali ke daftar game
          </Link>
        </div>
      </div>

      <ConfirmModal
        isOpen={modalOpen} onClose={() => { setModalOpen(false); setSuccessInvoiceId(null); }}
        onConfirm={handleConfirm} gameName={game.name} gameId={gameId}
        username={username}
        whatsapp={whatsapp} product={selectedProduct}
        isLoading={isSubmitting}
        successInvoiceId={successInvoiceId}
      />
    </div>
  );
}
