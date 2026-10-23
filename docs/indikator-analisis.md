# Indikator Analisis

Indikator adalah sinyal untuk pemeriksaan, bukan bukti final. Ambang batas perlu diuji pada data representatif dan tidak boleh dianggap universal untuk semua platform, bahasa, atau komunitas.

## Kandidat indikator awal

1. **Frekuensi dan waktu aktivitas** — volume unggahan/komentar, interval, atau aktivitas pada jam tertentu dibandingkan rentang analisis yang tersedia.
2. **Kemiripan teks** — frasa atau isi yang sangat mirip antar akun, dengan konteks bahasa dan konten populer dipertimbangkan.
3. **Sinkronisasi waktu** — beberapa akun mengunggah konten serupa dalam rentang waktu berdekatan.
4. **Pengulangan tautan atau tagar** — pengulangan yang tidak biasa dibandingkan data pembanding yang relevan.
5. **Pola antar akun** — kombinasi kemiripan konten, waktu, dan aktivitas yang mungkin layak ditinjau bersama.
6. **Graf interaksi** — hubungan yang teramati antara akun sumber, postingan, dan akun yang membalas, berkomentar, menyebut, membagikan, atau menyukai jika jenis data tersebut tersedia melalui API. Hubungan menunjukkan interaksi yang terlihat, bukan bukti bahwa akun saling mengenal atau bekerja sama.

Jumlah pengikut, frekuensi tinggi, kemiripan frasa umum, atau penggunaan tagar populer tidak cukup sebagai dasar tunggal untuk menandai akun.

## Penelusuran dari akun atau postingan awal

- Simpan input awal sebagai seed: username akun atau ID/URL postingan.
- Temukan akun yang berinteraksi hanya dari jenis interaksi yang benar-benar diberikan API platform.
- Bedakan interaksi langsung dengan interaksi yang ditemukan setelah memperluas penelusuran ke akun lain.
- Catat kedalaman penelusuran, rentang waktu, jumlah hasil, halaman yang diambil, serta batas API/kuota.
- Batasi jumlah akun dan kedalaman agar proses terkendali; jangan menyatakan bahwa sistem memeriksa “semua akun” jika endpoint hanya mengembalikan sebagian hasil.

## Penyajian skor

- Tampilkan indikator individual beserta alasan, bukan hanya satu skor gabungan.
- Jika ada skor gabungan, jelaskan bagaimana skor dihitung dan versi aturan yang digunakan.
- Bedakan “data tidak cukup” dari “indikator tidak ditemukan”.
- Gunakan tingkat keyakinan sebagai deskripsi keterbatasan bukti, bukan probabilitas identitas akun kecuali memang dikalibrasi dan diuji.
- Sertakan contoh dan konteks pendukung dengan akses terbatas sesuai kebutuhan privasi.

## Evaluasi

Kualitas indikator dinilai memakai data yang penilaiannya dilakukan manusia dan memiliki pedoman label yang konsisten. Ukur setidaknya:

- precision dan recall per indikator;
- false positive dan false negative;
- kinerja menurut bahasa, rentang waktu, dan karakteristik sumber yang relevan;
- dampak data yang hilang atau cakupan API yang terbatas.

Jika hasil evaluasi tidak memadai atau data pembanding tidak tersedia, tampilkan hasil sebagai eksplorasi dan jangan mengklaim akurasi yang belum dibuktikan.
