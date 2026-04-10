import { beforeEach, describe, expect, it } from "bun:test";
import { apiRequest, isDbReady, readJson, resetDb } from "./_helpers";

describe("/api/users", () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe("GET /api/users", () => {
    it("returns empty list when db not configured", async () => {
      if (await isDbReady()) return;

      const res = await apiRequest("/api/users");
      expect(res.status).toBe(200);
      const json = await readJson(res);
      // When DB env isn't set, route returns db_not_configured.
      // When DB env is set but DB/schema isn't ready, it returns unknown.
      expect(json).toMatchObject({ data: [] });
      expect(["db_not_configured", "unknown", undefined]).toContain(json?.error);
    });

    it("returns list of users when db configured", async () => {
      if (!(await isDbReady())) return;

      await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "password" }),
      });

      const res = await apiRequest("/api/users");
      expect(res.status).toBe(200);
      const json = await readJson(res);
      expect(Array.isArray(json?.data)).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0]).toMatchObject({ name: "A", email: "a@example.com" });
    });
  });

  describe("POST /api/users", () => {
    it("fails on invalid payload (non-object)", async () => {
      const res = await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify("nope"),
      });
      expect(res.status).toBe(400);
      const json = await readJson(res);
      expect(json).toMatchObject({ success: false });
    });

    it("fails on invalid email", async () => {
      const res = await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "invalid", password: "password" }),
      });
      expect(res.status).toBe(400);
      const json = await readJson(res);
      expect(json).toMatchObject({ success: false });
    });

    it("fails on short password", async () => {
      const res = await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "123" }),
      });
      expect(res.status).toBe(400);
      const json = await readJson(res);
      expect(json).toMatchObject({ success: false });
    });

    it("returns 503 when db not configured", async () => {
      if (await isDbReady()) return;

      const res = await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "password" }),
      });
      // If env isn't set => 503 (caught as db_not_configured).
      // If env is set but DB isn't reachable/ready => might be 500.
      expect([500, 503]).toContain(res.status);
    });

    it("creates user when db configured", async () => {
      if (!(await isDbReady())) return;

      const res = await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "password" }),
      });
      expect(res.status).toBe(201);
      const json = await readJson(res);
      expect(json).toEqual({ success: true, message: "User baru berhasil ditambahkan" });
    });

    it("rejects duplicate email when db configured", async () => {
      if (!(await isDbReady())) return;

      await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "password" }),
      });

      const res2 = await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "B", email: "a@example.com", password: "password" }),
      });
      expect(res2.status).toBe(409);
      const json2 = await readJson(res2);
      expect(json2).toMatchObject({ success: false });
    });
  });
});

