# Project Summary — FoodMart E-Commerce API
> Dokumen ini adalah ringkasan diskusi perencanaan project dari awal.
> Gunakan sebagai konteks saat memulai sesi baru dengan AI manapun.

---

## Latar Belakang

Saya punya pengalaman membuat backend Express + Mongoose (MongoDB) untuk project
e-commerce dengan tabel: users, foods, orders, carts, categories.

Sekarang mau buat ulang project serupa tapi dengan stack yang lebih modern dan
fitur yang lebih lengkap, sekaligus belajar best practice backend production-ready.

---

## Tech Stack yang Dipilih

| Komponen | Pilihan | Alasan |
|----------|---------|--------|
| Runtime | Node.js | Sudah familiar |
| Framework | Express.js | Sudah familiar |
| ORM | Prisma | Type-safe, ada migration, lebih terstruktur dari Mongoose |
| Database | Supabase (PostgreSQL) | Gratis, relational DB yang proper |
| Upload Gambar | Supabase Storage | Satu ekosistem dengan DB, gratis 1GB |
| Auth | JWT (access + refresh token) | Stateless, standar industri |
| Validasi | Zod | Modern, type-safe |
| Dokumentasi API | Swagger / OpenAPI 3.0 | Standar industri |
| Rate Limiting | express-rate-limit | Built-in, cukup untuk 1 server |
| IDE / AI Coding | Google Antigravity | Agent-first IDE dari Google, gratis |
| AI Model | Gemini 3 Pro | Default di Antigravity, gratis |

---

## Fitur yang Dibangun

### Endpoint
- **Auth**: register, login, refresh token, logout, get me
- **Users**: CRUD (admin only)
- **Categories**: CRUD (admin: write, guest: read)
- **Foods**: CRUD + upload gambar + filter & search + pagination
- **Cart**: tambah, update quantity, hapus item, kosongkan cart
- **Orders**: checkout dari cart, lihat history, update status (admin)

### Fitur Non-Fungsional
- Rate limiting semua endpoint
- Global error handler (terpusat, tidak perlu try/catch di tiap controller)
- Async handler wrapper
- Validasi Zod di semua endpoint
- Swagger UI di /api-docs
- Response format konsisten: `{ success, message, data, meta }`
- Pagination pada endpoint list
- Search & filter pada /foods

---

## Arsitektur & Struktur Folder

Pola yang dipakai: **per layer** dengan 4 layer utama:

```
routes → controllers → services → repositories
```

```
foodmart-api/
├── docs/                        ← dokumen konteks project (PRD, ARCHITECTURE, dll)
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js                 ← entry point
│   ├── app.js                   ← setup Express
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── upload.js
│   ├── validators/              ← Zod schemas
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── AppError.js
│   │   ├── response.js
│   │   ├── jwt.js
│   │   └── pagination.js
│   └── config/
│       ├── prisma.js
│       ├── supabase.js
│       └── swagger.js
├── .env
├── .env.example
└── package.json
```

---

## Konvensi Penamaan

| Hal | Format | Contoh |
|-----|--------|--------|
| File | camelCase | `foodController.js` |
| Variabel / fungsi | camelCase | `getAllFoods` |
| Tabel DB | snake_case (Prisma default) | `cart_items` |
| Endpoint | kebab-case | `/api/v1/order-items` |
| Env variable | UPPER_SNAKE | `JWT_SECRET` |

---

## Database — Model & Relasi

### User
- id (uuid), name, email (unique), password (hashed), role (USER/ADMIN), createdAt, updatedAt

### RefreshToken
- id (uuid), token (unique), userId (FK), familyId, isUsed (bool), fingerprint (optional), expiresAt, createdAt

### Category
- id (uuid), name (unique), slug (unique), createdAt, updatedAt

### Food
- id (uuid), name, description, price (decimal), stock, imageUrl, imageKey, isAvailable (bool), categoryId (FK), createdAt, updatedAt

### Cart
- id (uuid), userId (FK, unique — satu user satu cart), createdAt, updatedAt

### CartItem
- id (uuid), cartId (FK), foodId (FK), quantity, createdAt, updatedAt
- Satu CartItem = satu jenis food. Beda food = CartItem baru.

### Order
- id (uuid), userId (FK), totalPrice (decimal), status (PENDING/PROCESSING/COMPLETED/CANCELLED), note, createdAt, updatedAt

### OrderItem
- id (uuid), orderId (FK), foodId (FK), quantity, priceAtOrder (decimal — harga saat order bukan harga sekarang), createdAt

---

## Auth — Keputusan Security

### Strategi: Refresh Token Rotation + Reuse Detection + httpOnly Cookie

