# Panduan Developer

Panduan ini ditujukan bagi kontributor dan operator yang ingin menjalankan, memahami, atau memperluas Anti Bazer. Dokumen ini menjelaskan pola ekstensi yang selaras dengan implementasi saat ini, bukan janji bahwa seluruh provider atau kapabilitas telah aktif.

## 1. Persiapan lingkungan

### Prasyarat

- Bun versi yang mendukung TypeScript/runtime API yang digunakan proyek.
- Git untuk mendapatkan source.
- Credential resmi dari provider untuk pengujian live. Credential tidak diperlukan untuk typecheck maupun unit test.

### Instalasi

```powershell
git clone <repository-url>
cd "Anti Bazer"
bun install
Copy-Item .env.example .env
```

Simpan token hanya di `.env` lokal atau secret manager. File `.env` telah dikecualikan dari kontrol versi. Jangan menaruh nilai rahasia di fixture, log, dokumentasi, test snapshot, ataupun laporan.

### Pemeriksaan dasar

```powershell
bun run typecheck
bun test
bun run antibazer --help
bun run antibazer platforms list
```

Unit tests menggunakan data terkendali dan tidak memerlukan credential platform sungguhan. Pengujian live dapat mengonsumsi kuota atau biaya; jalankan secara sadar dengan akun dan data yang memang diizinkan.

## 2. Arsitektur dan alur data

Alur inti berjalan seperti berikut:

```text
CLI / HTTP API
      |
      v
scan input validation and URL inference
      |
      v
features/scan/run.ts
      |
      +--> features/collection/collect.ts
      |        |
      |        +--> provider adapter (official API)
      |
      +--> features/analysis/ai.ts
      |        |
      |        +--> local analysis
      |        +--> optional compatible AI endpoint
      |
      +--> features/reports/print.ts
      |
      v
structured result + human-readable report
```

- **Entry point:** `src/main/ts/Application.ts` memulai CLI.
- **CLI:** `src/main/ts/cli/Application.ts` mengurai perintah, memeriksa konfigurasi, dan menampilkan hasil.
- **HTTP API:** `src/main/ts/api/server.ts` menerima request dan menjalankan flow scan yang sama.
- **Input:** `src/main/ts/features/scan/input.ts` memvalidasi dan menafsirkan URL akun/post berdasarkan host/path.
- **Orkestrasi:** `src/main/ts/features/scan/run.ts` menggabungkan hasil koleksi, analisis, scope, dan report.
- **Koleksi:** `src/main/ts/features/collection/collect.ts` memilih adapter provider.
- **Kontrak provider:** `src/main/ts/platforms/types.ts` mendefinisikan seed, model normalisasi, kapabilitas, dan adapter.
- **Adapter:** `src/main/ts/platforms/<provider>/adapter.ts` berkomunikasi dengan API resmi provider.
- **Analisis:** `src/main/ts/features/analysis/` memuat indikator lokal dan integrasi AI opsional.
- **Report:** `src/main/ts/features/reports/print.ts` memformat keluaran CLI yang dapat dibaca.
- **Tests:** `src/test/ts/` berisi pengujian perilaku dan kontrak.

Detail direktori ada di [struktur proyek](./struktur-proyek.md).

## 3. Kontrak data inti

Model bersama berada di `src/main/ts/platforms/types.ts`:

- `ScanSeed`: URL akun atau URL post.
- `PlatformAccount`: metadata akun yang provider kembalikan.
- `PlatformPost`: konten yang dinormalisasi menjadi ID, URL, teks, waktu, author, dan jumlah interaksi bila tersedia.
- `PlatformComment`: teks komentar, waktu, jumlah balasan, dan `postId` jika dapat dikaitkan.
- `PlatformInteraction`: jenis interaksi dan akun hanya bila provider benar-benar memberikan datanya.
- `PlatformScanResult`: seed, akun sumber, posting, komentar, interaksi, waktu koleksi, dan keterbatasan.
- `PlatformAdapter`: ID, deklarasi kapabilitas, dan `scan(seed)`.

Adapter menerjemahkan respons API ke model internal. Pertahankan informasi yang membantu audit (ID provider, timestamp, relasi post) hanya sejauh diperlukan dan diizinkan. Jangan membuat data yang tidak diberikan provider atau mengubah data yang hilang menjadi klaim “tidak ada”.

Hasil `runScan` berisi `collection`, `analysis`, `scope`, dan `report`. `scope.interactingAccountAssessment.status` saat ini `not_implemented`; jangan mengubahnya menjadi status sukses sebelum individual account assessment benar-benar tersedia dan diuji.

## 4. Menambah atau memperbaiki adapter provider

