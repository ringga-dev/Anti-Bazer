# Visi, Misi, Tujuan, dan Ruang Lingkup

## Visi

Mendorong riset percakapan publik yang lebih transparan dan dapat ditinjau dengan menjelaskan data apa yang tersedia, pola apa yang teramati, bagaimana hasil dibuat, dan bagian mana yang belum diketahui.

## Misi

1. Membantu peneliti meninjau sampel konten dan komentar yang diperoleh secara sah melalui API resmi atau akses yang telah diotorisasi.
2. Menyajikan indikator beserta bukti dan penjelasannya, bukan label yang tidak dapat diverifikasi.
3. Menyatakan cakupan, data yang hilang, ketidakpastian, dan batas akses platform secara eksplisit.
4. Menyediakan fondasi modular yang terdokumentasi agar pengembang dapat menambah provider dan kemampuan dengan aman.
5. Meminimalkan pengumpulan data dan mempertahankan peninjauan manusia untuk interpretasi yang berdampak.

## Tujuan aplikasi

Anti Bazer membantu pengguna mengumpulkan sampel konten media sosial dan meninjau pola yang mungkin relevan, misalnya teks berulang atau konsentrasi waktu komentar. Aplikasi juga dapat merangkum opini komentar secara agregat. Tujuan ini adalah **dukungan riset dan triase**, bukan verifikasi identitas atau penentuan motif.

### Istilah yang digunakan

- **Indikator pola**: sinyal dari sampel yang layak ditinjau lebih lanjut, bukan bukti final.
- **Sinyal koordinasi**: nilai heuristik tentang kekuatan pola tertentu; bukan probabilitas bahwa akun terkoordinasi.
- **Akun mencurigakan**: sebutan sementara untuk pola yang memerlukan pemeriksaan manusia, bukan bukti akun palsu.
- **AI**: alat bantu klasifikasi atau peringkasan teks; bukan sumber kebenaran tunggal.

## Kemampuan yang tersedia saat ini

- CLI dan HTTP API untuk memulai scan akun/profil atau post/video melalui URL.
- Deteksi platform dan tipe target dari URL yang didukung.
- Adapter untuk X, Instagram, TikTok, YouTube, dan Facebook dengan cakupan yang bergantung pada endpoint dan credential.
- Pengumpulan konten dan komentar yang memang dikembalikan API serta diizinkan oleh token.
- Indikator lokal yang dapat dijelaskan, termasuk pengulangan teks dan waktu komentar berdekatan jika tersedia data waktu yang memadai.
- Ringkasan stance komentar secara agregat dan per post menggunakan heuristik lokal atau endpoint AI kompatibel yang diaktifkan secara opsional.
- Pelaporan jumlah koleksi dan keterbatasan. Penilaian akun interaksi ditandai `not_implemented`.

Rincian per provider tersedia di [status fitur dan batasan](./status-fitur.md) serta [setup platform](./setup-platform.md).

## Di luar kemampuan saat ini

- Menemukan seluruh komentator, pemberi like, pembagi, atau akun yang berinteraksi.
- Mengambil dan menganalisis riwayat aktivitas masing-masing akun interaksi.
- Memberikan skor “fake/buzzer/orang asli” untuk setiap akun.
- Menetapkan identitas dunia nyata, niat, afiliasi politik, atau hubungan antarindividu.
- Menjamin cakupan seluruh data, seluruh akun, atau seluruh periode konten.
- Mengambil data dari akun privat, melewati kontrol akses, atau melakukan scraping untuk menghindari batas API.
- Melakukan tindakan otomatis terhadap akun, termasuk mengirim pesan, melaporkan, atau menargetkan.

Poin-poin yang mungkin dikembangkan ke depan harus melewati pemeriksaan ketersediaan API, izin, privasi, dan evaluasi. Baca [roadmap](./rencana-kerja.md), yang menjelaskan sasaran dan bukan daftar fitur yang seluruhnya telah selesai.

## Prinsip interpretasi

1. Hasil harus ditautkan dengan data sampel dan metode yang digunakan.
2. Tidak adanya data atau sinyal bukan bukti bahwa aktivitas tidak terjadi.
3. Skor agregat bukan probabilitas identitas, niat, atau keaslian.
4. Sampel kecil, bahasa, sarkasme, tren populer, dan data yang hilang dapat mengubah hasil.
5. Keputusan berdampak memerlukan konteks dan pemeriksaan manusia; jangan menggunakan hasil sebagai vonis.
6. Kumpulkan data seminimal mungkin, sesuai izin dan tujuan yang dinyatakan.

Untuk risiko operasional dan mitigasi, lihat [batasan, risiko, dan mitigasi](./batasan-dan-risiko.md).
