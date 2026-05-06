import { NextRequest, NextResponse } from "next/server";
import { getTransactionByQuery } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params;
    const decoded = decodeURIComponent(query).trim();

    if (!decoded || decoded.length < 3) {
      return NextResponse.json(
        { error: "Query terlalu pendek" },
        { status: 400 }
      );
    }

    const transaction = await getTransactionByQuery(decoded);

    if (!transaction) {
      return NextResponse.json({ transaction: null }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (err) {
    console.error("Transaction lookup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
