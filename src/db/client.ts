import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../config/env";

export const pool = env.DATABASE_URL ? mysql.createPool(env.DATABASE_URL) : null;
export const db = pool ? drizzle(pool) : null;

export function requireDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not set. Set it in your environment to use database features."
    );
  }
  return db;
}

