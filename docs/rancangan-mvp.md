# Rancangan MVP dan Arsitektur

## Teknologi awal

- **Runtime:** Bun.
- **Bahasa:** TypeScript.
- **Antarmuka awal:** CLI interaktif.
- **Penyimpanan awal:** SQLite lokal jika hasil perlu disimpan; data mentah disimpan seminimal mungkin.
- **Validasi:** validasi skema pada data API sebelum dianalisis.
- **Integrasi platform:** adapter terpisah per provider, menggunakan API resmi dan mematuhi kebijakan serta kuotanya.
- **Analisis:** aturan deterministik dan statistik terlebih dahulu; AI dapat ditambahkan sebagai bantuan untuk merangkum atau mengelompokkan bukti.

## Pustaka CLI

- `commander`: definisi perintah dan opsi CLI.
- `@clack/prompts`: prompt interaktif dan umpan balik terminal.
- `zod`: validasi input dan respons API.
- `bun:test`: pengujian bawaan Bun.
- `fetch` dan `bun:sqlite`: API HTTP dan SQLite bawaan Bun, sehingga belum memerlukan paket tambahan.
- `typescript` dan `@types/bun`: pemeriksaan tipe dan tipe runtime untuk pengembangan.

Pustaka SDK provider tidak ditambahkan secara massal karena tiap platform memiliki metode autentikasi, API, dan persyaratan akses berbeda. Adapter dipisahkan per platform dan dapat memakai `fetch` bawaan untuk request HTTP. SDK resmi ditambahkan hanya jika memang diperlukan oleh integrasi provider tersebut.

Provider yang dipisahkan dalam struktur adalah X, Instagram, TikTok, YouTube, dan Facebook. Ini menyiapkan arsitektur agar tiap provider dapat dikembangkan sendiri; bukan klaim bahwa akses API atau semua jenis interaksi sudah tersedia. Status dan kapabilitas tiap adapter harus mencerminkan API serta izin aplikasi yang benar-benar dimiliki.

Instruksi konfigurasi lokal dan variabel environment ada di [setup-platform.md](./setup-platform.md). CLI menyediakan `platforms list` dan `platforms check <provider>` untuk memeriksa keberadaan konfigurasi; pemeriksaan tersebut belum memvalidasi token ke server provider.

## Alur MVP yang saat ini tersedia

1. Pengguna memasukkan URL akun atau postingan pada platform yang didukung.
2. Adapter memakai API resmi dan kredensial yang telah dikonfigurasi untuk mengambil metadata, konten, dan komentar yang memang tersedia.
3. Pengambilan dibatasi oleh kuota API, izin token, dan batas lokal (`MAX_SCAN_POSTS`, `MAX_SCAN_COMMENTS`, serta batas halaman provider).
4. Mesin analisis menghitung indikator pola lokal dan, jika dikonfigurasi, meminta model AI memberi ringkasan serta jumlah opini komentar secara agregat.
5. CLI menampilkan data yang berhasil dikumpulkan, metode analisis, bukti, persentase agregat, dan batasan.
6. Pengguna meninjau hasil; aplikasi tidak melakukan tindakan terhadap akun.

Versi saat ini **tidak** menemukan atau memeriksa identitas semua akun yang berkomentar, menyukai, atau membagikan konten, tidak memperluas jaringan akun, dan tidak menetapkan label buzzer/fake pada orang atau akun. API platform tidak menyediakan cakupan interaksi dan riwayat akun yang konsisten untuk mendukung janji tersebut; hasil yang tersedia adalah indikator pola pada sampel konten, bukan penilaian identitas.

Example CLI commands:

```text
bun run antibazer --help
bun run antibazer --platform=auto target="https://www.youtube.com/watch?v=VIDEO_ID"
bun run antibazer --platform=instagram akun="https://www.instagram.com/USERNAME/"
bun run antibazer --platform=x post="https://x.com/USERNAME/status/POST_ID"
```

`platform=auto` detects the platform from the URL hostname. Data collection is limited to what the official API makes available to the app. The current implementation does not enumerate interacting accounts; APIs may limit interaction types, result counts, history, or access based on permissions.

## Komponen logis

- **CLI:** argumen, bantuan, validasi perintah, dan keluaran yang mudah dibaca.
- **Provider dan pengumpul:** mengambil data melalui API resmi, menangani autentikasi, paginasi, rate limit, dan sinkronisasi inkremental.
- **Pengumpulan komentar:** mengambil teks komentar melalui adapter yang mendukungnya, tanpa menyimpan atau melaporkan label per komentator.
- **Model data ternormalisasi:** format internal untuk akun, konten, interaksi, waktu, dan sumber.
- **Analisis:** menghitung indikator dengan versi aturan yang tercatat.
- **Pelaporan:** menampilkan skor, alasan, bukti, periode, serta keterbatasan.
- **Penyimpanan:** menyimpan konfigurasi dan hasil yang diperlukan; melindungi kredensial dan menyediakan penghapusan.

Komponen provider tidak boleh mencampur logika API khusus platform ke dalam mesin analisis. Ini memudahkan penambahan provider lain tanpa mengubah indikator. Fixture data lokal dapat digunakan untuk pengujian, tetapi bukan metode pengumpulan utama produk.

## Format hasil

Hasil analisis saat ini memuat:

- Akun sumber dan provider, jika API mengembalikannya.
- Akun atau postingan awal yang dimasukkan pengguna.
- Jumlah posting dan komentar yang berhasil dikumpulkan.
- Metode analisis, indikator pola, nilai sinyal, dan alasan.
- Jumlah/persentase opini komentar yang diagregasikan, tidak ditampilkan per komentator.
- Batas pengumpulan dan cakupan data yang tersedia.
- Batasan analisis dan peringatan bahwa ini bukan vonis identitas atau motif.

## Keamanan dan pengelolaan data

- Jangan menyimpan token API di kode sumber atau laporan.
- Gunakan mekanisme konfigurasi lokal yang sesuai dan kecualikan rahasia dari kontrol versi.
- Batasi data mentah yang disimpan dan dokumentasikan masa penyimpanan.
- Catat sumber dan waktu pengambilan agar hasil bisa diaudit.
- Hentikan atau jeda sinkronisasi ketika kuota, batas biaya, atau masa izin tercapai; tampilkan statusnya secara jelas.
- Jangan mencatat isi sensitif ke log tanpa kebutuhan yang jelas.
