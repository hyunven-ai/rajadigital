import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/doku/check-status?invoice_id=xxx
 *
 * Endpoint polling untuk frontend mengecek apakah pembayaran QRIS
 * sudah dikonfirmasi oleh DOKU melalui webhook.
 *
 * Response:
 * {
 *   status: "pending" | "selesai" | "batal",
 *   paid: boolean,
 *   invoice_id: string
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoice_id");

  if (!invoiceId) {
    return NextResponse.json(
      { error: "invoice_id diperlukan" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

    if (
      !supabaseUrl.startsWith("https://") ||
      supabaseUrl.includes("your-project") ||
      supabaseKey.length <= 20
    ) {
      return NextResponse.json(
        { status: "pending", paid: false, invoice_id: invoiceId },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await db
      .from("transactions")
      .select("status, doku_paid_at, doku_reference_no")
      .eq("invoice_id", invoiceId)
      .maybeSingle();

    if (error) {
      console.error("[DOKU Check Status] DB error:", error);
      return NextResponse.json(
        { status: "pending", paid: false, invoice_id: invoiceId },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!data) {
      return NextResponse.json(
        { status: "not_found", paid: false, invoice_id: invoiceId },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        status: data.status,
        paid: data.status === "selesai",
        invoice_id: invoiceId,
        paid_at: data.doku_paid_at ?? null,
        reference_no: data.doku_reference_no ?? null,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("[DOKU Check Status] Error:", err);
    return NextResponse.json(
      { status: "pending", paid: false, invoice_id: invoiceId },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
