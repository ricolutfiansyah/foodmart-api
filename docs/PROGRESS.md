# PROGRESS — FoodMart E-Commerce API

## Status: Session 4 — Auth (sedang dikerjakan)

---

## Sedang Dikerjakan
(kosong)

## Belum Dimulai
- [ ] Categories & Foods CRUD
- [ ] Upload gambar Supabase Storage
- [ ] Cart & Orders
- [ ] Rate limiting, Swagger, Polish

## Selesai
- [x] Inisialisasi project (package.json, struktur folder)
- [x] Setup Express app (index.js, app.js)
- [x] Setup middleware global (cors, helmet, json parser, cookie-parser)
- [x] Health check endpoint GET /health
- [x] Buat semua model di schema.prisma + migrate ke Supabase
- [x] src/utils/asyncHandler.js
- [x] src/utils/AppError.js
- [x] src/utils/response.js
- [x] src/utils/jwt.js (hashToken & fingerprintRequest)
- [x] src/utils/pagination.js
- [x] POST /api/v1/auth/register
- [x] POST /api/v1/auth/login
- [x] POST /api/v1/auth/refresh
- [x] POST /api/v1/auth/logout
- [x] GET /api/v1/auth/me
- [x] authMiddleware, roleMiddleware, errorMiddleware
- [x] authValidator, authRepository, authService, authController

## Catatan & Keputusan Teknis
- Supabase Storage untuk gambar produk (bukan Cloudinary)
- Refresh token: Rotation + Reuse Detection
- Refresh token via httpOnly cookie, di-hash SHA-256 sebelum disimpan
- Token binding via User-Agent fingerprint
- Reuse detected → revoke seluruh family → user login ulang
- UUID untuk semua PK
- Zod untuk validasi
- ES Module (import/export) di semua file