# ARCHITECTURE — FoodMart E-Commerce API

## Struktur Folder

```
foodmart-api/
├── prisma/
│   └── schema.prisma          # semua model database
├── src/
│   ├── index.js               # entry point, setup Express & middleware global
│   ├── app.js                 # konfigurasi app Express (pisah dari server)
│   ├── routes/
│   │   ├── index.js           # gabungkan semua route
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── foodRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── categoryController.js
│   │   ├── foodController.js
│   │   ├── cartController.js
│   │   └── orderController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── categoryService.js
│   │   ├── foodService.js
│   │   ├── cartService.js
│   │   └── orderService.js
│   ├── repositories/
│   │   ├── userRepository.js
│   │   ├── categoryRepository.js
│   │   ├── foodRepository.js
│   │   ├── cartRepository.js
│   │   └── orderRepository.js
│   ├── middlewares/
│   │   ├── authMiddleware.js   # verifikasi JWT
│   │   ├── roleMiddleware.js   # cek role (admin/user)
│   │   ├── errorMiddleware.js  # global error handler
│   │   ├── rateLimiter.js      # rate limiting config
│   │   └── upload.js           # middleware Supabase Storage upload
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── foodValidator.js
│   │   ├── cartValidator.js
│   │   └── orderValidator.js
│   ├── utils/
│   │   ├── asyncHandler.js     # wrapper async untuk controller
│   │   ├── AppError.js         # custom error class
│   │   ├── response.js         # helper format response konsisten
│   │   ├── jwt.js              # helper sign & verify token
│   │   └── pagination.js       # helper pagination query
│   ├── config/
│   │   ├── prisma.js           # Prisma client singleton
│   │   ├── supabase.js         # Supabase client (untuk Storage)
│   │   └── swagger.js          # konfigurasi Swagger
│   └── docs/
│       └── swagger.yaml        # OpenAPI spec (opsional, bisa inline)
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## Alur Request

```
Request
  → Rate Limiter
  → Router
  → Validator (Zod)
  → Auth/Role Middleware (jika butuh)
  → Controller (terima req, kirim res)
      → Service (logika bisnis)
          → Repository (query database via Prisma)
  → Error Middleware (tangkap semua error)
  → Response
```

---

## Konvensi Penamaan

| Hal | Format | Contoh |
|-----|--------|--------|
| File | camelCase | `foodController.js` |
| Variabel / fungsi | camelCase | `getAllFoods` |
| Tabel DB | snake_case | `cart_items` |
| Kolom DB | camelCase (Prisma default) | `createdAt` |
| Endpoint | kebab-case | `/api/v1/order-items` |
| Env variable | UPPER_SNAKE | `JWT_SECRET` |

---

## Format Response

Semua endpoint wajib menggunakan format ini:

```json
// Sukses
{
  "success": true,
  "message": "Foods retrieved successfully",
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 100 }
}

// Error
{
  "success": false,
  "message": "Food not found",
  "errors": [ ... ]   // opsional, untuk validasi
}
```

---

## Error Handling

- Semua controller dibungkus `asyncHandler(fn)` — tidak perlu try/catch manual
- Throw `new AppError("pesan", statusCode)` untuk error yang sudah diketahui
- Error yang tidak tertangkap masuk ke `errorMiddleware` di `app.js`
- Error Prisma (P2002, P2025, dll) di-handle di errorMiddleware secara terpusat

Contoh AppError:
```js
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

---

## Auth Flow

```
Register
  → validasi input (Zod)
  → cek email belum terdaftar
  → hash password (bcrypt, salt 10)
  → simpan user
  → return user (tanpa password)

Login
  → cek email terdaftar
  → verifikasi password (bcrypt.compare)
  → buat familyId baru (uuid) ← penanda satu sesi login
  → buat access token (15m, JWT)
  → buat refresh token (JWT, 7d)
  → hash refresh token sebelum disimpan ke DB
  → simpan ke DB: { token: hashedToken, familyId, isUsed: false, fingerprint, expiresAt }
  → kirim access token di response body
  → kirim refresh token via httpOnly cookie

Refresh Token
  → baca refresh token dari httpOnly cookie
  → verifikasi JWT signature & expiry
  → cari token di DB berdasarkan hash
  → cek isUsed:
      → kalau true (REUSE DETECTED!):
          → revoke semua token dengan familyId yang sama
          → log kejadian (IP, userAgent, waktu)
          → throw 401 "Session compromised, please login again"
  → cek fingerprint cocok dengan request saat ini
      → kalau tidak cocok → revoke family → throw 401
  → tandai token lama: isUsed = true
  → buat refresh token baru (familyId SAMA)
  → simpan token baru ke DB
  → return access token baru + set cookie refresh token baru

Logout
  → baca refresh token dari cookie
  → tandai isUsed = true di DB (atau hapus seluruh family jika "logout semua device")
  → clear httpOnly cookie
```

### Kenapa httpOnly Cookie?
- Refresh token tidak bisa diakses JavaScript → aman dari serangan XSS
- `sameSite: strict` → proteksi CSRF
- `secure: true` → hanya dikirim via HTTPS (aktifkan di production)

### Kenapa token di-hash sebelum disimpan ke DB?
- Kalau DB bocor, attacker tidak bisa langsung pakai token mentah
- Simpan hash (SHA-256) di DB, bandingkan saat refresh

```js
// Contoh hash token sebelum simpan
const crypto = require('crypto')
const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
```

---

## Upload Gambar (Supabase Storage)

```
Request dengan file
  → middleware upload.js (multer — simpan di memory, tidak ke disk)
  → service uploadToSupabase(buffer, filename)
      → supabase.storage.from('foods').upload(path, buffer)
  → dapat publicUrl → simpan ke kolom imageUrl di DB
  → saat hapus produk → supabase.storage.from('foods').remove([imageKey])
```

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres

# Supabase (untuk Storage)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...   ← pakai Secret key (sb_secret_), bukan Publishable key

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.x",
    "prisma": "^5.x",
    "@prisma/client": "^5.x",
    "@supabase/supabase-js": "^2.x",
    "bcryptjs": "^2.x",
    "jsonwebtoken": "^9.x",
    "cookie-parser": "^1.x",
    "zod": "^3.x",
    "multer": "^1.x",
    "express-rate-limit": "^7.x",
    "swagger-ui-express": "^5.x",
    "swagger-jsdoc": "^6.x",
    "dotenv": "^16.x",
    "cors": "^2.x",
    "helmet": "^7.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

> `crypto` tidak perlu diinstall — sudah built-in di Node.js. Dipakai untuk hash refresh token sebelum disimpan ke DB.