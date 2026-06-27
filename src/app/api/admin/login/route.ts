import { NextResponse } from "next/server";
import { getAdminByUsername, updateAdminLastLogin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "rajadigital-secret-change-in-production"
);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil admin dari Supabase
    const admin = await getAdminByUsername(username);

    if (!admin) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Verifikasi password
    let passwordValid = false;

    if (admin.password_hash.startsWith("$2")) {
      // Jika hash valid bcrypt, gunakan compare
      passwordValid = await bcrypt.compare(password, admin.password_hash);
    } else {
      // Fallback sementara jika database masih plaintext (sebelum di-migrate penuh)
      passwordValid = admin.password_hash === password;
    }

    // Jika password tidak cocok
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Update last login
    await updateAdminLastLogin(admin.id);

    // Ambil display_name dari DB (getAdminByUsername mungkin belum include field ini)
    const db = createServerSupabase();
    const { data: adminFull } = await db
      .from("admins")
      .select("display_name, permissions")
      .eq("id", admin.id)
      .maybeSingle();
    const displayName = adminFull?.display_name || admin.username;
    const permissions: string[] | null = adminFull?.permissions ?? null;

    // Buat JWT token
    const token = await new SignJWT({
      id: admin.id,
      username: admin.username,
      display_name: displayName,
      role: admin.role,
      permissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    return NextResponse.json({
      token,
      username: admin.username,
      display_name: displayName,
      role: admin.role,
      permissions,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    // Fallback untuk development jika Supabase belum dikonfigurasi
    const { username, password } = await req.json().catch(() => ({}));
    if (username === "admin" && password === "admin123") {
      return NextResponse.json({
        token: "dev-token",
        username: "admin",
        role: "superadmin",
      });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
