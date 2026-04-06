import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const result = await query(
      "SELECT integration_type, status, validated_at, created_at FROM user_integrations WHERE user_id = $1",
      [session.user.id]
    );

    // Build a status map for each integration type
    const statusMap: Record<string, { status: string; validatedAt: string | null }> = {
      sevdesk: { status: "getrennt", validatedAt: null },
      mollie: { status: "getrennt", validatedAt: null },
    };

    for (const row of result.rows) {
      statusMap[row.integration_type] = {
        status: row.status,
        validatedAt: row.validated_at,
      };
    }

    return NextResponse.json({ integrations: statusMap });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Datenbankfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
