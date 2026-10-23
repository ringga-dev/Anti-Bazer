# Tujuan dan Ruang Lingkup

## Tujuan produk

Anti Bazer membantu pengguna memeriksa pola aktivitas akun dan konten yang mungkin menunjukkan otomatisasi atau koordinasi promosi. Aplikasi merangkum sinyal yang ditemukan agar pengguna dapat melakukan peninjauan lanjutan.

Sasaran awal:

1. Menganalisis data akun, unggahan, dan komentar yang diperoleh secara sah.
2. Menemukan pola aktivitas tidak biasa dan kemiripan konten antar akun.
3. Menampilkan alasan di balik setiap indikator, bukan hanya skor.
4. Menyediakan laporan yang menyatakan cakupan data dan ketidakpastian.
5. Memulai pengumpulan otomatis dari username akun atau URL/ID postingan, lalu menemukan akun yang berinteraksi melalui data yang tersedia dari API platform.

## Istilah dan batas interpretasi

- **Akun mencurigakan** adalah label kerja untuk akun yang menunjukkan satu atau lebih pola yang perlu diperiksa. Label ini bukan bukti bahwa akun palsu.
- **Pola koordinasi** berarti sejumlah akun memiliki kemiripan atau sinkronisasi aktivitas yang layak ditinjau. Pola itu sendiri tidak membuktikan adanya hubungan, kendali bersama, atau motif.
- **AI** dapat membantu mengelompokkan atau merangkum bukti, tetapi tidak menjadi satu-satunya dasar penilaian.
- **Orang asli atau buzzer** bukan klasifikasi yang dapat dipastikan hanya dari unggahan dan komentar. Aplikasi tidak boleh menyajikan dugaan tersebut sebagai fakta.

## Dalam ruang lingkup MVP

- Aplikasi terminal (CLI) menggunakan Bun dan TypeScript.
- Pengumpulan otomatis melalui API resmi dari satu platform yang dipilih.
- Input awal berupa username akun atau URL/ID postingan.
- Penemuan akun yang berinteraksi melalui jenis interaksi yang dapat diakses API, seperti balasan, komentar, mention, repost, atau like jika tersedia.
- Pemeriksaan akun yang ditemukan dan perluasan jaringan interaksi dengan batas kedalaman, jumlah akun, waktu, dan kuota yang jelas.
- Sinkronisasi terjadwal atau mekanisme streaming/webhook jika disediakan dan diizinkan platform.
- Validasi data yang diterima dari API.
- Analisis aturan dan statistik yang dapat dijelaskan.
- Laporan per akun dan pola antar akun dengan bukti pendukung.
- Penyimpanan lokal seperlunya, dengan perhatian pada minimisasi dan penghapusan data.

## Di luar ruang lingkup MVP

- Menyimpulkan identitas dunia nyata, niat, atau afiliasi politik seseorang.
- Mengakses akun privat, melewati kontrol akses, atau mengambil data tanpa izin.
- Mengirim pesan, melakukan tindakan terhadap akun, atau mengotomatisasi pelaporan akun.
- Mengandalkan AI sebagai penentu tunggal bahwa akun adalah palsu atau buzzer.
- Mendukung semua platform sekaligus sebelum akses dan kebutuhan tiap API dipahami.

## Pengguna dan hasil yang diharapkan

Pengguna memasukkan username akun atau URL/ID postingan. Aplikasi mengambil data yang tersedia dari API, mengidentifikasi akun yang berinteraksi, lalu memeriksa akun-akun tersebut sesuai cakupan dan batas yang telah ditetapkan. Hasil harus menyebutkan interaksi mana yang berhasil diperoleh, periode dan kedalaman penelusuran, serta keterbatasan API. Setiap kesimpulan harus dapat ditelusuri ke data dan indikator yang memicunya; pengguna tetap bertanggung jawab menilai konteksnya.
