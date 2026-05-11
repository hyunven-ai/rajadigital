import { NextRequest, NextResponse } from "next/server";

const BUCKET = "payment-proofs";
const MAX_AGE_DAYS = 3;

export async function GET(req: NextRequest) {
  // Verifikasi cron secret agar tidak bisa dipanggil sembarang orang
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "";

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase env vars not set" }, { status: 500 });
  }

  try {
    // List semua file di bucket
    const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix: "",
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "asc" },
      }),
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      return NextResponse.json({ error: "Failed to list files", detail: err }, { status: 500 });
    }

    const files: Array<{
      name: string;
      created_at: string;
      updated_at: string;
      metadata?: { size?: number };
    }> = await listRes.json();

    const now = Date.now();
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    // Filter file yang sudah lebih dari 3 hari
    const toDelete = files.filter((f) => {
      const createdAt = new Date(f.created_at ?? f.updated_at).getTime();
      return now - createdAt > maxAgeMs;
    });

    if (toDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada file yang perlu dihapus",
        checked: files.length,
        deleted: 0,
      });
    }

    // Hapus file yang sudah kedaluwarsa
    const deleteRes = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: toDelete.map((f) => f.name) }),
    });

    const deleteData = await deleteRes.json();

    console.log(`[cleanup-proofs] Deleted ${toDelete.length} file(s) older than ${MAX_AGE_DAYS} days`);

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${toDelete.length} file lama`,
      checked: files.length,
      deleted: toDelete.length,
      files_deleted: toDelete.map((f) => f.name),
      supabase_response: deleteData,
    });
  } catch (err) {
    console.error("[cleanup-proofs] Error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}
