import { NextRequest, NextResponse } from "next/server";
import { isDokuConfigured, generateQris } from "@/lib/doku";

// ── In-memory rate limiter ─────────────────────────────────────────────────
const ipRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);
  if (!record || now > record.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

/**
 * POST /api/doku/create-qris
 *
 * Body:
 * {
 *   invoice_id: string,
 *   amount: number,
 *   game_id: string,
 *   game_name: string,
 *   username?: string,
 *   whatsapp: string,
 *   product_id: string,
 *   product_name: string,
 *   expiry_minutes?: number  // default 30
 * }
 *
 * Response:
 * {
 *   success: true,
 *   invoice_id: string,
 *   qr_url: string,
 *   qr_content: string,
 *   external_id: string,
 *   expires_at: string (ISO)
 * }
 */
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

  // Check DOKU configured
  if (!isDokuConfigured()) {
    return NextResponse.json(
      { error: "DOKU belum dikonfigurasi. Hubungi admin." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      invoice_id,
      amount,
      game_id,
      game_name,
      username,
      whatsapp,
      product_id,
      product_name,
      expiry_minutes = 30,
    } = body;

    // Validasi input
    if (!invoice_id || !amount || !game_id || !whatsapp || !product_name) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
    }

    // Sanitasi nomor WA
    let cleanWa = whatsapp.replace(/\D/g, "");
    if (cleanWa.startsWith("0")) cleanWa = "62" + cleanWa.slice(1);
    if (!cleanWa.startsWith("62")) cleanWa = "62" + cleanWa;

    // Generate QRIS via DOKU
    const qrisResult = await generateQris({
      invoiceId: invoice_id,
      amount,
      customerName: username,
      expiryMinutes: expiry_minutes,
    });

    // Hitung waktu expired
    const expiresAt = new Date(Date.now() + expiry_minutes * 60_000).toISOString();

    // Simpan transaksi ke Supabase (jika dikonfigurasi)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

      if (
        supabaseUrl.startsWith("https://") &&
        !supabaseUrl.includes("your-project") &&
        supabaseKey.length > 20
      ) {
        const { createClient } = await import("@supabase/supabase-js");
        const db = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        // Validasi UUID untuk product_id
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validProductId = uuidRegex.test(product_id) ? product_id : null;

        const insertPayload: Record<string, unknown> = {
          invoice_id,
          game_id: game_id.trim(),
          game_name: game_name ?? "Unknown",
          whatsapp: cleanWa,
          product_id: validProductId,
          product_name,
          product_price: amount,
          status: "pending",
          payment_method: "qris_doku",
          doku_invoice_id: qrisResult.partnerReferenceNo,
          doku_qr_url: qrisResult.qrUrl,
          doku_qr_content: qrisResult.qrContent,
          doku_external_id: qrisResult.externalId,
        };

        // Simpan username ke notes jika ada
        if (username) {
          insertPayload.notes = `Nama Pengguna: ${username}`;
        }

        const { error } = await db.from("transactions").insert(insertPayload);
        if (error) {
          console.error("[DOKU] Failed to save transaction:", error);
          // Jangan throw — QRIS sudah ter-generate, biarkan customer bayar
        }
      }
    } catch (dbErr) {
      console.error("[DOKU] DB save error (non-fatal):", dbErr);
    }

    return NextResponse.json({
      success: true,
      invoice_id,
      qr_url: qrisResult.qrUrl,
      qr_content: qrisResult.qrContent,
      external_id: qrisResult.externalId,
      expires_at: expiresAt,
    });
  } catch (err: unknown) {
    console.error("[DOKU] Create QRIS error:", err);
    const message = err instanceof Error ? err.message : "Gagal membuat QRIS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
