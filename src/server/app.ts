import { Elysia } from "elysia";
import { usersRoute } from "../routes/users-route";
import { authRoute } from "../routes/auth-route";

export const app = new Elysia()
  .get("/health", () => ({ ok: true }))
  .use(usersRoute)
  .use(authRoute);

