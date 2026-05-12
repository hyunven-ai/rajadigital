import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const db = createServerSupabase();
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error("Get products error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, game_name, price, amount, is_active, is_popular, sort_order, special_image } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ error: "Data produk tidak lengkap" }, { status: 400 });
    }

    const db = createServerSupabase();
    const { data, error } = await db
      .from("products")
      .insert({
        name, category, game_name: game_name ?? "Royal Dream",
        price, amount, is_active: is_active ?? true,
        is_popular: is_popular ?? false, sort_order: sort_order ?? 0,
        ...(special_image ? { special_image } : {}),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    console.error("Create product error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
