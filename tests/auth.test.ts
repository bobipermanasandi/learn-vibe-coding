import { beforeEach, describe, expect, it } from "bun:test";
import { apiRequest, isDbReady, readJson, resetDb } from "./_helpers";

describe("Auth API", () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe("POST /api/login", () => {
    it("returns 400 for invalid payload", async () => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify("nope"),
      });
      expect(res.status).toBe(400);
      const json = await readJson(res);
      expect(json).toMatchObject({ success: false, message: "Email atau password salah" });
    });

    it("returns 400 for missing email/password", async () => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "", password: "" }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 503 when db not configured (valid-looking payload)", async () => {
      if (await isDbReady()) return;

      const res = await apiRequest("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "password" }),
      });
      // If env isn't set => 503. If env is set but DB isn't reachable/ready => might be 500.
      expect([500, 503]).toContain(res.status);
      const json = await readJson(res);
      expect(json).toMatchObject({ success: false, message: "Service unavailable" });
    });

    it("returns 401 for invalid credentials when db configured", async () => {
      if (!(await isDbReady())) return;

      const res = await apiRequest("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "password" }),
      });
      expect(res.status).toBe(401);
    });

    it("logs in after successful registration when db configured", async () => {
      if (!(await isDbReady())) return;

      const reg = await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "password" }),
      });
      expect(reg.status).toBe(201);

      const res = await apiRequest("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "password" }),
      });
      expect(res.status).toBe(200);
      const json = await readJson(res);
      expect(json).toMatchObject({ success: true, message: "User berhasil login" });
      expect(typeof json?.data).toBe("string");
      expect(json.data.length).toBeGreaterThan(10);
    });
  });

  describe("GET /api/users/current", () => {
    it("returns 401 without token", async () => {
      const res = await apiRequest("/api/users/current");
      expect(res.status).toBe(401);
      const json = await readJson(res);
      expect(json).toEqual({ success: false, message: "Unauthorized" });
    });

    it("returns 503 when db not configured (token provided)", async () => {
      if (await isDbReady()) return;

      const res = await apiRequest("/api/users/current", {
        headers: { authorization: "Bearer some-token" },
      });
      expect([500, 503]).toContain(res.status);
    });

    it("returns current user for valid session when db configured", async () => {
      if (!(await isDbReady())) return;

      await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "password" }),
      });

      const login = await apiRequest("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "password" }),
      });
      const loginJson = await readJson(login);
      const token = loginJson?.data as string;

      const res = await apiRequest("/api/users/current", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const json = await readJson(res);
      expect(json).toMatchObject({
        success: true,
        message: "User yang sedang login",
        data: { name: "A", email: "a@example.com" },
      });
    });
  });

  describe("POST /api/users/logout", () => {
    it("returns 401 without token", async () => {
      const res = await apiRequest("/api/users/logout", { method: "POST" });
      expect(res.status).toBe(401);
    });

    it("returns 503 when db not configured (token provided)", async () => {
      if (await isDbReady()) return;

      const res = await apiRequest("/api/users/logout", {
        method: "POST",
        headers: { authorization: "Bearer some-token" },
      });
      expect([500, 503]).toContain(res.status);
    });

    it("logs out valid session when db configured", async () => {
      if (!(await isDbReady())) return;

      await apiRequest("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A", email: "a@example.com", password: "password" }),
      });

      const login = await apiRequest("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "password" }),
      });
      const loginJson = await readJson(login);
      const token = loginJson?.data as string;

      const logout = await apiRequest("/api/users/logout", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(logout.status).toBe(200);
      const logoutJson = await readJson(logout);
      expect(logoutJson).toEqual({ success: true, message: "User berhasil logout" });

      const current = await apiRequest("/api/users/current", {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(current.status).toBe(401);
    });
  });
});

