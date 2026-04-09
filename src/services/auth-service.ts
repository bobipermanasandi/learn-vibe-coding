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