1. **Periksa API resmi terlebih dahulu.** Catat endpoint, metode autentikasi, akses yang diperlukan, batas kuota, pagination, dan data yang tidak dapat diperoleh.
2. **Periksa prior art.** Baca adapter provider yang sudah ada dan kontrak di `platforms/types.ts`. Gunakan helper HTTP bersama bila sesuai, jangan menduplikasi parser/penanganan error.
3. **Pertahankan tanggung jawab adapter.** Adapter menangani request provider, pagination yang terbatas, dan pemetaan ke model internal. Jangan letakkan scoring atau aturan produk di adapter.
4. **Nyatakan capability secara jujur.** Properti `capabilities` harus sesuai dukungan API yang benar-benar dilaksanakan, bukan roadmap.
5. **Permukaan error secara jelas.** Gunakan error provider yang ada bila relevan; jangan mengubah kegagalan jaringan, permission, atau parsing menjadi hasil kosong yang tampak sukses.
6. **Tambahkan tes terisolasi.** Stub `fetch` atau gunakan fixture aman untuk memeriksa pemetaan data, pagination, batas halaman, field kosong, respons error, dan keterbatasan.
7. **Perbarui dokumentasi.** Sesuaikan matriks provider, syarat setup, jenis target, dan limitation pada `docs/setup-platform.md` serta `docs/status-fitur.md`.
8. **Jalankan validasi.** `bun run typecheck` dan `bun test`.

Jangan menambahkan scraper atau mekanisme untuk melewati login, paywall, rate limit, izin, ataupun kontrol akses.

## 5. Menambah indikator analisis

- Utamakan indikator deterministik, terukur, dan dapat dijelaskan sebelum memakai AI.
- Setiap indikator harus menerangkan sumber, nilai, alasan, dan bukti yang mendasarinya.
- Pertimbangkan sampel kecil, missing data, bahasa, kutipan, sarkasme, peristiwa ramai, serta bias provider.
- Bedakan “indikator tidak ditemukan” dari “tidak cukup data”.
- Jangan menamai atau mendesain skor sebagai probabilitas “fake/buzzer” tanpa definisi operasional, label yang dapat dipertanggungjawabkan, kalibrasi, dan evaluasi empiris.
- Tambahkan tes untuk kasus umum, edge case, nilai kosong, dan hasil yang ambigu.
- Perbarui dokumentasi indikator dan batasan bersama perubahan kode.

## 6. Integrasi AI dan privasi

AI bersifat opt-in dan hanya memakai endpoint chat-completions kompatibel. Untuk konfigurasi, format yang dikirim, redaksi, batas batch, dan pengelolaan biaya, lihat [setup platform dan AI](./setup-platform.md).

Sebelum mengubah integrasi AI:

- tentukan data minimum yang diperlukan dan jangan mengirim identifier komentator;
- pertahankan batas batch dan penanganan hasil tidak valid;
- gagalnya AI tidak boleh terlihat seperti analisis lengkap yang sukses;
- label stance tetap merupakan klasifikasi teks, bukan identifikasi sikap/niat orang;
- jangan menambahkan telemetry atau logging isi komentar tanpa kebutuhan dan persetujuan yang jelas.

## 7. API, deployment, dan operasional

API saat ini menggunakan `Bun.serve`, menerima pekerjaan scan, dan menyimpan status serta hasil hanya dalam memori proses. Server default mengikat ke loopback. Bind ke jaringan lain memerlukan `API_ACCESS_TOKEN`, tetapi autentikasi token saja belum menjadikan layanan siap produksi.

Sebelum deployment yang dapat diakses pihak lain, evaluasi sekurangnya:

- TLS/reverse proxy, secret management, firewall, dan rotasi token;
- autentikasi/otorisasi pengguna dan pembatasan request per pengguna;
- rate limiting, batas ukuran serta konkurensi, timeout dan pembatalan kerja;
- persistensi, retensi, penghapusan hasil, backup, dan pemisahan data pengguna;
- audit log tanpa rahasia atau konten sensitif yang tidak perlu;
- pemantauan penggunaan API/model dan batas biaya;
- kebijakan privasi, syarat penggunaan, dan prosedur respons insiden.

Jangan mengekspos server pengembangan atau endpoint AI lokal ke internet tanpa perlindungan jaringan yang tepat.

## 8. Kontribusi dan kriteria perubahan

Untuk setiap perubahan:

1. Jaga lingkup tetap kecil dan sesuai pola yang sudah ada.
2. Tambahkan atau ubah tes yang membuktikan perilaku yang dimaksud.
3. Jalankan `bun run typecheck` dan `bun test`.
4. Perbarui dokumentasi yang terkait langsung.
5. Pastikan tidak ada token, data pribadi nyata, atau hasil yang mengidentifikasi pengguna dalam diff.
6. Jelaskan keterbatasan yang masih tersisa dalam deskripsi perubahan.

Kebijakan lisensi proyek tersedia di [MIT License](../LICENSE). Kontributor tetap harus memastikan bahwa dependency, fixture, dan dokumentasi yang ditambahkan dapat didistribusikan sesuai lisensinya.