**Alur login:**
- Buat `familyId` baru (uuid) untuk menandai satu sesi login
- Hash refresh token (SHA-256) sebelum disimpan ke DB
- Simpan fingerprint (hash dari User-Agent) untuk binding
- Kirim refresh token via **httpOnly cookie** (bukan response body)
- Kirim access token via response body

**Alur refresh:**
- Baca refresh token dari cookie → hash → cari di DB
- Kalau `isUsed = true` → **reuse detected** → revoke seluruh family → throw 401
- Kalau fingerprint tidak cocok → revoke seluruh family → throw 401
- Tandai token lama `isUsed = true`
- Buat token baru dengan `familyId` yang SAMA
- Return access token baru + set cookie refresh token baru

**Alur logout:**
- Tandai token aktif `isUsed = true`
- Clear httpOnly cookie

**Kenapa httpOnly cookie?**
- Refresh token tidak bisa diakses JavaScript → aman dari XSS
- `sameSite: strict` → proteksi CSRF
- `secure: true` → hanya HTTPS (aktifkan di production)

**Kenapa token di-hash sebelum disimpan?**
- Kalau DB bocor, attacker tidak bisa langsung pakai token mentah

---

## Upload Gambar — Supabase Storage

```
Request dengan file
  → multer (memoryStorage — tidak simpan ke disk)
  → upload ke Supabase Storage bucket 'foods'
  → path: foods/{uuid}-{originalname}
  → simpan imageUrl + imageKey ke DB
  → saat produk dihapus → hapus juga file dari Storage via imageKey
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

> `crypto` tidak perlu diinstall — sudah built-in Node.js. Dipakai untuk hash refresh token.

---

## Environment Variables

```env
PORT=3000
NODE_ENV=development

# Dari Supabase → Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"

# Dari Supabase → Settings → API
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_KEY="sb_secret_..."   ← pakai Secret key (bukan Publishable)

# Bebas, buat string random yang panjang
JWT_SECRET="random-string-panjang"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="random-string-lain"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

### Catatan API Key Supabase (sistem baru)
Supabase sekarang punya dua jenis key:
- **Publishable key** (`sb_publishable_...`) → untuk frontend/browser
- **Secret key** (`sb_secret_...`) → untuk backend — ini yang dipakai
- Tab **Legacy** masih ada (anon & service_role) → fungsinya sama, tapi sistem baru lebih direkomendasikan

---

## Git Workflow

```
main (production-ready)
  └── dev (tempat kerja)
        ├── feat/1-setup-foundation
        ├── feat/2-auth
        ├── feat/3-categories-foods
        ├── feat/4-cart
        └── feat/5-orders
```

**Alur per fase:**
1. Buat issue di GitHub → dapat nomor (misal #1)
2. Buat branch: `git checkout -b feat/1-setup-foundation`
3. Kerjakan di Antigravity (beberapa session)
4. Commit bertahap per sub-task selesai
5. Setelah fase selesai & ditest → push → buat PR ke `dev`
6. Di PR description tulis `Closes #1` → issue otomatis tertutup saat merge
7. Review PR sendiri → merge

**Format commit (Conventional Commits):**
```
chore: init project and install dependencies
feat: add prisma schema with all models
feat: add auth register and login
fix: handle duplicate email on register
```

---

## Cara Kerja dengan AI Agent (Antigravity)

### Filosofi
- Dokumen `.md` adalah "memori project" yang di-paste tiap session baru
- Satu session = satu fitur kecil yang bisa langsung ditest
- Review Artifact agent sebelum lanjut ke task berikutnya
- Update PROGRESS.md setiap fase selesai

### Urutan session yang direkomendasikan
```
Session 1 → Setup folder + package.json + .env.example + Express dasar
Session 2 → Prisma schema + koneksi Supabase
Session 3 → Utils (asyncHandler, AppError, response helper)
Session 4 → Auth register + login
Session 5 → Refresh token + logout + /me
Session 6 → Categories CRUD
Session 7 → Foods CRUD + upload gambar
Session 8 → Cart
Session 9 → Orders
Session 10 → Polish (rate limit, swagger, error handling Prisma)
```

### Tips
- Pakai **Agent-assisted mode** (bukan Autopilot) supaya bisa review tiap file
- Pakai model besar untuk planning, model kecil untuk eksekusi
- Tanya "kenapa" bukan cuma "buatkan" supaya ikut belajar

---

## Yang Belum Diputuskan / Future Improvement

- **Redis/Valkey** untuk blacklist access token — direkomendasikan ditambahkan
  SETELAH semua fitur selesai. Pakai Upstash Redis (gratis, tidak perlu install lokal).
  Paling impactful untuk: blacklist token saat logout agar langsung invalid.
- **Multi-server rate limiting** — perlu Redis kalau nanti scale out
- **Refresh token di Redis** — alternatif dari menyimpan di PostgreSQL