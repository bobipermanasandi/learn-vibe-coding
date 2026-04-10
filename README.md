# belajar-vibe-coding

Backend sederhana untuk belajar “vibe coding” dengan **Bun + Elysia** (HTTP API) dan **Drizzle ORM + MariaDB/MySQL** (database).

## Technology stack

- **Runtime**: Bun
- **Web framework**: Elysia
- **Database**: MariaDB / MySQL
- **ORM + migrations**: Drizzle ORM + drizzle-kit (output migrations di folder `drizzle/`)
- **Password hashing**: bcryptjs

## Struktur folder (arsitektur)

- `src/index.ts`: entrypoint server (listen pada `PORT`)
- `src/server/app.ts`: inisialisasi Elysia app dan register routes
- `src/routes/*-route.ts`: definisi endpoint HTTP (controller layer)
- `src/services/*.ts`: business logic (service layer)
- `src/db/schema.ts`: definisi schema tabel Drizzle
- `src/db/client.ts`: inisialisasi koneksi pool MySQL dan helper `requireDb()`
- `src/config/env.ts`: parsing environment variables
- `src/lib/*`: helper util (auth header parsing, hash/verify password)
- `drizzle/`: SQL migrations yang di-generate drizzle-kit
- `tests/`: test suite `bun test` (beberapa test butuh DB siap)

## Setup project

Install dependencies:

```bash
bun install
```

Siapkan environment variables:

```bash
cp .env.example .env
```

Minimal env:

- `PORT` (default 3000 kalau tidak diset)

Untuk fitur database (required):

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

## Database

Project ini menggunakan schema Drizzle di `src/db/schema.ts` dan migrations SQL di `drizzle/`.

### Schema (ringkas)

#### Table `users`

- `id` (int, PK, auto increment)
- `name` (varchar(255), not null)
- `email` (varchar(255), not null, unique)
- `password` (varchar(255), not null) — hash dari bcrypt
- `created_at` (datetime, default `CURRENT_TIMESTAMP`)

#### Table `sessions`

- `id` (int, PK, auto increment)
- `token` (varchar(255), not null, unique)
- `user_id` (int, FK → `users.id`, nullable)
- `created_at` (datetime, default `CURRENT_TIMESTAMP`)
- index: `sessions_user_id_idx (user_id)`

Relasi:

- **1 user** dapat memiliki **banyak session** (berdasarkan `sessions.user_id`)

### Migrate database

Pastikan env database sudah terisi (drizzle-kit mewajibkan variabel ini ada).

Jalankan migration:

```bash
bun run db:migrate
```

Generate migration baru dari perubahan schema:

```bash
bun run db:generate
```

## Menjalankan aplikasi

Dev mode (watch):

```bash
bun run dev
```

Production-ish:

```bash
bun run start
```

Build:

```bash
bun run build
```

## API yang tersedia

Base URL default: `http://localhost:3000`

### Healthcheck

#### `GET /health`

Response:

```json
{ "ok": true }
```

### API Documentation

Tersedia secara interaktif menggunakan Swagger UI.

#### `GET /docs`

Halaman dokumentasi OpenAPI dari seluruh endpoint yang ada, mencakup definisi request, response, dan skema data.

### Users

#### `GET /api/users`

Mengambil list user (maks 50). Jika DB tidak dikonfigurasi, tetap `200` tapi `data` kosong dan `error` berisi `db_not_configured` (atau `unknown` jika DB env ada tapi DB/schema belum siap).

Response:

```json
{
  "data": [
    { "id": 1, "name": "A", "email": "a@example.com", "created_at": "2026-01-01T00:00:00.000Z" }
  ]
}
```

#### `POST /api/users`

Registrasi user.

Request body:

```json
{ "name": "A", "email": "a@example.com", "password": "password" }
```

Rules validasi (pragmatic):

- `name`: non-empty, max 255
- `email`: format basic `x@y.z`, max 255
- `password`: min 6

Response sukses (`201`):

```json
{ "success": true, "message": "User baru berhasil ditambahkan" }
```

Kemungkinan status:

- `400`: payload/validasi salah
- `409`: email sudah ada
- `503` / `500`: DB tidak dikonfigurasi / DB tidak siap

#### `GET /api/users/current`

Ambil user yang sedang login berdasarkan token session.

Auth header:

`Authorization: Bearer <token>`

Response sukses (`200`):

```json
{
  "success": true,
  "message": "User yang sedang login",
  "data": { "id": 1, "name": "A", "email": "a@example.com", "created_at": "2026-01-01T00:00:00.000Z" }
}
```

Kemungkinan status:

- `401`: header tidak ada / token invalid / session tidak ditemukan
- `503` / `500`: DB tidak dikonfigurasi / error server

#### `POST /api/users/logout`

Logout berdasarkan token session.

Auth header:

`Authorization: Bearer <token>`

Response sukses (`200`):

```json
{ "success": true, "message": "User berhasil logout" }
```

Kemungkinan status:

- `401`: token tidak ada / token invalid
- `503` / `500`: DB tidak dikonfigurasi / error server

### Auth

#### `POST /api/login`

Login user dan menghasilkan token session.

Request body:

```json
{ "email": "a@example.com", "password": "password" }
```

Response sukses (`200`):

```json
{ "success": true, "message": "User berhasil login", "data": "<token>" }
```

Kemungkinan status:

- `400`: payload/validasi salah (message: "Email atau password salah")
- `401`: credentials salah (message: "Email atau password salah")
- `503` / `500`: DB tidak dikonfigurasi / error server

## Testing

Jalankan test:

```bash
bun test
```

Catatan:

- Test yang butuh DB akan **skip secara efektif** jika DB env tidak diset atau schema belum termigrasi (lihat helper di `tests/_helpers.ts`).
- Untuk menjalankan seluruh test end-to-end, pastikan DB siap dan jalankan `bun run db:migrate` terlebih dahulu.
