import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function generateInvoiceId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RDG-${timestamp}-${random}`;
}

export function formatWhatsApp(number: string): string {
  let cleaned = number.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

export function buildWhatsAppMessage(data: {
  invoiceId: string;
  gameName: string;
  gameId: string;
  username?: string;
  productName: string;
  price: number;
  whatsapp: string;
  category: string;
  paidViaQris?: boolean;   // true jika sudah bayar via QRIS sebelum WA
}): string {
  const CAT_LABEL: Record<string, string> = {
    diamond: "💎 Diamond",
    uc:      "🪙 UC",
    koin:    "🪙 Koin",
    chip:    "🎰 Chip",
    gold:    "🥇 Gold",
    voucher: "🎫 Voucher",
  };
  const catLabel = CAT_LABEL[data.category?.toLowerCase()] ?? data.category;

  const paymentSection = data.paidViaQris
    ? [
        "━━━━━━━━━━━━━━━━━━━━━━",
        "✅ *Pembayaran:* Sudah dibayar via *QRIS*",
        `💰 Nominal: *${formatCurrency(data.price)}*`,
        "",
        "📸 Mohon lampirkan *bukti pembayaran QRIS* ke chat ini agar pesanan segera diproses.",
      ]
    : [
        "━━━━━━━━━━━━━━━━━━━━━━",
        "💳 *Cara Pembayaran:*",
        "Silakan tanyakan metode pembayaran (Transfer Bank / QRIS) kepada admin.",
        "",
        "📸 Setelah pembayaran, kirim *bukti transfer* ke chat ini agar pesanan segera diproses.",
      ];

  const message = [
    "🛒 *ORDER RAJA DIGITAL* 🛒",
    "",
    `📋 Invoice ID: *${data.invoiceId}*`,
    `🎮 Game: *${data.gameName}*`,
    `🆔 Game ID: *${data.gameId}*`,
    ...(data.username ? [`👤 Nama Pengguna: *${data.username}*`] : []),
    `${catLabel} Paket: *${data.productName}*`,
    `💰 Harga: *${formatCurrency(data.price)}*`,
    `📱 No. WA: *${data.whatsapp}*`,
    "",
    ...paymentSection,
    "",
    "Terima kasih telah memesan di *RAJA DIGITAL*! 🙏",
  ].join("\n");

  return encodeURIComponent(message);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
