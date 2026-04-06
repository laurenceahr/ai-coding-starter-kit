import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { POST } from "./route";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";

const mockedQuery = vi.mocked(query);
const mockedGetServerSession = vi.mocked(getServerSession);

function createRequest(body: unknown) {
  return new Request("http://localhost/api/integrations/validate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/integrations/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
  });

  it("returns 401 without session", async () => {
    mockedGetServerSession.mockResolvedValueOnce(null);

    const res = await POST(createRequest({ type: "sevdesk", token: "test-token" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Nicht authentifiziert");
  });

  it("returns 400 for invalid input (missing type)", async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: "user-1" } } as never);

    const res = await POST(createRequest({ token: "test-token" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Ungueltige Eingabe");
  });

  it("returns 400 for invalid input (missing token)", async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: "user-1" } } as never);

    const res = await POST(createRequest({ type: "sevdesk" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Ungueltige Eingabe");
  });

  it("returns 400 when external API rejects token (401)", async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: "user-1" } } as never);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 })
    );

    const res = await POST(createRequest({ type: "sevdesk", token: "bad-token" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe("ungueltig");
    expect(json.error).toContain("abgelehnt");

    // Verify the token was NOT saved to the database
    expect(mockedQuery).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('returns 200 with status "verbunden" when token is valid', async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: "user-1" } } as never);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    );
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);

    const res = await POST(createRequest({ type: "sevdesk", token: "valid-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe("verbunden");
    expect(json.warning).toBeUndefined();

    fetchSpy.mockRestore();
  });

  it('returns 200 with status "nicht_verifiziert" and warning when API is unreachable', async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: "user-1" } } as never);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("fetch failed")
    );
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);

    const res = await POST(createRequest({ type: "sevdesk", token: "some-token" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe("nicht_verifiziert");
    expect(json.warning).toBeDefined();
    expect(json.warning).toContain("nicht erreichbar");

    fetchSpy.mockRestore();
  });

  it("never saves token in plain text (uses pgp_sym_encrypt in query)", async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: "user-1" } } as never);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    );
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);

    await POST(createRequest({ type: "sevdesk", token: "secret-token" }));

    // Verify the SQL query uses pgp_sym_encrypt
    expect(mockedQuery).toHaveBeenCalledTimes(1);
    const sqlQuery = mockedQuery.mock.calls[0][0] as string;
    expect(sqlQuery).toContain("pgp_sym_encrypt");

    fetchSpy.mockRestore();
  });
});
