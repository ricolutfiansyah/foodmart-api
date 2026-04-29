# PROGRESS — FoodMart E-Commerce API

## Status: Session 5 — Categories & Foods (selesai)

---

## Sedang Dikerjakan
(kosong)

## Belum Dimulai
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
- [x] src/config/supabase.js
- [x] src/middlewares/upload.js
- [x] src/validators/foodValidator.js
- [x] src/repositories/categoryRepository.js
- [x] src/services/categoryService.js
- [x] src/controllers/categoryController.js
- [x] src/routes/categoryRoutes.js
- [x] src/repositories/foodRepository.js
- [x] src/services/foodService.js
- [x] src/controllers/foodController.js
- [x] src/routes/foodRoutes.js
- [x] Update src/routes/index.js (categories & foods)

## Catatan & Keputusan Teknis
- Supabase Storage untuk gambar produk (bukan Cloudinary)
- Refresh token: Rotation + Reuse Detection
- Refresh token via httpOnly cookie, di-hash SHA-256 sebelum disimpan
- Token binding via User-Agent fingerprint
- Reuse detected → revoke seluruh family → user login ulang
- UUID untuk semua PK
- Zod untuk validasi
- ES Module (import/export) di semua file
- Middleware export: authMiddleware (bukan protect), roleMiddleware (bukan adminOnly)
- isAvailable bersifat manual — mendukung skenario pre-order (tidak otomatis false saat stock 0)
- imageKey disimpan di DB untuk keperluan hapus gambar dari Supabase Storage