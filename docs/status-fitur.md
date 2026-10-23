# Status Fitur, Kelebihan, dan Batasan

Dokumen ini membedakan kemampuan yang benar-benar tersedia di kode saat ini dari sasaran yang masih memerlukan implementasi. Status credential di CLI hanya menunjukkan apakah nilai konfigurasi tersedia; status itu tidak membuktikan token valid atau akses API berhasil.

## Ringkasan status

| Area | Tersedia saat ini | Belum tersedia / batas utama |
|---|---|---|
| Input | URL akun/profil atau post/video; deteksi platform dan jenis target dari URL; CLI menerima shorthand dan opsi | Pencarian global bebas berdasarkan kata kunci tidak menjadi cakupan umum semua provider |
| Koleksi | Adapter untuk X, Instagram, TikTok, YouTube, dan Facebook | Dukungan berbeda-beda; keberadaan adapter bukan jaminan endpoint, akses, atau seluruh tipe interaksi tersedia |
| Analisis konten | Sinyal lokal yang dapat dijelaskan, seperti teks berulang dan konsentrasi waktu komentar jika data waktu cukup | Belum ada model tervalidasi untuk menyimpulkan akun palsu/buzzer atau mengukur probabilitas identitas |
| Komentar | Hitungan opini agregat: agree, disagree, neutral, unclear; keseluruhan dan per post | Tidak menghasilkan penilaian individu, profil, atau identitas komentator |
| AI | Opsional, melalui endpoint chat-completions yang kompatibel; dapat membantu ringkasan dan klasifikasi stance | Bukan sistem deteksi otomatisasi yang tervalidasi; keluaran bergantung pada model, instruksi, bahasa, dan konteks |
| CLI | Perintah scan, status provider, pemeriksaan konfigurasi, serta bantuan | Pemeriksaan konfigurasi hanya mengecek keberadaan nilai, bukan menguji token |
| HTTP API | Health check, submit scan, cek status, ambil hasil; proteksi token saat bind non-loopback | Job dan hasil disimpan di memori proses; tidak ada persistensi, antrean tahan restart, atau autentikasi pengguna/role |
| Analisis akun yang berinteraksi | Cakupan mencatat `not_implemented` | Tidak menemukan semua akun komentator/liker/share, tidak mengambil riwayat mereka, dan tidak memberi skor per akun |
| Evaluasi | Unit/regression tests mencakup alur aplikasi dan adapter yang diuji | Belum ada benchmark publik atau evaluasi akurasi berbasis dataset berlabel yang membenarkan klaim performa |

Untuk rincian request/response dan command line, lihat [referensi API dan CLI](./api-cli.md). Untuk menambah adapter atau kemampuan analisis, lihat [panduan developer](./developer-guide.md).

## Kelebihan dan nilai yang diberikan

1. **Cakupan dinyatakan secara eksplisit.** Hasil memuat jumlah posting dan komentar yang terkumpul serta mengakui bahwa penilaian akun interaksi belum diimplementasikan.
2. **Sinyal lebih mudah ditinjau.** Indikator lokal menyertakan nama, skor sinyal, penjelasan, dan bukti; bukan hanya sebuah label.
3. **Analisis opini terhubung ke konteks.** Ringkasan stance tersedia total maupun per post, dan komentar tanpa post yang cocok dapat dipisahkan.
4. **Integrasi dipisah per provider.** Kode adapter tidak perlu dicampur ke logika analisis umum, sehingga perubahan provider lebih terisolasi.
5. **Dapat dijalankan melalui CLI maupun HTTP API.** Keduanya memakai alur scan yang sama, sehingga perilaku inti tidak perlu dibuat ulang untuk setiap antarmuka.
6. **AI opsional.** Pengguna dapat memulai dengan heuristik lokal dan hanya mengaktifkan model bila diperlukan serta telah mempertimbangkan privasi dan biaya.
7. **Batas pengambilan dapat dikonfigurasi.** Pembatas jumlah posting, komentar, dan halaman mengurangi risiko konsumsi kuota maupun biaya yang tidak terkendali.
8. **Akses platform mengikuti izin API.** Desain tidak mensyaratkan scraping atau pelewatan kontrol akses.

## Kekurangan dan risiko kualitas

