import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

import { GET } from "./route";
import { query } from "@/lib/db";

const mockedQuery = vi.mocked(query);

describe("GET /api/auth/check-registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { allowed: true } when no users exist", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] } as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.allowed).toBe(true);
  });

  it("returns { allowed: false } when users exist", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ count: "1" }] } as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.allowed).toBe(false);
  });

  it("returns { allowed: true } on DB error (graceful fallback)", async () => {
    mockedQuery.mockRejectedValueOnce(new Error("relation \"users\" does not exist"));

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.allowed).toBe(true);
  });
});
