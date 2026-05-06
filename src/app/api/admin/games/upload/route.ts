import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// POST /api/admin/games/upload
// Body: FormData { file: File, slug: string }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slug = (formData.get("slug") as string | null)?.trim();

    if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    if (!slug)  return NextResponse.json({ error: "Slug game diperlukan" }, { status: 400 });

    // Validate image type
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Format file tidak didukung. Gunakan PNG, JPG, atau WebP" }, { status: 400 });
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }

    const ext     = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const filename = `${slug}.${ext}`;
    const destDir  = path.join(process.cwd(), "public", "games");
    const destPath = path.join(destDir, filename);

    // Ensure directory exists
    await fs.mkdir(destDir, { recursive: true });

    // Convert to buffer and write
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(destPath, buffer);

    // Also update cover path in games.json if the game exists
    const gamesFile = path.join(process.cwd(), "src/data/games.json");
    try {
      const raw   = await fs.readFile(gamesFile, "utf-8");
      const games = JSON.parse(raw) as Record<string, unknown>[];
      const idx   = games.findIndex((g) => g.slug === slug || g.id === slug);
      if (idx !== -1) {
        // Simpan path clean (tanpa ?v=) ke JSON, cache-busting hanya di response
        games[idx] = { ...games[idx], cover: `/games/${filename}` };
        await fs.writeFile(gamesFile, JSON.stringify(games, null, 2), "utf-8");
      }
    } catch { /* ignore if games.json update fails */ }

    const coverUrl = `/games/${filename}?v=${Date.now()}`;

    return NextResponse.json({
      success: true,
      cover: `/games/${filename}`,   // path clean (disimpan ke DB)
      coverBust: coverUrl,           // dengan cache-busting (untuk preview)
      filename,
    });
  } catch (err) {
    console.error("Upload game image error:", err);
    return NextResponse.json({ error: "Gagal mengupload gambar" }, { status: 500 });
  }
}
