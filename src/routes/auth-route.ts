import { Elysia } from "elysia";
import { InvalidCredentialsError, loginUser } from "../services/auth-service";

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

export const authRoute = new Elysia().post("/api/login", async ({ body, set }) => {
  const payload = body as unknown;

  if (!payload || typeof payload !== "object") {
    set.status = 400;
    return { success: false, message: "Email atau password salah" };
  }

  const { email, password } = payload as Record<string, unknown>;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    set.status = 400;
    return { success: false, message: "Email atau password salah" };
  }

  try {
    const { token } = await loginUser({ email, password });
    return { success: true, message: "User berhasil login", data: token };
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      set.status = 401;
      return { success: false, message: "Email atau password salah" };
    }

    if (isDbNotConfiguredError(err)) {
      set.status = 503;
      return { success: false, message: "Service unavailable" };
    }

    set.status = 500;
    return { success: false, message: "Service unavailable" };
  }
});

