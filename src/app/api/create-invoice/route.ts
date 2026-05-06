import { NextRequest, NextResponse } from "next/server";

// ── In-memory rate limiter ─────────────────────────────────────────────────
const ipRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS  = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now    = Date.now();
  const record = ipRequests.get(ip);
  if (!record || now > record.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// ── Check apakah Supabase sudah dikonfigurasi ──────────────────────────────
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("your-project") &&
    key.length > 20 &&
    !key.includes("your-service")
  );
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { invoice_id, game_id, game_name, whatsapp, product_id, product_name, product_price } = body;

    // Validasi input
    if (!invoice_id || !game_id || !whatsapp || !product_id || !product_name || !product_price) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    if (typeof product_price !== "number" || product_price <= 0) {
      return NextResponse.json({ error: "Harga produk tidak valid" }, { status: 400 });
    }

    // Sanitasi nomor WA
    let cleanWa = whatsapp.replace(/\D/g, "");
    if (cleanWa.startsWith("0")) cleanWa = "62" + cleanWa.slice(1);
    if (!cleanWa.startsWith("62")) cleanWa = "62" + cleanWa;

    // Simpan ke Supabase jika sudah dikonfigurasi
    if (isSupabaseConfigured()) {
      const { createTransaction } = await import("@/lib/supabase");

      // Validasi UUID — mock data menggunakan angka biasa, bukan UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validProductId = uuidRegex.test(product_id) ? product_id : null;

      await createTransaction({
        invoice_id,
        game_id:       game_id.trim(),
        username:      body.username,
        game_name:     game_name ?? "Royal Dream",
        whatsapp:      cleanWa,
        product_id:    validProductId,
        product_name,
        product_price,
      });
    } else {
      // Mode development — log saja, tidak simpan ke DB
      console.log("[DEV] Invoice created (not saved to DB — configure Supabase in .env.local):", {
        invoice_id, game_id, whatsapp: cleanWa, product_name, product_price,
      });
    }

    return NextResponse.json({
      success: true,
      invoice_id,
      message: "Invoice berhasil dibuat",
    });

  } catch (err: unknown) {
    console.error("Create invoice error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
