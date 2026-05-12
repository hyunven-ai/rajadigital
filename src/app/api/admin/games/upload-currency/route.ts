import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// POST /api/admin/games/upload-currency
// Body: FormData { file: File, slug: string, currencyKey: string }
// currencyKey: "__primary__" untuk currency utama, atau key extra (misal "b", "m", "diamond")

export async function POST(req: NextRequest) {
  try {
    const formData    = await req.formData();
    const file        = formData.get("file") as File | null;
    const slug        = (formData.get("slug") as string | null)?.trim();
    const currencyKey = (formData.get("currencyKey") as string | null)?.trim();

    if (!file)        return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    if (!slug)        return NextResponse.json({ error: "Slug game diperlukan" }, { status: 400 });
    if (!currencyKey) return NextResponse.json({ error: "Currency key diperlukan" }, { status: 400 });

    // Validate image type
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Format file tidak didukung. Gunakan PNG, JPG, atau WebP" }, { status: 400 });
    }

    // Max 500KB
    if (file.size > 500 * 1024) {
      return NextResponse.json({ error: "Ukuran file icon maksimal 500KB" }, { status: 400 });
    }

    const ext      = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const safeKey  = currencyKey.replace(/[^a-z0-9_-]/g, "");
    const filename = `currencies/${slug}-${safeKey}.${ext}`;

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
      return NextResponse.json({ error: "Gagal mengupload ke storage: " + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = db.storage.from("game-assets").getPublicUrl(filename);
    const imageUrl = urlData.publicUrl;

    // Update Supabase DB
    try {
      if (currencyKey === "__primary__") {
        await db.from("games").update({ currency_image: imageUrl }).eq("slug", slug);
      } else {
        // Fetch current extra_currencies, update the matching key, save back
        const { data } = await db.from("games").select("extra_currencies").eq("slug", slug).single();
        if (data?.extra_currencies) {
          const extras   = data.extra_currencies as Record<string, unknown>[];
          const extraIdx = extras.findIndex((e) => e.key === currencyKey);
          if (extraIdx !== -1) {
            extras[extraIdx] = { ...extras[extraIdx], currencyImage: imageUrl };
            await db.from("games").update({ extra_currencies: extras }).eq("slug", slug);
          }
        }
      }
    } catch { /* ignore DB update errors */ }

    return NextResponse.json({
      success: true,
      imageUrl,
      imageBustUrl: `${imageUrl}?v=${Date.now()}`,
      filename,
    });
  } catch (err) {
    console.error("Upload currency image error:", err);
    return NextResponse.json({ error: "Gagal mengupload gambar currency" }, { status: 500 });
  }
}
