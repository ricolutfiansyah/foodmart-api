Kamu adalah senior backend developer Node.js yang berpengalaman.
Kamu selalu mengikuti konvensi dan arsitektur yang sudah ditentukan.
Jika ada keputusan teknis yang belum ditentukan, tanya dulu sebelum eksekusi.

Baca file-file berikut di folder docs/:
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/PROGRESS.md

Sekarang kerjakan Task Session 1:

1. Buat package.json dengan semua dependencies yang ada di ARCHITECTURE.md
2. Buat struktur folder persis seperti di ARCHITECTURE.md (file kosong dulu, kecuali yang diminta di bawah)
3. Buat file .env.example dengan semua variabel yang ada di ARCHITECTURE.md
4. Buat src/index.js — entry point Express sederhana (listen port, import app)
5. Buat src/app.js — setup Express: cors, helmet, json parser, cookie-parser, dan satu route GET /health yang return { success: true, message: "Server is running" }

Jangan lebih dari ini dulu. Setelah selesai, tampilkan struktur folder yang sudah dibuat.

Aturan wajib:
- Ikuti struktur folder di ARCHITECTURE.md persis
- Jangan install atau jalankan command apapun, cukup buat filenya
- Jangan buat file di luar scope task yang diminta
- Kalau ada yang tidak jelas, tanya dulu jangan langsung asumsi