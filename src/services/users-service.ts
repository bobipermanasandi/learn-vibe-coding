import { requireDb } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../lib/password";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

/**
 * Error domain-level untuk kasus email sudah terdaftar.
 * Dipakai agar layer route bisa mengubahnya menjadi HTTP 409 tanpa bergantung pada detail error DB.
 */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("Email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

/**
 * Mendeteksi error duplikasi email dari MySQL (`ER_DUP_ENTRY` / errno 1062).
 * Implementasi ini juga meng-handle error yang terbungkus di `cause` (misalnya dari library/promise wrapper).
 */
function isDuplicateEmailError(err: unknown) {
  if (!err || typeof err !== "object") return false;

  const anyErr = err as {
    code?: unknown;
    errno?: unknown;
    cause?: unknown;
    message?: unknown;
  };

  const direct =
    anyErr.code === "ER_DUP_ENTRY" ||
    anyErr.errno === 1062 ||
    (typeof anyErr.message === "string" && anyErr.message.includes("ER_DUP_ENTRY"));

  if (direct) return true;

  const cause = anyErr.cause as { code?: unknown; errno?: unknown; message?: unknown } | undefined;
  if (!cause) return false;

  return (
    cause.code === "ER_DUP_ENTRY" ||
    cause.errno === 1062 ||
    (typeof cause.message === "string" && cause.message.includes("ER_DUP_ENTRY"))
  );
}

/**
 * Membuat user baru:
 * - normalisasi input (trim + lowercase email)
 * - hash password sebelum disimpan
 * - lempar `EmailAlreadyExistsError` jika email sudah dipakai
 */
export async function registerUser(input: RegisterUserInput) {
  const db = requireDb();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  try {
    await db.insert(users).values({
      name,
      email,
      password: passwordHash,
    });
  } catch (err) {
    if (isDuplicateEmailError(err)) throw new EmailAlreadyExistsError();
    throw err;
  }
}

