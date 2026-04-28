Kamu adalah senior backend developer Node.js yang berpengalaman.
Kamu selalu mengikuti konvensi dan arsitektur yang sudah ditentukan.
Jika ada keputusan teknis yang belum ditentukan, tanya dulu sebelum eksekusi.

Baca file-file berikut di folder docs/:
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/PROGRESS.md

Project ini menggunakan ES Module (import/export), bukan CommonJS.
Semua file harus pakai import/export dan sertakan ekstensi .js saat import file lokal.

Sekarang kerjakan Task Session 4 — Auth:

1. src/validators/authValidator.js
   - Zod schema untuk register: name, email, password (min 8 karakter)
   - Zod schema untuk login: email, password

2. src/repositories/authRepository.js
   - findUserByEmail(email)
   - createUser(data)
   - createRefreshToken(data) ← simpan token yang sudah di-hash
   - findRefreshToken(hashedToken)
   - markTokenAsUsed(id)
   - revokeTokenFamily(familyId)
   - deleteRefreshToken(token)

3. src/services/authService.js
   - register(data)
   - login(data, req) ← req untuk ambil fingerprint
   - refresh(token, req)
   - logout(token)
   - getMe(userId)

4. src/controllers/authController.js
   - register, login, refresh, logout, getMe
   - Semua dibungkus asyncHandler
   - Refresh token dibaca dari req.cookies.refreshToken
   - Refresh token dikirim via res.cookie() dengan httpOnly: true, secure: false (development), sameSite: 'strict'

5. src/routes/authRoutes.js
   - POST /register
   - POST /login
   - POST /refresh
   - POST /logout
   - GET /me

6. src/middlewares/authMiddleware.js
   - Verifikasi access token dari header Authorization: Bearer <token>
   - Attach user ke req.user

7. src/middlewares/roleMiddleware.js
   - Cek req.user.role === 'ADMIN'
   - Throw AppError 403 kalau bukan admin

8. src/middlewares/errorMiddleware.js
   - Global error handler
   - Handle AppError (isOperational)
   - Handle Prisma error: P2002 (unique constraint), P2025 (not found)
   - Return format { success: false, message, errors }

9. Update src/routes/index.js
   - Mount authRoutes ke /api/v1/auth

10. Update src/app.js
    - Pasang cookie-parser
    - Pasang errorMiddleware di paling bawah

Aturan wajib:
- Gunakan ES Module (import/export)
- Gunakan asyncHandler di semua controller
- Gunakan AppError untuk semua error yang diketahui
- Gunakan fungsi dari utils/jwt.js (signAccessToken, signRefreshToken, hashToken, fingerprintRequest)
- Gunakan fungsi dari utils/response.js (sendResponse, sendError)
- Ikuti Auth Flow di ARCHITECTURE.md persis
- Jangan buat file di luar scope task
- Kalau ada yang tidak jelas, tanya dulu