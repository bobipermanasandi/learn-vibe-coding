import { Elysia } from "elysia";
import { requireDb } from "../db/client";
import { users } from "../db/schema";

export const app = new Elysia()
  .get("/health", () => ({ ok: true }))
  .get("/api/users", async () => {
    const db = requireDb();
    const rows = await db.select().from(users).limit(50);
    return { data: rows };
  });

