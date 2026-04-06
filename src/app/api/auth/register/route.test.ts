import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true }),
}));

import { POST } from "./route";
import { query } from "@/lib/db";
import { hash } from "bcryptjs";

const mockedQuery = vi.mocked(query);
const mockedHash = vi.mocked(hash);

function createRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(createRequest({ email: "not-an-email", password: "12345678" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Ungueltige Eingabe");
  });

  it("returns 400 for password shorter than 8 chars", async () => {
    const res = await POST(createRequest({ email: "test@example.com", password: "short" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Ungueltige Eingabe");
  });

  it("returns 403 when a user already exists", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ count: "1" }] } as never);

    const res = await POST(createRequest({ email: "test@example.com", password: "12345678" }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("bereits ein Konto");
  });

  it("returns 200 with { success: true } for valid registration", async () => {
    // COUNT query returns 0
    mockedQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] } as never);
    // INSERT succeeds
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);

    const res = await POST(createRequest({ email: "test@example.com", password: "securepass" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 409 for duplicate email", async () => {
    // COUNT query returns 0
    mockedQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] } as never);
    // INSERT throws duplicate error
    mockedQuery.mockRejectedValueOnce(new Error("duplicate key value violates unique constraint"));

    const res = await POST(createRequest({ email: "test@example.com", password: "securepass" }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("bereits registriert");
  });

  it("hashes password and never stores plain text", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] } as never);
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);

    await POST(createRequest({ email: "test@example.com", password: "securepass" }));

    // Verify bcrypt hash was called with the plain password
    expect(mockedHash).toHaveBeenCalledWith("securepass", 12);

    // Verify the INSERT query received the hashed password, not plain text
    const insertCall = mockedQuery.mock.calls[1];
    const params = insertCall[1] as string[];
    expect(params).toContain("hashed_password");
    expect(params).not.toContain("securepass");
  });
});
