# PROGRESS — FoodMart E-Commerce API

## Status: Session 8 — Rate Limiting (selesai)

---

## Sedang Dikerjakan
(kosong)

## Belum Dimulai
- [ ] Swagger docs
- [ ] Test semua endpoint

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
- [x] src/validators/cartValidator.js
- [x] src/repositories/cartRepository.js
- [x] src/services/cartService.js
- [x] src/controllers/cartController.js
- [x] src/routes/cartRoutes.js
- [x] src/validators/orderValidator.js
- [x] src/repositories/orderRepository.js
- [x] src/services/orderService.js
- [x] src/controllers/orderController.js
- [x] src/routes/orderRoutes.js
- [x] Update src/routes/index.js (semua routes + /api/v1/admin/orders)
- [x] src/middlewares/rateLimiter.js (globalLimiter, authLimiter, strictLimiter)
- [x] Update src/app.js (pasang globalLimiter)
- [x] Update src/routes/authRoutes.js (pasang authLimiter & strictLimiter)

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
- isAvailable bersifat manual — mendukung skenario pre-order
- imageKey disimpan di DB untuk hapus file dari Supabase Storage
- Cart dibuat otomatis saat user pertama kali tambah item
- Update quantity 0 = otomatis hapus item dari cart
- Jika tambah item yang sudah ada di cart, quantity di-increment
- priceAtOrder disimpan dari harga food saat checkout (bukan harga sekarang)
- Semua operasi checkout dalam satu transaksi Prisma (atomic)
- GET /api/v1/admin/orders di-mount langsung di routes/index.js (bukan di orderRoutes)
- Rate limiter di-skip otomatis saat NODE_ENV === 'development'
- Shared config object limitHandler dengan spread operator untuk menghindari duplikasi