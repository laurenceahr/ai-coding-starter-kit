import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod/v4";

const disconnectSchema = z.object({
  type: z.enum(["sevdesk", "mollie"]),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = disconnectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungueltige Eingabe" },
      { status: 400 }
    );
  }

  try {
    await query(
      "DELETE FROM user_integrations WHERE user_id = $1 AND integration_type = $2",
      [session.user.id, parsed.data.type]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Datenbankfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
