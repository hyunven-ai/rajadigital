import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// GET  /api/admin/admins        — list all admins
// POST /api/admin/admins        — create new admin

export async function GET() {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("admins")
      .select("id, username, email, role, is_active, last_login, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ admins: data ?? [] });
  } catch (err) {
    console.error("Get admins error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, role } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, dan password wajib diisi" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const db = createServerSupabase();

    // Cek duplikat username
    const { data: existing } = await db
      .from("admins")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await db
      .from("admins")
      .insert({ username, email, password_hash, role: role ?? "admin", is_active: true })
      .select("id, username, email, role, is_active, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ admin: data }, { status: 201 });
  } catch (err) {
    console.error("Create admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
