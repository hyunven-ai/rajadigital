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
      .select("id, username, display_name, email, role, is_active, last_login, created_at, permissions")
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
    const { username, email, password, role, display_name, permissions } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, dan password wajib diisi" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const db = createServerSupabase();

    // Cek duplikat username
    const { data: existingUsername } = await db
      .from("admins")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }

    // Cek duplikat email
    const { data: existingEmail } = await db
      .from("admins")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await db
      .from("admins")
      .insert({
        username,
        email,
        password_hash,
        role: role ?? "admin",
        display_name: display_name?.trim() || null,
        // Default OP/CS preset jika permissions tidak diberikan
        permissions: permissions ?? ["transactions", "transactions_history", "bongkar_chip", "bongkar_chip_history"],
        is_active: true,
      })
      .select("id, username, display_name, email, role, is_active, created_at, permissions")
      .single();

    if (error) throw error;
    return NextResponse.json({ admin: data }, { status: 201 });
  } catch (err: any) {
    console.error("Create admin error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
