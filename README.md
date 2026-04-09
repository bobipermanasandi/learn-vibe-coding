# learn-vibe-coding

Backend bootstrap menggunakan Bun + Elysia + Drizzle + MySQL.

## Setup

```bash
bun install
```

Copy env:

```bash
cp .env.example .env
```

Set `DATABASE_URL` di `.env` jika ingin memakai fitur DB.

## Run (dev)

```bash
bun run dev
```

## Healthcheck

```bash
curl http://localhost:3000/health
```
