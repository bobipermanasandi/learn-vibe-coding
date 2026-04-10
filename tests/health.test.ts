import { describe, expect, it } from "bun:test";
import { apiRequest, readJson } from "./_helpers";

describe("GET /health", () => {
  it("returns ok: true", async () => {
    const res = await apiRequest("/health");
    expect(res.status).toBe(200);
    const json = await readJson(res);
    expect(json).toEqual({ ok: true });
  });
});

