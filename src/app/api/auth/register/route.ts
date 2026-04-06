import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.email("Bitte geben Sie eine gueltige E-Mail-Adresse ein"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const result = rateLimit(`register:${ip}`, 3, 15 * 60 * 1000); // 3 attempts per 15 min
  if (!result.success) {
    return NextResponse.json(
      { error: `Zu viele Versuche. Bitte versuchen Sie es in ${result.retryAfterSeconds} Sekunden erneut.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Eingabe", details: parsed.error.issues },
      { status: 400 }
    );
  }

  // Check if any user already exists (single-user system)
  try {
    const countResult = await query("SELECT COUNT(*) as count FROM users");
    const count = parseInt(countResult.rows[0].count, 10);

    if (count > 0) {
      return NextResponse.json(
        { error: "Es existiert bereits ein Konto. Nur ein einzelnes Konto ist erlaubt." },
        { status: 403 }
      );
    }
  } catch {
    // Table might not exist yet — proceed with registration
  }

  const { email, password } = parsed.data;
  const passwordHash = await hash(password, 12);
  const id = randomUUID();

  try {
    await query(
      "INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, NOW())",
      [id, email, passwordHash]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Datenbankfehler";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
