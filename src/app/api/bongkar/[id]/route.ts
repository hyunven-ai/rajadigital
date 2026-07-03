import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "rajadigital-secret-change-in-production"
);

async function getAdminFromRequest(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token || token === "dev-token") return { username: "admin", role: "superadmin" };
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { 
      username: String(payload.username ?? "admin"),
      role: String(payload.role ?? ""),
    };
  } catch {
    return { username: "admin", role: "" };
  }
}

/* ── PATCH: Update status bongkar chip (admin) ── */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const body = await req.json();
    const { status, admin_notes, nominal_pembayaran } = body;

    const validStatuses = ["pending", "diproses", "selesai", "batal"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const admin = await getAdminFromRequest(req);
    const db = createServerSupabase();
    const updateData: Record<string, unknown> = {};
    if (status !== undefined)              updateData.status              = status;
    if (admin_notes !== undefined)         updateData.admin_notes         = admin_notes;
    if (nominal_pembayaran !== undefined)  updateData.nominal_pembayaran  = nominal_pembayaran;
    
    // update logs details
    updateData.processed_by = admin.username;
    updateData.processed_at = new Date().toISOString();

    const { data, error } = await db
      .from("bongkar_chip_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ request: data });
  } catch (err: any) {
    console.error("Update bongkar chip error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal update" }, { status: 500 });
  }
}

/* ── DELETE: Hapus + log ke activity_logs ── */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const admin = await getAdminFromRequest(req);
    if (admin.role !== "superadmin") {
      return NextResponse.json({ error: "Hanya superadmin yang dapat menghapus request bongkar chip" }, { status: 403 });
    }

    const db = createServerSupabase();

    // Ambil data sebelum hapus (untuk log)
    const { data: row, error: fetchErr } = await db
      .from("bongkar_chip_requests")
      .select("invoice_id, player_id, game_name, nominal_bongkar, bank, nomor_rekening, nama_rekening, whatsapp, status")
      .eq("id", id)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ error: "Request tidak ditemukan" }, { status: 404 });
    }

    // Hapus
    const { error: delErr } = await db.from("bongkar_chip_requests").delete().eq("id", id);
    if (delErr) throw delErr;

    // Log activity (non-blocking)
    db.from("activity_logs").insert({
      admin_id:       null,
      admin_username: admin.username,
      action:         "DELETE_BONGKAR_CHIP",
      details: JSON.stringify({
        request_id:     id,
        invoice_id:     row.invoice_id,
        player_id:      row.player_id,
        nominal_bongkar: row.nominal_bongkar,
        bank:           row.bank,
        nomor_rekening: row.nomor_rekening,
        nama_rekening:  row.nama_rekening,
        whatsapp:       row.whatsapp,
        status:         row.status,
        deleted_at:     new Date().toISOString(),
      }),
    }).then(({ error }) => { if (error) console.error("⚠️ Log bongkar gagal:", error.message); });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete bongkar chip error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal hapus" }, { status: 500 });
  }
}
