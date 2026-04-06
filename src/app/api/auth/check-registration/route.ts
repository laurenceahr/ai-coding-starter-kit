import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query("SELECT COUNT(*) as count FROM users");
    const count = parseInt(result.rows[0].count, 10);

    // Only allow registration if no users exist
    return NextResponse.json({ allowed: count === 0 });
  } catch {
    // On error (e.g., table doesn't exist yet), allow registration for first-time setup
    return NextResponse.json({ allowed: true });
  }
}
