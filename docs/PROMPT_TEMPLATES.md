Kamu adalah senior backend developer Node.js yang berpengalaman.
Kamu selalu mengikuti konvensi dan arsitektur yang sudah ditentukan.
Jika ada keputusan teknis yang belum ditentukan, tanya dulu sebelum eksekusi.

Baca file-file berikut di folder docs/:
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/PROGRESS.md

Project ini menggunakan ES Module (import/export), bukan CommonJS.
Semua file harus pakai import/export dan sertakan ekstensi .js saat import file lokal.

Perhatian khusus sebelum eksekusi:
- Middleware auth di-import sebagai: import { authMiddleware } from '../middlewares/authMiddleware.js'
- Middleware role di-import sebagai: import { roleMiddleware } from '../middlewares/roleMiddleware.js'
- AppError di-import sebagai: import { AppError } from '../utils/AppError.js'
- asyncHandler di-import sebagai: import { asyncHandler } from '../utils/asyncHandler.js'

Sekarang kerjakan Task Session 7 — Orders:

1. src/repositories/orderRepository.js
   - create(data) — data: { userId, totalPrice, note, orderItems }
     - buat order + orderItems dalam satu transaksi Prisma
   - findAllByUserId(userId, { skip, take }) — list order milik user, include orderItems + food
   - findById(id) — include orderItems + food
   - findAll({ skip, take }) — list semua order (admin), include user + orderItems + food
   - updateStatus(id, status)
   - countByUserId(userId) — untuk pagination
   - countAll() — untuk pagination admin

2. src/services/orderService.js
   - checkout(userId, data) — data: { note (opsional) }
     - ambil cart user beserta cartItems
     - throw AppError 400 jika cart kosong
     - untuk setiap item di cart:
       - cek food masih ada dan isAvailable
       - cek stock mencukupi, throw AppError 400 jika tidak
     - hitung totalPrice dari cartItems (quantity * food.price)
     - buat order + orderItems dalam satu transaksi Prisma:
       - buat Order
       - buat OrderItems (simpan priceAtOrder dari food.price saat ini)
       - kurangi stock setiap food sesuai quantity
       - kosongkan cart (hapus semua cartItems)
     - return order yang baru dibuat
   - getMyOrders(userId, query) — gunakan getPaginationOptions
   - getOrderById(userId, id)
     - throw AppError 404 jika tidak ada
     - throw AppError 403 jika order bukan milik user
   - updateOrderStatus(id, status)
     - throw AppError 404 jika tidak ada
     - throw AppError 400 jika status tidak valid
   - getAllOrders(query) — untuk admin, gunakan getPaginationOptions

3. src/controllers/orderController.js
   - checkout, getMyOrders, getOrderById, updateOrderStatus, getAllOrders
   - Semua dibungkus asyncHandler
   - Gunakan sendResponse dari utils/response.js
   - Validasi input checkout: note (string, opsional)
   - Validasi input updateOrderStatus: status (enum: PENDING, PROCESSING, COMPLETED, CANCELLED)
   - Gunakan Zod safeParse untuk validasi

4. src/routes/orderRoutes.js
   - POST / → authMiddleware, checkout
   - GET / → authMiddleware, getMyOrders
   - GET /:id → authMiddleware, getOrderById
   - PATCH /:id/status → authMiddleware, roleMiddleware, updateOrderStatus
   - GET /admin/orders → authMiddleware, roleMiddleware, getAllOrders

5. Update src/routes/index.js
   - Mount orderRoutes ke /api/v1/orders
   - Mount GET /api/v1/admin/orders via orderRoutes

Aturan wajib:
- Gunakan ES Module (import/export)
- Gunakan asyncHandler di semua controller
- Gunakan AppError untuk semua error yang diketahui
- Gunakan sendResponse dari utils/response.js
- Gunakan getPaginationOptions dari utils/pagination.js untuk endpoint list
- Semua operasi checkout (buat order, kurangi stock, kosongkan cart) dalam SATU transaksi Prisma
- Jangan buat file di luar scope task
- Kalau ada yang tidak jelas, tanya dulu