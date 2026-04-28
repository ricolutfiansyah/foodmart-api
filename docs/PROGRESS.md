# PROGRESS — FoodMart E-Commerce API

## Status: Belum Mulai

---

## Fase 1 — Setup & Foundation
- [ ] Inisialisasi project (package.json, struktur folder)
- [ ] Setup environment (.env, dotenv)
- [ ] Konfigurasi Prisma + koneksi Supabase
- [ ] Buat semua model di schema.prisma
- [ ] Jalankan prisma migrate dev
- [ ] Setup Express app (index.js, app.js)
- [ ] Setup middleware global (cors, helmet, json parser)
- [ ] Buat utils: asyncHandler, AppError, response helper
- [ ] Setup Swagger

## Fase 2 — Auth
- [ ] POST /api/v1/auth/register
- [ ] POST /api/v1/auth/login (return access token + set httpOnly cookie)
- [ ] POST /api/v1/auth/refresh (rotation + reuse detection)
- [ ] POST /api/v1/auth/logout
- [ ] GET /api/v1/auth/me
- [ ] Middleware: authMiddleware (verifikasi JWT)
- [ ] Middleware: roleMiddleware (cek ADMIN)
- [ ] Utils: hashToken (SHA-256 untuk refresh token)
- [ ] Utils: fingerprintRequest (hash User-Agent)

## Fase 3 — Categories & Foods
- [ ] CRUD Categories (full)
- [ ] CRUD Foods (full)
- [ ] Upload gambar ke Supabase Storage
- [ ] Filter & search pada GET /foods
- [ ] Pagination

## Fase 4 — Cart & Orders
- [ ] CRUD Cart
- [ ] Checkout (POST /orders dari cart)
- [ ] List & detail orders (user)
- [ ] Update status order (admin)

## Fase 5 — Polish
- [ ] Rate limiting semua endpoint
- [ ] Validasi Zod semua endpoint
- [ ] Error handling Prisma terpusat
- [ ] Swagger docs lengkap
- [ ] Test semua endpoint manual (Postman/Insomnia)

---

## Selesai
(belum ada)

---

## Catatan & Keputusan Teknis
- Supabase Storage dipakai untuk gambar produk (bukan Cloudinary)
- Refresh token: Rotation + Reuse Detection (token lama ditandai USED, tidak dihapus)
- Refresh token dikirim via httpOnly cookie (bukan response body)
- Refresh token di-hash (SHA-256) sebelum disimpan ke DB
- Token binding via User-Agent fingerprint
- Reuse detected → seluruh family token di-revoke → user wajib login ulang
- UUID dipakai untuk semua PK (bukan auto-increment)
- Zod untuk validasi (bukan Joi/express-validator)
- cookie-parser ditambahkan sebagai dependency untuk baca httpOnly cookie