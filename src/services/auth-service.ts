import { eq } from "drizzle-orm";
import { requireDb } from "../db/client";
import { sessions, users } from "../db/schema";
import { verifyPassword } from "../lib/password";

export type LoginUserInput = {
  email: string;
  password: string;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

export async function loginUser(input: LoginUserInput): Promise<{ token: string }> {
  const email = isNonEmptyString(input.email) ? input.email.trim().toLowerCase() : "";
  const password = isNonEmptyString(input.password) ? input.password : "";

  if (!email || email.length > 255) throw new InvalidCredentialsError();
  if (!password || password.length < 6) throw new InvalidCredentialsError();

  const db = requireDb();

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) throw new InvalidCredentialsError();

  const ok = await verifyPassword(password, user.password);
  if (!ok) throw new InvalidCredentialsError();

  const token = crypto.randomUUID();
  await db.insert(sessions).values({ token, userId: user.id });

  return { token };
}

export async function getCurrentUserByToken(token: string): Promise<CurrentUser | null> {
  const t = typeof token === "string" ? token.trim() : "";
  if (!t) return null;

  const db = requireDb();

  const sessionRows = await db.select().from(sessions).where(eq(sessions.token, t)).limit(1);
  const session = sessionRows[0];
  if (!session?.userId) return null;

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userRows[0];
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function logoutUserByToken(token: string): Promise<boolean> {
  const t = typeof token === "string" ? token.trim() : "";
  if (!t) return false;

  const db = requireDb();
  const result = await db.delete(sessions).where(eq(sessions.token, t));
  const affectedRows =
    (result as unknown as { affectedRows?: number })?.affectedRows ??
    (Array.isArray(result) ? (result[0] as { affectedRows?: number } | undefined)?.affectedRows : undefined) ??
    0;
  return affectedRows > 0;
}
