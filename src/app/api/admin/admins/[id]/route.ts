import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// PATCH  /api/admin/admins/[id]  — update role / status / password
// DELETE /api/admin/admins/[id]  — delete admin

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body   = await req.json();
    if (body.role) {
      body.role = String(body.role).toLowerCase();
    }
    const db     = createServerSupabase();

    // Kalau ada password baru, hash dulu
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      body.password_hash = await bcrypt.hash(body.password, 10);
      delete body.password;
    }

    const { data, error } = await db
      .from("admins")
      .update(body)
      .eq("id", id)
      .select("id, username, display_name, email, role, is_active, created_at, permissions")
      .single();

    if (error) throw error;
    return NextResponse.json({ admin: data });
  } catch (err) {
    console.error("Update admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db     = createServerSupabase();

    const { error } = await db.from("admins").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
