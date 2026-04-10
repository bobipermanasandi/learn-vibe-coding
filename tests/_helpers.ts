import { app } from "../src/server/app";
import { pool } from "../src/db/client";

let dbReadyCache: Promise<boolean> | null = null;

async function computeDbReady() {
  if (!pool) return false;
  try {
    // Ensure database exists and schema is migrated.
    await pool.query("SELECT 1");
    const [rows] = await pool.query("SHOW TABLES LIKE 'users'");
    const anyRows = Array.isArray(rows) ? rows.length > 0 : !!rows;
    if (!anyRows) return false;

    const [rows2] = await pool.query("SHOW TABLES LIKE 'sessions'");
    const anyRows2 = Array.isArray(rows2) ? rows2.length > 0 : !!rows2;
    return anyRows2;
  } catch {
    return false;
  }
}

export async function isDbReady() {
  dbReadyCache ??= computeDbReady();
  return await dbReadyCache;
}

export async function resetDb() {
  if (!(await isDbReady())) return;

  try {
    // Order matters because sessions references users
    await pool!.query("DELETE FROM sessions");
    await pool!.query("DELETE FROM users");

    // Optional: keep IDs deterministic across tests
    await pool!.query("ALTER TABLE sessions AUTO_INCREMENT = 1");
    await pool!.query("ALTER TABLE users AUTO_INCREMENT = 1");
  } catch {
    // If DB is reachable but schema isn't ready, avoid failing all tests.
  }
}

export async function apiRequest(path: string, init?: RequestInit) {
  const url = new URL(path, "http://localhost");
  const req = new Request(url, init);
  return await app.handle(req);
}

export async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { __raw: text };
  }
}

