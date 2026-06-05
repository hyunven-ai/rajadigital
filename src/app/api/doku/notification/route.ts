import { NextRequest, NextResponse } from "next/server";
import { verifyNotificationSignature } from "@/lib/doku";

/**
 * POST /api/doku/notification
 *
 * Webhook endpoint yang dipanggil DOKU ketika customer selesai membayar.
 * DOKU akan mengirim POST request dengan detail pembayaran.
 *
 * PENTING:
 * - URL ini harus bisa diakses dari internet (public)
 * - Harus return 200 OK secepat mungkin
 * - Daftarkan URL ini di DOKU Dashboard > Settings > Notification URL
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // ── Extract headers untuk verifikasi ──
    const clientId = req.headers.get("x-partner-id") ?? req.headers.get("client-id") ?? "";
    const requestId = req.headers.get("x-external-id") ?? req.headers.get("request-id") ?? "";
    const requestTimestamp = req.headers.get("x-timestamp") ?? req.headers.get("request-timestamp") ?? "";
    const receivedSignature = req.headers.get("x-signature") ?? req.headers.get("signature") ?? "";

    // ── Verifikasi signature ──
    if (receivedSignature) {
      const isValid = verifyNotificationSignature(
        clientId,
        requestId,
        requestTimestamp,
        rawBody,
        receivedSignature
      );

      if (!isValid) {
        console.warn("[DOKU Webhook] Invalid signature! Possible tampering.");
        // Tetap proses untuk sandbox testing, tapi log warning
        // Di production, uncomment baris di bawah:
        // return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // ── Extract data pembayaran ──
    const partnerReferenceNo = body.partnerReferenceNo ?? body.invoiceNumber ?? "";
    const transactionStatus = body.latestTransactionStatus ?? body.transactionStatus ?? "";
    const paidAmount = body.amount?.value ?? body.paidAmount ?? "";
    const paidAt = body.paidAt ?? body.transactionDate ?? new Date().toISOString();
    const dokuReferenceNo = body.referenceNo ?? body.acquirerReferenceNo ?? "";

    console.log("[DOKU Webhook] Received notification:", {
      partnerReferenceNo,
      transactionStatus,
      paidAmount,
      dokuReferenceNo,
    });

    // Status "00" atau "SUCCESS" = pembayaran berhasil
    const isPaid = transactionStatus === "00" || 
                   transactionStatus === "SUCCESS" ||
                   transactionStatus === "success";

    if (!isPaid) {
      console.log("[DOKU Webhook] Transaction not paid yet, status:", transactionStatus);
      return NextResponse.json({ responseCode: "2005500", responseMessage: "OK" });
    }

    // ── Update transaksi di database ──
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

        // Cari transaksi berdasarkan invoice_id (= partnerReferenceNo)
        const { data: transaction, error: findErr } = await db
          .from("transactions")
          .select("id, status")
          .eq("invoice_id", partnerReferenceNo)
          .maybeSingle();

        if (findErr) {
          console.error("[DOKU Webhook] DB find error:", findErr);
        }

        if (transaction) {
          // Hindari double-processing
          if (transaction.status === "selesai") {
            console.log("[DOKU Webhook] Transaction already completed, skipping.");
            return NextResponse.json({ responseCode: "2005500", responseMessage: "OK" });
          }

          // Update status ke "selesai"
          const { error: updateErr } = await db
            .from("transactions")
            .update({
              status: "selesai",
              is_processed: true,
              processed_by: "DOKU-AUTO",
              processed_at: new Date().toISOString(),
              doku_paid_at: paidAt,
              doku_reference_no: dokuReferenceNo,
            })
            .eq("id", transaction.id);

          if (updateErr) {
            console.error("[DOKU Webhook] DB update error:", updateErr);
          } else {
            console.log("[DOKU Webhook] Transaction updated to selesai:", partnerReferenceNo);
          }
        } else {
          console.warn("[DOKU Webhook] Transaction not found:", partnerReferenceNo);
        }
      }
    } catch (dbErr) {
      console.error("[DOKU Webhook] DB error:", dbErr);
    }

    // DOKU mengharapkan response 200 dengan responseCode
    return NextResponse.json({
      responseCode: "2005500",
      responseMessage: "OK",
    });
  } catch (err) {
    console.error("[DOKU Webhook] Error:", err);
    // Tetap return 200 agar DOKU tidak retry terus-menerus
    return NextResponse.json({
      responseCode: "2005500",
      responseMessage: "OK",
    });
  }
}
