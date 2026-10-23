# Rencana Kerja dan Sasaran

Urutan ini menjadikan pengumpulan otomatis melalui API resmi bagian dari MVP. Pilih satu platform terlebih dahulu karena akses dan kemampuan API berbeda-beda. Setiap tahap perlu ditinjau sebelum memperluas cakupan.

## Tahap 1 — Tetapkan definisi dan kebijakan

**Hasil:** definisi operasional indikator, sumber data yang diizinkan, serta batas interpretasi.

**Selesai jika:**

- istilah “mencurigakan” dan “pola koordinasi” didefinisikan sebagai indikator yang dapat diuji;
- tidak ada kesimpulan otomatis bahwa akun adalah orang asli atau buzzer;
- cakupan data, tujuan pemrosesan, dan retensi awal didokumentasikan.

## Tahap 2 — Fondasi CLI Bun

**Hasil:** proyek Bun + TypeScript dengan bantuan CLI, struktur modul, validasi konfigurasi, dan pelaporan kesalahan yang jelas.

**Selesai jika:**

- perintah bantuan berjalan;
- input salah ditolak dengan pesan yang dapat ditindaklanjuti;
- pengujian dasar untuk parsing dan validasi tersedia.

## Tahap 3 — Adapter API dan pengumpulan otomatis

**Hasil:** satu adapter untuk API resmi platform pilihan. Pengguna memasukkan username atau postingan; aplikasi mengambil data yang tersedia dan menemukan akun yang berinteraksi.

**Selesai jika:**

- sumber, autentikasi, cakupan, izin, dan batas data didokumentasikan;
- format username dan URL/ID postingan divalidasi serta dinormalisasi;
- jenis interaksi yang API sediakan didokumentasikan dan ditampilkan;
- akun yang berinteraksi dapat ditemukan melalui hasil API yang tersedia;
- perluasan pemeriksaan dibatasi oleh kedalaman, jumlah akun, waktu, dan kuota;
- rate limit, paginasi, token kedaluwarsa, dan kegagalan API ditangani dengan status yang terlihat;
- laporan menjelaskan bahwa daftar akun yang ditemukan mungkin tidak lengkap.

## Tahap 4 — Indikator dan laporan awal

**Hasil:** analisis lokal berbasis aturan/statistik atas akun sumber, akun yang berinteraksi, dan pola jaringan yang berhasil dikumpulkan otomatis.

**Selesai jika:**

- tiap indikator menampilkan alasan dan bukti;
- laporan menunjukkan periode dan cakupan data;
- tersedia data uji untuk pola positif, pola normal, dan kasus ambigu.

## Tahap 5 — Evaluasi kualitas

**Hasil:** evaluasi hasil terhadap data berlabel yang ditinjau manusia.

**Selesai jika:**

- definisi label dan proses peninjauan dicatat;
- precision, recall, serta contoh false positive/false negative dilaporkan;
- batas penggunaan ditetapkan sebelum analisis diperluas.

## Tahap 6 — Bantuan AI (opsional)

**Hasil:** AI membantu merangkum atau mengelompokkan bukti tanpa menggantikan indikator terukur dan tinjauan manusia.

**Selesai jika:**

- masukan/keluaran AI dibatasi dan dicatat secara aman;
- keluaran AI tidak ditampilkan sebagai fakta tanpa bukti;
- evaluasi mencakup kesalahan, bahasa, bias, dan perubahan performa.

## Sasaran MVP

Sasaran MVP adalah CLI Bun yang menerima username atau URL/ID postingan, otomatis mengumpulkan data interaksi melalui API resmi dari satu platform pilihan, menemukan akun yang tersedia dari interaksi tersebut, lalu menjalankan analisis lokal yang dapat dijelaskan. Laporan menunjukkan cakupan dan batas penelusuran; penggunaan AI berbayar tetap opsional.
