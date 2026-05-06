import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// PATCH /api/admin/products/bulk — bulk update status
// DELETE /api/admin/products/bulk — bulk delete

export async function PATCH(req: NextRequest) {
  try {
    const { ids, updates } = await req.json() as {
      ids: string[];
      updates: Record<string, unknown>;
    };

    if (!ids?.length) {
      return NextResponse.json({ error: "Tidak ada produk dipilih" }, { status: 400 });
    }

    const db = createServerSupabase();
    const { error } = await db
      .from("products")
      .update(updates)
      .in("id", ids);

    if (error) throw error;
    return NextResponse.json({ success: true, affected: ids.length });
  } catch (err) {
    console.error("Bulk update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };

    if (!ids?.length) {
      return NextResponse.json({ error: "Tidak ada produk dipilih" }, { status: 400 });
    }

    const db = createServerSupabase();
    const { error } = await db
      .from("products")
      .delete()
      .in("id", ids);

    if (error) throw error;
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error("Bulk delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
