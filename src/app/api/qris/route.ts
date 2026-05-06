import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Prevent Next.js from caching GET — always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface QrisItem {
  id: string;
  label: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ── Persistent JSON file storage (dev fallback) ──
const DATA_FILE = path.join(process.cwd(), ".qris-data.json");

function readFile(): QrisItem[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    // Read as buffer to handle any encoding (UTF-8, UTF-16 BOM from PowerShell)
    const buf = fs.readFileSync(DATA_FILE);
    // Strip UTF-16 LE BOM (FF FE) or UTF-8 BOM (EF BB BF) if present
    let str: string;
    if (buf[0] === 0xFF && buf[1] === 0xFE) {
      str = buf.slice(2).toString("utf16le");
    } else if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      str = buf.slice(3).toString("utf-8");
    } else {
      str = buf.toString("utf-8");
    }
    return JSON.parse(str) as QrisItem[];
  } catch { return []; }
}

function writeFile(list: QrisItem[]) {
  // Always write UTF-8 (no BOM) so Node.js can read it back cleanly
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), { encoding: "utf-8" });
  } catch (err) {
    console.warn("Failed to write to local file system (expected on Vercel):", err);
  }
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("your-project") &&
    key.length > 20 &&
    !key.includes("your-service")
  );
}

async function trySupabase<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

/* ── GET ────────────────────────────────────────
   ?all=true  → return full list (admin panel)
   (no param) → return single active QRIS (frontend)
   ─────────────────────────────────────────────── */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  // Try Supabase first
  if (isSupabaseConfigured()) {
    const result = await trySupabase(async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const noStore = { headers: { "Cache-Control": "no-store, max-age=0" } };
      if (all) {
        const { data, error } = await sb
          .from("qris_settings")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        return NextResponse.json({ list: data ?? [] }, noStore);
      } else {
        const { data, error } = await sb
          .from("qris_settings")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return NextResponse.json({ qris: data ?? null }, noStore);
      }
    });
    if (result) return result;
    // Fall through to file-based storage if Supabase fails
  }

  // ── File-based fallback ──
  const list = readFile();
  const noStore = { headers: { "Cache-Control": "no-store, max-age=0" } };
  if (all) {
    return NextResponse.json({ list }, noStore);
  }
  const active = list.find((q) => q.is_active) ?? null;
  return NextResponse.json({ qris: active }, noStore);
}

/* ── POST — save full list (admin) ─────────────── */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const list: QrisItem[] = body.list ?? [];

    // Try Supabase first
    if (isSupabaseConfigured()) {
      const ok = await trySupabase(async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // Delete all then reinsert
        await sb.from("qris_settings").delete().neq("id", "______");
        if (list.length > 0) {
          const { error } = await sb.from("qris_settings").insert(list);
          if (error) throw error;
        }
        return true;
      });
      if (ok) {
        // Also persist locally as backup
        writeFile(list);
        return NextResponse.json({ ok: true, storage: "supabase", saved: list.length });
      } else {
        throw new Error("Gagal menyimpan ke Supabase");
      }
      // Fall through to file storage
    }

    // ── File-based fallback ──
    writeFile(list);
    return NextResponse.json({ ok: true, storage: "file", saved: list.length });

  } catch (err) {
    console.error("[QRIS POST error]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
