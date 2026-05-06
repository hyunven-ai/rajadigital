import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface ColorTheme {
  id: string;
  name: string;
  gold: string;
  goldDark: string;
  goldLight: string;
  purple: string;
  purpleDark: string;
  purpleLight: string;
  amber: string;
  amberLight: string;
  bgPrimaryDark: string;
  bgSecondaryDark: string;
  bgCardDark: string;
}

const DEFAULT_THEME: ColorTheme = {
  id: "royal-gold",
  name: "Royal Gold (Default)",
  gold: "#c8961a",
  goldDark: "#9e720f",
  goldLight: "#f5c842",
  purple: "#6d28d9",
  purpleDark: "#4c1d95",
  purpleLight: "#8b5cf6",
  amber: "#d4780d",
  amberLight: "#ff9f1c",
  bgPrimaryDark: "#0a0a14",
  bgSecondaryDark: "#12111f",
  bgCardDark: "#1a1828",
};

const DATA_FILE = path.join(process.cwd(), ".site-theme.json");
const noStore = { headers: { "Cache-Control": "no-store, max-age=0" } };

function readFile(): ColorTheme {
  try {
    if (!fs.existsSync(DATA_FILE)) return DEFAULT_THEME;
    const str = fs.readFileSync(DATA_FILE, "utf-8");
    return { ...DEFAULT_THEME, ...JSON.parse(str) };
  } catch {
    return DEFAULT_THEME;
  }
}

function writeFile(data: ColorTheme) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), { encoding: "utf-8" });
  } catch (err) {
    console.warn("[THEME] Failed to write theme file:", err);
  }
}

export async function GET() {
  return NextResponse.json({ theme: readFile() }, noStore);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const theme: ColorTheme = { ...DEFAULT_THEME, ...body.theme };
    writeFile(theme);
    return NextResponse.json({ ok: true, theme });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
