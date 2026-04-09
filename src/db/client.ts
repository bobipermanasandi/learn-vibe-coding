import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../config/env";

const hasDbEnv =
  !!env.DATABASE_HOST &&
  !!env.DATABASE_USER &&
  typeof env.DATABASE_PORT === "number" &&
  !!env.DATABASE_NAME;

export const pool = hasDbEnv
  ? mysql.createPool({
      host: env.DATABASE_HOST!,
      port: env.DATABASE_PORT!,
      user: env.DATABASE_USER!,
      password: env.DATABASE_PASSWORD,
      database: env.DATABASE_NAME!,
    })
  : null;
export const db = pool ? drizzle(pool) : null;

export function requireDb() {
  if (!db) {
    throw new Error(
      "Database env is not set. Set DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME to use database features."
    );
  }
  return db;
}

