import type { Config } from "drizzle-kit";

const host = process.env.DATABASE_HOST;
const portRaw = process.env.DATABASE_PORT;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const database = process.env.DATABASE_NAME;

if (!host || !portRaw || !user || !database) {
  throw new Error(
    "DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME are required for drizzle-kit commands."
  );
}

const port = Number(portRaw);
if (!Number.isFinite(port)) throw new Error("DATABASE_PORT must be a number.");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
  },
  strict: true,
  verbose: true,
} satisfies Config;

