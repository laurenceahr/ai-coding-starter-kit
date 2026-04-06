import { NextResponse } from "next/server";

// NextAuth handles signout via /api/auth/signout
// This route is kept for backwards compatibility
export async function POST() {
  return NextResponse.json({ success: true });
}
