import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface RunningTextConfig {
  enabled: boolean;
  items: RunningTextItem[];
  speed: number;       // 20-100, higher = faster
  bgColor: string;     // CSS color
  textColor: string;   // CSS color
  separator: string;   // symbol between items, e.g. "✦"
}

export interface RunningTextItem {
  id: string;
  text: string;
  emoji: string;
  active: boolean;
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

const DATA_FILE = path.join(process.cwd(), ".running-text.json");
const noStore = { headers: { "Cache-Control": "no-store, max-age=0" } };

function readFile(): RunningTextConfig {
  try {
    if (!fs.existsSync(DATA_FILE)) return DEFAULT;
    const str = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(str);
    return { ...DEFAULT, ...parsed, items: parsed.items ?? DEFAULT.items };
  } catch {
    return DEFAULT;
  }
}

function writeFile(data: RunningTextConfig) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), { encoding: "utf-8" });
  } catch (err) {
    console.warn("[RUNNING-TEXT] Failed to write file:", err);
  }
}

export async function GET() {
  return NextResponse.json({ config: readFile() }, noStore);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config: RunningTextConfig = { ...DEFAULT, ...body.config };
    writeFile(config);
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
