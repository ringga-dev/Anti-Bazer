# Struktur Proyek Anti Bazer

Struktur ini memakai Bun dan TypeScript, dengan pembagian source set yang mudah dikenali dari proyek Kotlin: kode aplikasi ada di `src/main/ts`, resource di `src/main/resources`, dan pengujian di `src/test/ts`. Package path `com/example` dan lapisan Gradle/Ktor tidak dipakai karena bukan bagian dari stack proyek ini.

```text
Anti-Bazer/
├── docs/
├── src/
│   ├── main/
│   │   ├── ts/
│   │   │   ├── Application.ts             # Entry point CLI dan server API
│   │   │   ├── cli/
│   │   │   │   └── Application.ts         # Perintah, prompt, dan UX terminal
│   │   │   ├── api/
│   │   │   │   └── server.ts              # Server HTTP, endpoint scan, dan status job
│   │   │   ├── features/
│   │   │   │   ├── scan/                  # Orkestrasi alur pemindaian
│   │   │   │   ├── collection/            # Pemilihan adapter dan pengumpulan provider
│   │   │   │   ├── analysis/              # Indikator dan perhitungan pola
│   │   │   │   └── reports/               # Penyajian hasil analisis
│   │   │   ├── platforms/                 # Kontrak dan adapter API
│   │   │   │   ├── x/
│   │   │   │   ├── instagram/
│   │   │   │   ├── tiktok/
│   │   │   │   ├── youtube/
│   │   │   │   └── facebook/
│   │   │   └── shared/                    # Kode lintas fitur yang benar-benar umum
│   │   └── resources/                     # Resource non-kode jika dibutuhkan
│   └── test/
│       └── ts/                            # Tes ditambahkan saat fitur diimplementasikan
├── package.json                           # Metadata dan script Bun
├── tsconfig.json                          # Konfigurasi TypeScript
└── .gitignore
```

## Menghindari duplikasi

- Source code hanya memiliki satu lokasi utama: `src/main/ts`.
- Fitur dikelompokkan sekali di bawah `features/`; tidak ada salinan fitur di root lain.
- Tes berada dalam satu source set `src/test/ts`; file tes ditambahkan saat ada implementasi untuk diuji, bukan membuat salinan folder fitur.
- `platforms/` berisi kontrak umum dan adapter terpisah untuk X, Instagram, TikTok, YouTube, dan Facebook. Aturan analisis tetap berada di `features/analysis`.
- `shared/` hanya untuk kode lintas fitur; model dan aturan khusus tetap berada di fitur pemiliknya.

## Tanggung jawab fitur

- `scan/`: menerima seed URL, mengorkestrasi pengumpulan dan analisis, lalu membentuk laporan.
- `collection/`: memilih adapter platform dan mengambil data yang tersedia melalui API.
- `analysis/`: menghitung indikator yang dapat dijelaskan dari data hasil pengumpulan.
- `reports/`: menampilkan hasil, bukti, cakupan, dan keterbatasan API.
- `platforms/`: mengimplementasikan akses API resmi dan mengubah respons provider ke model internal.
- `api/`: menyediakan endpoint HTTP untuk memulai scan, memeriksa status, dan mengambil hasil.
- `cli/`: menerima input, mengatur perintah dan prompt, lalu menampilkan progres/kesalahan.
- `Application.ts`: entry point tipis yang memulai CLI.

## Padanan dengan proyek Kotlin

| Kotlin/Gradle | Bun/TypeScript |
|---|---|
| `src/main/kotlin` | `src/main/ts` |
| `src/main/resources` | `src/main/resources` |
| `src/test/kotlin` | `src/test/ts` |
| `Application.kt` | `Application.ts` |
| `build.gradle.kts` dan `settings.gradle.kts` | `package.json` dan `tsconfig.json` |
| `.gradle/`, `gradle/`, Gradle Wrapper | Tidak digunakan; Bun menjalankan runtime dan mengelola dependency |
| Plugin Ktor dan `application.conf` | Server HTTP memakai `Bun.serve`; konfigurasi runtime dibaca dari environment |

Struktur ini sengaja lebih datar daripada template server Kotlin/Ktor. API HTTP tersedia melalui server bawaan Bun tanpa menambah framework server eksternal.

Folder adapter hanya menandai pemisahan provider; folder tersebut belum berarti akses API atau semua jenis interaksi sudah diimplementasikan. Tiap provider harus menyatakan kapabilitas yang benar-benar tersedia berdasarkan API dan izin yang dimiliki.
