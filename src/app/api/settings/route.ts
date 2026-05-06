import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface SiteSettings {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  ga_script: string;
  pixel_script: string;
  widget_script: string;
  // Contact widget buttons
  wa_widget_number: string;     // WA floating button number (for customers)
  wa_widget_label: string;      // e.g. "Chat Admin"
  wa_widget_enabled: boolean;
  wa2_widget_number: string;    // Second WA floating button
  wa2_widget_label: string;
  wa2_widget_enabled: boolean;
  tg_widget_username: string;   // Telegram username e.g. "rajadigital"
  tg_widget_label: string;      // e.g. "Join Telegram"
  tg_widget_enabled: boolean;
}

const DEFAULT: SiteSettings = {
  meta_title: "RAJA DIGITAL — Top-Up Royal Dream",
  meta_description: "Platform top-up game terpercaya dengan harga terbaik.",
  meta_keywords: "top up, royal dream, diamond, koin, uc, game",
  ga_script: "",
  pixel_script: "",
  widget_script: "",
  wa_widget_number: "",
  wa_widget_label: "Chat Admin",
  wa_widget_enabled: false,
  wa2_widget_number: "",
  wa2_widget_label: "Chat Admin 2",
  wa2_widget_enabled: false,
  tg_widget_username: "",
  tg_widget_label: "Telegram",
  tg_widget_enabled: false,
};

const DATA_FILE = path.join(process.cwd(), ".site-settings.json");

function readFile(): SiteSettings {
  try {
    if (!fs.existsSync(DATA_FILE)) return DEFAULT;
    const buf = fs.readFileSync(DATA_FILE);
    let str: string;
    if (buf[0] === 0xFF && buf[1] === 0xFE) str = buf.slice(2).toString("utf16le");
    else if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) str = buf.slice(3).toString("utf-8");
    else str = buf.toString("utf-8");
    return { ...DEFAULT, ...JSON.parse(str) };
  } catch { return DEFAULT; }
}

function writeFile(data: SiteSettings) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), { encoding: "utf-8" });
  } catch (err) {
    console.warn("Failed to write to local file system (expected on Vercel):", err);
  }
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return url.startsWith("https://") && !url.includes("your-project") && key.length > 20 && !key.includes("your-service");
}

const noStore = { headers: { "Cache-Control": "no-store, max-age=0" } };

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (data) return NextResponse.json({ settings: { ...DEFAULT, ...data } }, noStore);
    } catch { /* fall through */ }
  }
  return NextResponse.json({ settings: readFile() }, noStore);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings: SiteSettings = { ...DEFAULT, ...body.settings };

    if (isSupabaseConfigured()) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error } = await sb.from("site_settings").upsert({ id: 1, ...settings });
        if (error) {
          // Column mungkin belum ada di Supabase — fallback ke known-safe fields only
          console.warn("[SETTINGS POST] Supabase upsert failed, trying safe-fields only:", error.message);
          const safeFields = {
            id: 1,
            meta_title: settings.meta_title,
            meta_description: settings.meta_description,
            meta_keywords: settings.meta_keywords,
            ga_script: settings.ga_script,
            pixel_script: settings.pixel_script,
            widget_script: settings.widget_script,
            wa_widget_number: settings.wa_widget_number,
            wa_widget_label: settings.wa_widget_label,
            wa_widget_enabled: settings.wa_widget_enabled,
            tg_widget_username: settings.tg_widget_username,
            tg_widget_label: settings.tg_widget_label,
            tg_widget_enabled: settings.tg_widget_enabled,
          };
          const { error: err2 } = await sb.from("site_settings").upsert(safeFields);
          if (err2) {
            // Both failed — save to file only
            console.error("[SETTINGS POST] Safe-fields also failed, saving to file:", err2.message);
            writeFile(settings);
            revalidatePath("/", "layout");
            return NextResponse.json({ ok: true, storage: "file", warning: "Supabase columns missing — run migration. Data saved locally." });
          }
        }
        writeFile(settings);
        revalidatePath("/", "layout");
        return NextResponse.json({ ok: true, storage: "supabase" });
      } catch (err) {
        // Unexpected error — still save to file so user doesn't lose data
        console.error("[SETTINGS POST error]", err);
        writeFile(settings);
        revalidatePath("/", "layout");
        return NextResponse.json({ ok: true, storage: "file", warning: "Supabase error — saved locally only." });
      }
    }

    writeFile(settings);
    return NextResponse.json({ ok: true, storage: "file" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
