import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoute } from "../routes/users-route";
import { authRoute } from "../routes/auth-route";

export const app = new Elysia()
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "belajar-vibe-coding API",
          version: "1.0.0",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    })
  )
  .get("/health", () => ({ ok: true }), {
    detail: {
      tags: ["App"],
      summary: "Health check",
      responses: {
        200: {
          description: "Server is healthy",
          content: {
            "application/json": {
              schema: t.Object({
                ok: t.Boolean(),
              }),
            },
          },
        },
      },
    },
  })
  .use(usersRoute)
  .use(authRoute);

