import { Elysia } from "elysia";
import { EmailAlreadyExistsError, registerUser } from "../services/users-service";
import { getCurrentUserByToken, logoutUserByToken } from "../services/auth-service";
import { requireDb } from "../db/client";
import { users } from "../db/schema";
import { parseBearerToken } from "../lib/auth";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isDbNotConfiguredError(err: unknown) {
  return (
    err instanceof Error &&
    err.message.includes("Database env is not set") &&
    err.message.includes("DATABASE_HOST")
  );
}

function isValidEmail(email: string) {
  // Simple pragmatic check (not RFC exhaustive)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const usersRoute = new Elysia()
  .get("/api/users", async () => {
    try {
      const db = requireDb();
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          created_at: users.createdAt,
        })
        .from(users)
        .limit(50);
      return { data: rows };
    } catch (err) {
      return { data: [], error: isDbNotConfiguredError(err) ? "db_not_configured" : "unknown" };
    }
  })
  .get("/api/users/current", async ({ headers, set }) => {
    const token = parseBearerToken(headers?.authorization);
    if (!token) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    try {
      const user = await getCurrentUserByToken(token);
      if (!user) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      return {
        success: true,
        message: "User yang sedang login",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt,
        },
      };
    } catch (err) {
      if (isDbNotConfiguredError(err)) {
        set.status = 503;
        return { success: false, message: "Service unavailable" };
      }

      set.status = 500;
      return { success: false, message: "Service unavailable" };
    }
  })
  .post("/api/users/logout", async ({ headers, set }) => {
    const token = parseBearerToken(headers?.authorization);
    if (!token) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    try {
      const ok = await logoutUserByToken(token);
      if (!ok) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      return { success: true, message: "User berhasil logout" };
    } catch (err) {
      if (isDbNotConfiguredError(err)) {
        set.status = 503;
        return { success: false, message: "Service unavailable" };
      }

      set.status = 500;
      return { success: false, message: "Service unavailable" };
    }
  })
  .post("/api/users", async ({ body, set }) => {
    const payload = body as unknown;

    if (!payload || typeof payload !== "object") {
      set.status = 400;
      return { success: false, message: "User baru gagal ditambahkan" };
    }

    const { name, email, password } = payload as Record<string, unknown>;

    if (!isNonEmptyString(name) || name.trim().length > 255) {
      set.status = 400;
      return { success: false, message: "User baru gagal ditambahkan" };
    }

    if (!isNonEmptyString(email) || email.trim().length > 255 || !isValidEmail(email.trim())) {
      set.status = 400;
      return { success: false, message: "User baru gagal ditambahkan" };
    }

    if (!isNonEmptyString(password) || password.length < 6) {
      set.status = 400;
      return { success: false, message: "User baru gagal ditambahkan" };
    }

    try {
      await registerUser({ name, email, password });
      set.status = 201;
      return { success: true, message: "User baru berhasil ditambahkan" };
    } catch (err) {
      if (err instanceof EmailAlreadyExistsError) {
        set.status = 409;
        return { success: false, message: "User baru gagal ditambahkan" };
      }

      if (isDbNotConfiguredError(err)) {
        set.status = 503;
        return { success: false, message: "User baru gagal ditambahkan" };
      }

      set.status = 500;
      return { success: false, message: "User baru gagal ditambahkan" };
    }
  });

