# Dokumentasi Anti Bazer

Dokumen ini mengumpulkan rancangan aplikasi Anti Bazer berbasis Bun dan TypeScript. Aplikasi menyediakan CLI dan HTTP API untuk menganalisis konten yang tersedia dari platform, lalu menyajikan indikator dan bukti untuk ditinjau manusia.

## Isi dokumen

- [Tujuan dan ruang lingkup](./tujuan-dan-ruang-lingkup.md): masalah yang ingin dibantu, sasaran, dan hal yang bukan tujuan aplikasi.
- [Rancangan MVP dan arsitektur](./rancangan-mvp.md): teknologi dan alur penggunaan yang disarankan.
- [Rencana kerja dan sasaran](./rencana-kerja.md): tahapan implementasi beserta kriteria selesai.
- [Struktur proyek](./struktur-proyek.md): struktur source set Bun/TypeScript dengan fitur yang dikelompokkan tanpa pohon folder duplikat.
- [Setup API platform](./setup-platform.md): konfigurasi credential dan batas integrasi API resmi.
- [Referensi API dan CLI](./api-cli.md): alur input akun/postingan sesuai tujuan produk, bentuk hasil saat ini vs tujuan lanjutan, endpoint, request/response, error HTTP, dan perintah terminal.
- [Indikator analisis](./indikator-analisis.md): sinyal yang dapat diperiksa dan cara menyampaikan hasilnya.
- [Batasan, risiko, dan mitigasi](./batasan-dan-risiko.md): kendala API, akurasi, privasi, biaya, dan risiko salah tafsir.

## Prinsip utama

Analisis menghasilkan indikator perilaku dan pola koordinasi, bukan kepastian mengenai identitas atau motif seseorang. Hasil perlu menyertakan bukti, cakupan data, tingkat keyakinan, dan ketidakpastian.

Alur MVP: pengguna memasukkan URL akun atau postingan, lalu aplikasi mengumpulkan data yang tersedia melalui API resmi dan menganalisis konten. Laporan menampilkan indikator koordinasi, penjelasan, cakupan data, serta opini komentar secara agregat. Hasil bukan vonis identitas atau motif; jenis interaksi yang tersedia berbeda menurut platform dan izin.
