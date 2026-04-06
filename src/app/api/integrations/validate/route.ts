import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod/v4";

const validateSchema = z.object({
  type: z.enum(["sevdesk", "mollie"]),
  token: z.string().min(1, "Token ist erforderlich"),
});

async function testSevdeskToken(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://my.sevdesk.de/api/v1/Contact?limit=1", {
      headers: { Authorization: token },
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: "Token wurde von sevdesk abgelehnt. Bitte generieren Sie einen neuen Token in Ihren sevdesk-Einstellungen." };
    return { ok: false, error: `sevdesk API Fehler: ${res.status}` };
  } catch {
    return { ok: false, error: "sevdesk API ist nicht erreichbar. Token wurde gespeichert aber nicht verifiziert." };
  }
}

async function testMollieToken(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.mollie.com/v2/organizations/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: "Token wurde von Mollie abgelehnt. Bitte pruefen Sie Ihren Organization Access Token." };
    return { ok: false, error: `Mollie API Fehler: ${res.status}` };
  } catch {
    return { ok: false, error: "Mollie API ist nicht erreichbar. Token wurde gespeichert aber nicht verifiziert." };
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = validateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Eingabe", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { type, token } = parsed.data;

  // Test the token against the external API
  const testResult = type === "sevdesk"
    ? await testSevdeskToken(token)
    : await testMollieToken(token);

  // If the API explicitly rejected the token, don't save it
  if (!testResult.ok && !testResult.error?.includes("nicht erreichbar")) {
    return NextResponse.json(
      { success: false, status: "ungueltig", error: testResult.error },
      { status: 400 }
    );
  }

  const newStatus = testResult.ok ? "verbunden" : "nicht_verifiziert";

  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    return NextResponse.json(
      { error: "Server-Konfigurationsfehler: Verschluesselungs-Key fehlt. Bitte TOKEN_ENCRYPTION_KEY in den Umgebungsvariablen setzen." },
      { status: 500 }
    );
  }

  // Upsert the integration (one row per type per user)
  try {
    await query(
      `INSERT INTO user_integrations (user_id, integration_type, token_value, status, validated_at, updated_at)
       VALUES ($1, $2, pgp_sym_encrypt($3, $6), $4, $5, NOW())
       ON CONFLICT (user_id, integration_type)
       DO UPDATE SET token_value = pgp_sym_encrypt($3, $6), status = $4, validated_at = $5, updated_at = NOW()`,
      [
        session.user.id,
        type,
        token,
        newStatus,
        testResult.ok ? new Date().toISOString() : null,
        process.env.TOKEN_ENCRYPTION_KEY,
      ]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Datenbankfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    warning: !testResult.ok ? testResult.error : undefined,
  });
}
