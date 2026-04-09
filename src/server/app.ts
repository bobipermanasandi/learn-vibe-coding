import { Elysia } from "elysia";
import { usersRoute } from "../routes/users-route";

export const app = new Elysia()
  .get("/health", () => ({ ok: true }))
  .use(usersRoute);

