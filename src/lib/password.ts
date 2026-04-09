import bcrypt from "bcryptjs";

const DEFAULT_SALT_ROUNDS = 10;

export async function hashPassword(plain: string, saltRounds = DEFAULT_SALT_ROUNDS) {
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

