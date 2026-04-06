import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

// Wrap POST to add rate limiting on sign-in attempts
async function rateLimitedPost(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  // Check if this is a credentials sign-in (callback/credentials)
  const url = new URL(request.url);
  const isSignIn = url.pathname.includes("callback/credentials");

  if (isSignIn) {
    const result = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 min
    if (!result.success) {
      return NextResponse.json(
        {
          error: `Zu viele Anmeldeversuche. Bitte versuchen Sie es in ${result.retryAfterSeconds} Sekunden erneut.`,
        },
        { status: 429 }
      );
    }
  }

  return handler(request);
}

export { handler as GET, rateLimitedPost as POST };
