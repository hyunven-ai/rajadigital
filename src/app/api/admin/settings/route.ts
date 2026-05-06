import { NextRequest, NextResponse } from "next/server";
import { getSeoSettings, updateSeoSettings } from "@/lib/supabase";
import { getAllWaNumbers, upsertWaNumber, deleteWaNumber, toggleWaNumber } from "@/lib/supabase";

export async function GET() {
  try {
    const [seo, waNumbers] = await Promise.all([getSeoSettings(), getAllWaNumbers()]);
    return NextResponse.json({ seo, waNumbers });
  } catch (err) {
    console.error("Get settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...payload } = body;

    if (type === "seo") {
      await updateSeoSettings(payload);
      return NextResponse.json({ success: true });
    }

    if (type === "wa_add") {
      const { label, number } = payload;
      if (!label || !number) {
        return NextResponse.json({ error: "Label dan nomor wajib diisi" }, { status: 400 });
      }
      await upsertWaNumber({ label, number, is_active: true, sort_order: payload.sort_order ?? 99 });
      return NextResponse.json({ success: true });
    }

    if (type === "wa_toggle") {
      await toggleWaNumber(payload.id, payload.is_active);
      return NextResponse.json({ success: true });
    }

    if (type === "wa_delete") {
      await deleteWaNumber(payload.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tipe operasi tidak dikenal" }, { status: 400 });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