- **Akses data tidak seragam.** API platform menentukan akun, konten, komentar, riwayat, dan identitas interaksi mana yang dapat dibaca. Aplikasi tidak dapat mengatasi data yang memang tidak diberikan provider.
- **Cakupan dapat bias atau tidak lengkap.** Pembatasan API, paginasi, moderasi, komentar yang dinonaktifkan, data terhapus, rentang waktu, dan izin dapat memengaruhi sampel.
- **Heuristik bukan detektor buzzer.** Teks berulang atau waktu komentar yang berdekatan bisa terjadi secara alami (misalnya kutipan, kampanye publik, acara langsung, atau template).
- **Stance lokal dangkal.** Pencocokan kata kunci dapat salah memahami negasi, sarkasme, bahasa campuran, konteks, atau komentar yang memiliki lebih dari satu sikap.
- **AI dapat keliru atau bias.** Model dapat salah klasifikasi, menghilangkan nuansa, atau memberi ringkasan yang tidak akurat; keputusan penting tetap perlu pemeriksaan manusia.
- **Belum ada bukti akurasi empiris.** Tes perangkat lunak menjamin perilaku kode tertentu, bukan akurasi sosial/analitis pada populasi nyata.
- **Komentator tidak dianalisis per individu.** Belum ada account discovery, graf interaksi yang lengkap, analisis riwayat komentator, ataupun klasifikasi per akun.
- **HTTP API bukan layanan produksi lengkap.** Job in-memory hilang ketika server berhenti; belum ada database job, retry tahan restart, rate limiting per pengguna, audit log, atau sistem multi-tenant.
- **Kredensial dan biaya perlu dikelola operator.** Kuota atau harga API/model berubah dan bergantung pada akun, region, paket, serta izin.

## Catatan per provider

| Provider | Fokus akses adapter | Batas utama |
|---|---|---|
| YouTube | Metadata channel/video dan komentar yang tersedia melalui YouTube Data API | Kuota API; komentar dapat dinonaktifkan atau tidak tersedia |
| X | Lookup user/post serta balasan/pencarian terbaru jika tier API dan izin mendukung | Endpoint, periode, dan volume bergantung pada access tier; akses mungkin berbayar |
| Instagram | Media dan komentar pada akun profesional yang diotorisasi | Tidak dapat memindai sembarang akun publik; memerlukan konfigurasi Meta yang sesuai |
| TikTok | Profil dan video dari pengguna yang memberi otorisasi melalui Display API | Tidak menyediakan komentar video publik untuk stance analysis dan bukan pencarian umum akun |
| Facebook | Objek/post dan komentar yang diizinkan token | Akses bergantung pada jenis objek, izin, jenis token, dan App Review; profil personal sembarang tidak didukung |

Kapabilitas provider dapat berubah. Periksa [dokumentasi resmi provider](./setup-platform.md#official-documentation) sebelum membangun atau menjalankan integrasi.

## Klaim hasil yang diperbolehkan

Gunakan bahasa yang sesuai bukti, misalnya:

- “Terdapat teks berulang pada sampel yang dikumpulkan.”
- “Sebagian komentar yang tersedia diposting dalam interval waktu berdekatan.”
- “Pada komentar yang dianalisis, X% terklasifikasi sebagai setuju oleh metode yang disebutkan.”
- “Sampel terlalu kecil / cakupan komentar terbatas untuk menarik kesimpulan kuat.”

Jangan menyatakan:

- “Akun ini pasti buzzer/palsu/bukan orang asli.”
- “Persentase ini adalah peluang akun tersebut palsu.”
- “Semua komentator atau interaksi telah diperiksa.”
- “AI memastikan niat, afiliasi, atau identitas pengguna.”

## Prioritas pengembangan yang disarankan

1. Verifikasi dan dokumentasikan cakupan nyata tiap endpoint dengan fixture serta pengujian adapter.
2. Perbaiki evaluasi stance multibahasa dan indikator dengan dataset berlabel yang ditinjau manusia.
3. Tambahkan retensi, penghapusan, dan perlindungan data yang jelas sebelum memperluas pengumpulan.
4. Jika membangun account discovery, mulai hanya pada provider yang memang menyediakan identitas interaksi dan izin yang sesuai; laporkan truncation, kedalaman, serta coverage.
5. Jika API akan dipakai lebih luas, tambahkan penyimpanan persisten, pembatasan akses dan beban, observabilitas, serta prosedur operasional sebelum deployment.
