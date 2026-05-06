import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface WaNumber {
  id: string;
  label: string;
  number: string;
  is_active: boolean;
  sort_order: number;
}

const DATA_FILE = path.join(process.cwd(), ".wa-numbers.json");

const DEFAULT_WA: WaNumber[] = [
  { id: "1", label: "Admin Utama",  number: "6281234567890", is_active: true, sort_order: 1 },
  { id: "2", label: "Admin Backup", number: "6281234567891", is_active: true, sort_order: 2 },
];

function readFile(): WaNumber[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return DEFAULT_WA;
    const buf = fs.readFileSync(DATA_FILE);
    let str: string;
    if (buf[0] === 0xFF && buf[1] === 0xFE) str = buf.slice(2).toString("utf16le");
    else if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) str = buf.slice(3).toString("utf-8");
    else str = buf.toString("utf-8");
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WA;
  } catch { return DEFAULT_WA; }
}

function writeFile(list: WaNumber[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), { encoding: "utf-8" });
  } catch (err) {
    console.warn("Failed to write to local file system (expected on Vercel):", err);
  }
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return url.startsWith("https://") && !url.includes("your-project") && key.length > 20 && !key.includes("your-service");
}

async function trySupabase<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

const noStore = { headers: { "Cache-Control": "no-store, max-age=0" } };

/* ── GET ?all=true → full list (admin), no param → round-robin active (frontend) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (isSupabaseConfigured()) {
    const result = await trySupabase(async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data, error } = await sb.from("wa_numbers").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      const list: WaNumber[] = data ?? [];
      if (all) return NextResponse.json({ list }, noStore);
      const active = list.filter((w) => w.is_active);
      if (!active.length) return NextResponse.json({ number: "6281234567890", label: "Admin" }, noStore);
      // round-robin via timestamp modulo
      const pick = active[Math.floor(Date.now() / 1000) % active.length];
      return NextResponse.json({ number: pick.number, label: pick.label, id: pick.id }, noStore);
    });
    if (result) return result;
  }

  // File fallback
  const list = readFile();
  if (all) return NextResponse.json({ list }, noStore);
  const active = list.filter((w) => w.is_active);
  if (!active.length) return NextResponse.json({ number: "6281234567890", label: "Admin" }, noStore);
  const pick = active[Math.floor(Date.now() / 1000) % active.length];
  return NextResponse.json({ number: pick.number, label: pick.label, id: pick.id }, noStore);
}

/* ── POST → save full list */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const list: WaNumber[] = body.list ?? [];

    if (isSupabaseConfigured()) {
      const ok = await trySupabase(async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        // Upsert each item (preserves UUIDs for existing, inserts new)
        for (const item of list) {
          const { error } = await sb.from("wa_numbers").upsert({
            id: item.id,
            label: item.label,
            number: item.number,
            is_active: item.is_active,
            sort_order: item.sort_order,
          });
          if (error) throw error;
        }
        // Remove deleted items (those not in current list)
        const ids = list.map((i) => i.id);
        if (ids.length > 0) {
          await sb.from("wa_numbers").delete().not("id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`);
        }
        return true;
      });
      if (ok) { 
        writeFile(list); 
        return NextResponse.json({ ok: true, storage: "supabase", saved: list.length }); 
      } else {
        throw new Error("Gagal menyimpan ke Supabase");
      }
    }

    writeFile(list);
    return NextResponse.json({ ok: true, storage: "file", saved: list.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
