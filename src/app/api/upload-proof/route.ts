import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const invoiceId = (formData.get("invoice_id") as string | null) ?? "unknown";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Coba upload ke Supabase Storage jika dikonfigurasi
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

    if (
      supabaseUrl.startsWith("https://") &&
      !supabaseUrl.includes("your-project") &&
      supabaseServiceKey.length > 20
    ) {
      try {
        const ext = file.name.split(".").pop() ?? "jpg";
        const filename = `${invoiceId}-${Date.now()}.${ext}`;
        const bucket = "payment-proofs";

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filename}`;
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": file.type || "image/jpeg",
            "x-upsert": "true",
          },
          body: buffer,
        });

        if (uploadRes.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
          return NextResponse.json({ success: true, url: publicUrl });
        }

        // Jika bucket belum ada, tetap lanjutkan tanpa URL
        console.warn("[upload-proof] Supabase Storage upload failed:", await uploadRes.text());
      } catch (storageErr) {
        console.warn("[upload-proof] Storage error:", storageErr);
      }
    }

    // Fallback: kembalikan null URL, transaksi tetap dibuat
    return NextResponse.json({ success: true, url: null });
  } catch (err) {
    console.error("[upload-proof] Error:", err);
    return NextResponse.json({ error: "Gagal upload" }, { status: 500 });
  }
}
