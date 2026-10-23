# Batasan, Risiko, dan Mitigasi

## Akses API dan aturan platform

**Risiko:** tiap platform memiliki izin aplikasi, kuota, biaya, batas riwayat, dan aturan penggunaan yang berbeda. API bisa saja tidak menyediakan pencarian username, daftar orang yang menyukai, komentar lengkap, atau daftar semua akun yang berinteraksi. Hasil pencarian postingan juga dapat dibatasi.

**Mitigasi:** pilih platform setelah memeriksa bahwa API resminya mendukung input dan jenis interaksi yang dibutuhkan; gunakan API resmi; tangani paginasi, rate limit, token kedaluwarsa, dan kegagalan jaringan; nyatakan dengan jelas data yang tidak dapat diakses. Otomatisasi hanya mencakup data yang disediakan API dan diizinkan, bukan scraping yang melewati kontrol akses. Jangan menjanjikan cakupan “semua akun”; tampilkan hasil sebagai akun yang ditemukan dari data API yang tersedia.

## Data tidak lengkap dan bias cakupan

**Risiko:** API dapat menyembunyikan, membatasi, mengurutkan, atau memotong daftar interaksi. Sebagian tipe interaksi mungkin tidak bisa diakses; akun privat atau konten yang dihapus juga tidak tersedia. Karena itu, akun yang ditemukan belum tentu seluruh akun yang berinteraksi.

**Mitigasi:** sertakan input seed, sumber, jenis interaksi, waktu dan periode pengambilan, jumlah hasil, kedalaman penelusuran, serta batas API pada setiap laporan. Jangan menganggap data yang tidak ditemukan sebagai bukti bahwa akun tidak berinteraksi.

## Kesalahan interpretasi dan kualitas AI

**Risiko:** sarkasme, bahasa campuran, tren, kutipan, atau peristiwa populer dapat menghasilkan kemiripan yang keliru. AI juga dapat mengarang penjelasan atau mereproduksi bias.

**Mitigasi:** gunakan AI untuk membantu merangkum atau mengelompokkan bukti; pertahankan aturan yang dapat dijelaskan; tampilkan sumber bukti; uji kesalahan pada data representatif; wajibkan peninjauan manusia untuk keputusan berdampak.

## Risiko salah tuduh

**Risiko:** memberi label “buzzer”, “palsu”, atau “bukan orang asli” dapat merugikan individu, padahal pola perilaku saja tidak membuktikan identitas, hubungan, atau motif.

**Mitigasi:** gunakan bahasa netral seperti “indikator yang perlu ditinjau”; tampilkan ketidakpastian; jangan membuat tindakan otomatis terhadap akun atau individu; jangan mengubah skor indikator menjadi klaim faktual.

## Privasi dan keamanan

**Risiko:** data akun, konten, serta token API dapat sensitif; penyimpanan berlebih meningkatkan dampak jika terjadi kebocoran.

**Mitigasi:** kumpulkan dan simpan seminimal mungkin; tetapkan retensi dan penghapusan; lindungi token API; batasi akses; jangan menaruh rahasia di kode atau log; tinjau dasar izin sebelum pemrosesan.

## Biaya dan kinerja

**Risiko:** biaya dapat berasal dari kuota atau paket API platform, pemanggilan model AI, dan infrastruktur. Analisis banyak akun atau mengirim seluruh isi unggahan/komentar ke AI dapat meningkatkan biaya dengan cepat.

**Mitigasi untuk menekan biaya sambil tetap mengumpulkan data otomatis:**

- Mulai dengan satu API provider dan analisis lokal berbasis aturan/statistik. Pengumpulan tetap otomatis; AI tidak diperlukan untuk mengambil data atau menghitung indikator dasar.
- Gunakan webhook atau streaming resmi jika tersedia dan sesuai kebutuhan, agar tidak melakukan polling terlalu sering. Jika harus polling, atur interval sesuai batas API dan kebutuhan kebaruan data.
- Batasi cakupan pada akun/postingan seed yang dimasukkan, jenis interaksi dan rentang waktu yang diperlukan, serta kedalaman dan jumlah akun maksimum. Hindari memperluas graf tanpa batas.
- Sinkronkan hanya data baru/perubahan sejak cursor atau waktu sinkronisasi terakhir; simpan ID/cursor agar tidak mengunduh ulang data yang sama.
- Gunakan AI secara opsional hanya untuk kasus yang lolos penyaringan awal atau perlu diringkas, dan minta persetujuan sebelum analisis berbayar.
- Kurangi data sebelum dikirim ke AI: hapus duplikasi, batasi rentang waktu dan jumlah konten, serta kirim ringkasan/fitur yang diperlukan alih-alih seluruh riwayat.
- Proses data bertahap dan jangan menganalisis ulang konten yang tidak berubah; terapkan retensi dan penghapusan pada data mentah maupun cache.
- Tetapkan batas keras untuk akun, volume data, frekuensi sinkronisasi, dan anggaran. Jeda pengumpulan ketika batas tercapai dan beri tahu pengguna, bukan terus berjalan diam-diam.
- Tampilkan perkiraan penggunaan/biaya sebelum mengaktifkan sumber serta catat pemakaian aktual per API dan analisis AI.
- Uji biaya pada volume realistis dari API pilihan sebelum memperluas cakupan; API gratis atau kuota tertentu tidak boleh diasumsikan selalu tersedia.
- Periksa kuota dan harga resmi setiap provider sebelum integrasi; jangan mengandalkan paket gratis atau mengakali batas penggunaan.

Untuk MVP, pendekatan hemat yang tetap otomatis adalah satu API resmi, pengumpulan inkremental dengan interval yang sesuai kuota, dan analisis lokal tanpa AI berbayar. Biaya API platform mungkin tetap ada dan bergantung pada akses serta paket yang tersedia.

## Data pembanding dan evaluasi

**Risiko:** tanpa label yang ditinjau manusia, klaim “akurasi tinggi” tidak dapat dibuktikan. Label manusia juga dapat tidak konsisten.

**Mitigasi:** susun pedoman anotasi, catat ketidaksetujuan penilai, pisahkan data pengembangan dan evaluasi, serta laporkan precision/recall dan contoh kesalahan. Hindari klaim performa jika jumlah atau kualitas data belum memadai.
