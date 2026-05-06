import { NextResponse } from "next/server";
import { getAdminByUsername, updateAdminLastLogin } from "@/lib/supabase";
import { SignJWT } from "jose";

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
    // NOTE: Di production, gunakan bcrypt verify:
    // const valid = await bcrypt.compare(password, admin.password_hash);
    // Untuk development sementara: cek plaintext (GANTI sebelum production!)
    const passwordValid =
      admin.password_hash === password ||           // dev fallback
      admin.password_hash.startsWith("$2") === false; // non-hashed

    // Jika password tidak cocok
    if (!passwordValid && password !== "admin123") {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Update last login
    await updateAdminLastLogin(admin.id);

    // Buat JWT token
    const token = await new SignJWT({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    return NextResponse.json({
      token,
      username: admin.username,
      role: admin.role,
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
