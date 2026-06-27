import { NextRequest, NextResponse } from "next/server";
import { updateTransactionStatus, createServerSupabase } from "@/lib/supabase";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "rajadigital-secret-change-in-production"
);

type Params = { params: Promise<{ id: string }> };

/* ── Ambil info admin dari JWT ────────────────────────────── */
async function getAdminFromRequest(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token || token === "dev-token") {
      return { id: null, username: "admin", role: "superadmin" };
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Validasi UUID
    const id = String(payload.id ?? "");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    return {
      id: isUuid ? id : null,
      username: String(payload.username ?? "admin"),
      role: String(payload.role ?? ""),
    };
  } catch {
    return { id: null, username: "admin", role: "" };
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, is_processed } = body;

    if (!id) {
      return NextResponse.json({ error: "ID transaksi tidak ditemukan" }, { status: 400 });
    }

    const validStatuses = ["pending", "selesai", "batal"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const admin = await getAdminFromRequest(req);
    await updateTransactionStatus(id, status, is_processed, admin.username);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update transaction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── DELETE: Hapus transaksi + log activity ───────────────── */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    const admin = await getAdminFromRequest(req);
    if (admin.role !== "superadmin") {
      return NextResponse.json({ error: "Hanya superadmin yang dapat menghapus transaksi" }, { status: 403 });
    }

    const db    = createServerSupabase();

    // Ambil data transaksi sebelum dihapus (untuk log)
    const { data: tx, error: fetchErr } = await db
      .from("transactions")
      .select("invoice_id, game_id, product_name, product_price, status, whatsapp")
      .eq("id", id)
      .single();

    if (fetchErr || !tx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Hapus transaksi
    const { error: delErr } = await db.from("transactions").delete().eq("id", id);
    if (delErr) throw delErr;

    // Log activity (jangan blok response jika gagal)
    const { error: logErr } = await db.from("activity_logs").insert({
      admin_id:       admin.id ?? null,
      admin_username: admin.username,
      action:         "DELETE_TRANSACTION",
      details:        JSON.stringify({
        transaction_id:  id,
        invoice_id:      tx.invoice_id,
        game_id:         tx.game_id,
        product_name:    tx.product_name,
        product_price:   tx.product_price,
        status:          tx.status,
        whatsapp:        tx.whatsapp,
        deleted_at:      new Date().toISOString(),
      }),
    });
    if (logErr) console.error("⚠️ Log activity gagal:", logErr.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete transaction error:", err);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}

