# Dokumentasi Anti Bazer

Dokumentasi ini mencakup cara menggunakan dan mengembangkan aplikasi, status kemampuan saat ini, integrasi API resmi, serta prinsip penggunaan yang bertanggung jawab. Anti Bazer adalah proyek Bun/TypeScript dengan CLI dan HTTP API untuk mengumpulkan sampel konten yang diizinkan dan menyajikan sinyal yang dapat ditinjau manusia.

> **Penting:** aplikasi tidak menetapkan bahwa seseorang adalah buzzer, akun palsu, atau orang asli. Analisis akun individual yang berinteraksi belum diimplementasikan. Lihat [status fitur dan batasan](./status-fitur.md) sebelum menyimpulkan apa pun dari hasil.

## Mulai dari sini

| Tujuan | Dokumen |
|---|---|
| Memahami visi, misi, dan batas tujuan produk | [Tujuan dan ruang lingkup](./tujuan-dan-ruang-lingkup.md) |
| Menjalankan aplikasi dari source | [README proyek](../README.md) |
| Mengembangkan atau menambah provider/analisis | [Panduan developer](./developer-guide.md) |
| Mengetahui fitur, kelebihan, kekurangan, dan batas provider | [Status fitur dan batasan](./status-fitur.md) |
| Menggunakan CLI atau HTTP API | [Referensi API dan CLI](./api-cli.md) |
| Mengatur credential API dan model AI | [Setup platform](./setup-platform.md) |
| Menyiapkan versi dan rilis GitHub | [Proses rilis](./release-process.md) |

## Referensi teknis dan produk

- [Rancangan MVP dan arsitektur](./rancangan-mvp.md): teknologi dan alur implementasi.
- [Rencana kerja](./rencana-kerja.md): tahapan pengembangan berikutnya; sasaran roadmap belum tentu telah tersedia.
- [Struktur proyek](./struktur-proyek.md): tata letak source dan tanggung jawab modul.
- [Indikator analisis](./indikator-analisis.md): sinyal, penyajian skor, dan evaluasi.
- [Batasan, risiko, dan mitigasi](./batasan-dan-risiko.md): akses API, kualitas, privasi, biaya, dan risiko salah tafsir.
- [Proses rilis](./release-process.md): Semantic Versioning, tag, pemeriksaan CI, dan GitHub Release.
- [Kontribusi](../CONTRIBUTING.md): panduan pull request dan standar perubahan.
- [Kebijakan keamanan](../SECURITY.md): pelaporan kerentanan secara privat.
- [Kode etik](../CODE_OF_CONDUCT.md): standar partisipasi komunitas.
- [Lisensi MIT](../LICENSE): ketentuan lisensi source proyek.

## Prinsip dokumentasi

Dokumentasi membedakan fitur yang aktif, fitur yang direncanakan, dan hal yang tidak dapat disimpulkan. Integrasi API tunduk pada izin, kuota, dan kebijakan masing-masing platform. AI opsional bukan pengganti bukti atau peninjauan manusia.
