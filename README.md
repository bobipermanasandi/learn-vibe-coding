# learn-vibe-coding

Backend bootstrap menggunakan Bun + Elysia + Drizzle + MariaDB.

## Setup

```bash
bun install
```

Copy env:

```bash
cp .env.example .env
```

Set `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` di `.env` jika ingin memakai fitur DB.

## Run (dev)

```bash
bun run dev
```

## Healthcheck

```bash
curl http://localhost:3000/health
```
