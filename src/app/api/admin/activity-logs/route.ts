import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") ?? "";
    const limit  = parseInt(searchParams.get("limit") ?? "50");

    const db = createServerSupabase();
    let query = db
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) query = query.eq("action", action);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ logs: data ?? [] });
  } catch (err) {
    console.error("Activity logs error:", err);
    return NextResponse.json({ logs: [] });
  }
}
