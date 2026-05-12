import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// POST /api/admin/products/upload-image
// Body: FormData { file: File, product_id: string }

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData();
    const file       = formData.get("file") as File | null;
    const productId  = (formData.get("product_id") as string | null)?.trim();

    if (!file)      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    if (!productId) return NextResponse.json({ error: "Product ID diperlukan" }, { status: 400 });

    // Validate image type
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Format tidak didukung. Gunakan PNG, JPG, atau WebP" }, { status: 400 });
    }

    // Max 1MB
    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 1MB" }, { status: 400 });
    }

    const ext      = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const filename = `products/${productId}.${ext}`;

    // Upload to Supabase Storage
    const db     = createServerSupabase();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from("game-assets")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json({ error: "Gagal upload ke storage: " + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = db.storage.from("game-assets").getPublicUrl(filename);
    const imageUrl = urlData.publicUrl;

    // Update product in Supabase DB
    const { error: dbError } = await db
      .from("products")
      .update({ special_image: imageUrl })
      .eq("id", productId);

    if (dbError) {
      console.error("DB update error:", dbError);
      // Still return the URL even if DB update fails (can be retried via save)
    }

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (err) {
    console.error("Upload product image error:", err);
    return NextResponse.json({ error: "Gagal mengupload gambar produk" }, { status: 500 });
  }
}
