import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface RunningTextItem {
  id: string;
  text: string;
  emoji: string;
  active: boolean;
}

export interface RunningTextConfig {
  enabled: boolean;
  items: RunningTextItem[];
  speed: number;
  bgColor: string;
  textColor: string;
  separator: string;
}

const DEFAULT: RunningTextConfig = {
  enabled: true,
  items: [
    { id: "1", text: "Top-up Cepat & Aman — Proses Otomatis 24 Jam!", emoji: "⚡", active: true },
    { id: "2", text: "Harga Terjangkau — Diamond, Koin, UC & Lebih Banyak Lagi!", emoji: "💎", active: true },
    { id: "3", text: "Layanan Pelanggan Siap Membantu via WhatsApp", emoji: "💬", active: true },
    { id: "4", text: "Promo Spesial Member Setia — Cek Pricelist Kami!", emoji: "🎁", active: true },
  ],
  speed: 40,
  bgColor: "linear-gradient(90deg, var(--gold) 0%, var(--amber) 100%)",
  textColor: "#0a0a14",
  separator: "✦",
};

const SETTING_KEY = "running_text_config";
const noStore = { headers: { "Cache-Control": "no-store, max-age=0" } };

async function readConfig(): Promise<RunningTextConfig> {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("site_settings")
      .select("value")
      .eq("key", SETTING_KEY)
      .maybeSingle();

    if (error || !data) return DEFAULT;
    const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return { ...DEFAULT, ...parsed, items: parsed.items ?? DEFAULT.items };
  } catch {
    return DEFAULT;
  }
}

async function writeConfig(config: RunningTextConfig): Promise<{ ok: boolean; detail?: string }> {
  try {
    const db = createServerSupabase();
    const value = JSON.stringify(config);

    // 1. Cek apakah row sudah ada
    const { data: existing, error: checkErr } = await db
      .from("site_settings")
      .select("key")
      .eq("key", SETTING_KEY)
      .maybeSingle();

    if (checkErr) {
      return { ok: false, detail: `CHECK error: ${JSON.stringify(checkErr)}` };
    }

    if (existing) {
      // 2a. Row ada → UPDATE
      const { error: updateErr } = await db
        .from("site_settings")
        .update({ value })
        .eq("key", SETTING_KEY);

      if (updateErr) {
        return { ok: false, detail: `UPDATE error: ${JSON.stringify(updateErr)}` };
      }
    } else {
      // 2b. Row belum ada → INSERT
      const { error: insertErr } = await db
        .from("site_settings")
        .insert({ key: SETTING_KEY, value });

      if (insertErr) {
        return { ok: false, detail: `INSERT error: ${JSON.stringify(insertErr)}` };
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, detail: `Exception: ${String(err)}` };
  }
}

export async function GET() {
  const config = await readConfig();
  return NextResponse.json({ config }, noStore);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config: RunningTextConfig = { ...DEFAULT, ...body.config };
    const result = await writeConfig(config);
    if (!result.ok) {
      console.error("[RUNNING-TEXT] Save failed:", result.detail);
      return NextResponse.json(
        { ok: false, error: result.detail ?? "Gagal menyimpan ke database." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
