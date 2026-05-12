import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
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
    const filename = `${slug}-${safeKey}.${ext}`;
    const destDir  = path.join(process.cwd(), "public", "currencies");
    const destPath = path.join(destDir, filename);

    // Ensure directory exists
    await fs.mkdir(destDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(destPath, buffer);

    const imageUrl     = `/currencies/${filename}`;
    const imageBustUrl = `${imageUrl}?v=${Date.now()}`;

    // Update games.json
    const gamesFile = path.join(process.cwd(), "src/data/games.json");
    try {
      const raw   = await fs.readFile(gamesFile, "utf-8");
      const games = JSON.parse(raw) as Record<string, unknown>[];
      const idx   = games.findIndex((g) => g.slug === slug || g.id === slug);
      if (idx !== -1) {
        if (currencyKey === "__primary__") {
          games[idx] = { ...games[idx], currencyImage: imageUrl };
        } else {
          const extras = (games[idx].extraCurrencies as Record<string, unknown>[] | undefined) ?? [];
          const extraIdx = extras.findIndex((e) => e.key === currencyKey);
          if (extraIdx !== -1) {
            extras[extraIdx] = { ...extras[extraIdx], currencyImage: imageUrl };
            games[idx] = { ...games[idx], extraCurrencies: extras };
          }
        }
        await fs.writeFile(gamesFile, JSON.stringify(games, null, 2), "utf-8");
      }
    } catch { /* ignore games.json update errors */ }

    // Update Supabase
    try {
      const db = createServerSupabase();
      if (currencyKey === "__primary__") {
        await db.from("games").update({ currency_image: imageUrl }).eq("slug", slug);
      } else {
        // Fetch current extra_currencies, update the matching key, save back
        const { data } = await db.from("games").select("extra_currencies").eq("slug", slug).single();
        if (data?.extra_currencies) {
          const extras = data.extra_currencies as Record<string, unknown>[];
          const extraIdx = extras.findIndex((e) => e.key === currencyKey);
          if (extraIdx !== -1) {
            extras[extraIdx] = { ...extras[extraIdx], currencyImage: imageUrl };
            await db.from("games").update({ extra_currencies: extras }).eq("slug", slug);
          }
        }
      }
    } catch { /* ignore Supabase update errors */ }

    return NextResponse.json({
      success: true,
      imageUrl,
      imageBustUrl,
      filename,
    });
  } catch (err) {
    console.error("Upload currency image error:", err);
    return NextResponse.json({ error: "Gagal mengupload gambar currency" }, { status: 500 });
  }
}
