# Desain halaman web XIX Vectorizer

Status: rancangan v2, 17 September 2026. Sudah diimplementasikan, dan bagian
harga serta ringkasan angka hasil disesuaikan pada revisi ini.

Acuan proses: `docs/DESKTOP-WEB-PAGE-STANDARD.md`.

## 1. Tujuan

Memberi XIX Vectorizer satu halaman publik di `xixlabs.net/vectorizer` yang
menjelaskan produk, mengizinkan percobaan gratis tanpa memasang apa pun,
dan menyediakan unduhan serta jalan menuju pembelian.

Halaman ini menggantikan keadaan sekarang, yaitu kartu di landing pusat
yang menampilkan `Segera tersedia` karena belum punya tautan.

## 2. Peran dan batas

Peran halaman: penjelasan produk, percobaan gratis, unduhan.

Yang tidak dikerjakan halaman ini:

| Urusan | Pemiliknya |
| --- | --- |
| Kode lisensi dan tiga langkah aktivasi setelah bayar | `/payment/complete` di landing pusat |
| Harga dan keputusan pembelian | Halaman checkout Mayar |
| Pemrosesan borongan dan kuota berbayar | Aplikasi desktop |

Alasannya, `/payment/complete` sudah menangani penyerahan setelah
pembayaran. Bila halaman ini juga menampilkan kode lisensi, akan ada dua
halaman yang mengerjakan hal yang sama dan keduanya akan berbeda seiring
waktu.

Halaman berhenti pada tombol menuju checkout. URL checkout diambil dari
katalog gateway saat build, bukan ditulis di kode.

## 3. Bagian halaman

Empat bagian, berurutan:

1. **Hero.** Judul, daftar keunggulan aplikasi, satu tombol coba gratis, dan
   pratinjau jendela aplikasi pada kolom kanan. Daftar keunggulan diletakkan
   di antara judul dan tombol, sehingga pengunjung membaca alasannya sebelum
   diminta menekan apa pun.
2. **Coba gratis.** Kotak unggah satu berkas, kemajuan per tahap, hasil
   sebelum-sesudah, tombol simpan SVG, tombol mulai ulang. Bagian ini tidak
   memakai judul sendiri: judul halaman di atasnya sudah menjelaskan isinya,
   dan tombol unggahnya cukup satu, yaitu yang ada di dalam kotak unggah.
3. **Unduh.** Dua kartu berdampingan. Kartu pertama menerangkan installer
   beserta syarat komputernya, kartu kedua menerangkan lisensi beserta harga,
   kuota, dan jalan menuju checkout. Pratinjau jendela aplikasi sudah tampil
   di hero, sehingga bagian ini tidak mengulangnya.
4. **Catatan kaki.** Bantuan, privasi, status layanan.

Harga tidak berdiri sebagai bagian tersendiri. Sebelumnya ada bagian "Yang
Anda dapat" di atas bagian unduhan, dan akibatnya tombol menuju checkout
muncul dua kali di satu halaman. Harga kini tinggal di kartu lisensi, di
dalam bagian unduhan, sehingga hanya ada satu jalan menuju checkout.

### Dasar tampilan

Halaman memakai shell halaman dashboard Animotion tanpa bagian sambutan
dan tanpa bagian daftar proyek. Yang diambil adalah kerangkanya: header,
latar bercahaya, gaya kartu, tipografi, focus ring, dan perilaku modal.
Isinya diganti seluruhnya.

### Palet

Sunset, dengan nilai yang sama seperti aplikasi desktop: aksen `#ffb36b`,
aksen kedua `#ff6b9d`, aksen ketiga `#ffd166`. Warna biru dan violet
tidak dipakai karena sudah menjadi identitas Animotion.

### Pratinjau jendela aplikasi

Aplikasi desktop tidak punya antarmuka web, jadi bagian unduhan memuat
pratinjau jendela aplikasi. Pratinjau ditempatkan pada kolom kanan hero,
bukan di bagian unduhan, supaya wujud produk terlihat pada layar pertama.
Pratinjau disalin dari aplikasi, bukan digambar ulang: ukuran jendela,
warna, tinggi bilah, urutan bagian, dan tulisan setiap sel diambil dari
berkas aplikasi. Paletnya palet aplikasi, bukan palet
halaman, dan variabelnya dikurung pada pembungkus pratinjau supaya tidak
membocorkan warna ke bagian halaman yang lain.

Keadaan yang dipotret adalah saat aplikasi bekerja, dengan daftar mesin
terbuka supaya pengunjung tahu aplikasi berisi tiga mesin. Angka pada layar
status, bilah kemajuan, dan daftar berkas menceritakan proses yang sama, dan
tidak ada baris gagal. Pratinjau bukan kontrol: isinya disembunyikan dari
teknologi bantu dan pembungkusnya diumumkan sebagai satu gambar. Aturan
lengkapnya di `docs/DESKTOP-WEB-PAGE-STANDARD.md` bagian Pratinjau aplikasi
desktop.

## 4. Aturan percobaan gratis

### Masukan

| Aturan | Nilai |
| --- | --- |
| Jumlah berkas per percobaan | 1 |
| Ukuran berkas maksimum | 5 MB |
| Batas piksel | 2 MP |
| Perlakuan di atas 2 MP | Diperkecil ke 2 MP, bukan ditolak |
| Batas keras | 40 MP, ditolak dengan pesan jelas |
| Format | PNG, JPEG, WebP |

Satu berkas per percobaan dipilih karena satu foto sudah memakan 3
sampai 7 detik, dan pengunjung yang menunggu antrean panjang akan pergi
sebelum melihat hasil. Antrean borongan tetap menjadi keunggulan aplikasi
berbayar.

### Pemrosesan

Mesin dijalankan sebagai worker di komputer pengunjung. Tidak ada berkas
yang diunggah ke server. Kemajuan ditampilkan apa adanya dari tahap yang
dilaporkan mesin, dan namanya diterjemahkan ke bahasa Indonesia di
tampilan.

### Hasil

- ditampilkan sebagai satu gambar pembanding dengan penggeser;
- bentuk bingkai mengikuti bentuk gambar asli;
- penggeser dapat dioperasikan dengan tetikus, sentuhan, dan tombol panah;
- tombol tahan-untuk-melihat-asli disediakan untuk layar sentuh;
- tombol simpan SVG tersedia, dan ringkasan angka hasil (ukuran berkas, waktu
  proses, dimensi, dan jumlah warna) tidak lagi ditampilkan karena hanya
  menambah keramaian di sebelah gambar;
- di bawah pembanding ada satu kalimat ajakan mengunduh aplikasi desktop,
  dengan bagian "Download XIX Vectorizer Desktop" dicetak tebal dan menunjuk
  bagian unduhan. Kalimat ini menggantikan petunjuk menggeser pembatas, yang
  pindah ke label pembaca layar pada bingkainya.

### Mesin sebagai satu sumber

`worker.js` dan `detect.js` disalin dari repo `XIX-Vectorizer` saat build,
beserta pencatatan sidik jari. Runner Node milik aplikasi desktop tidak
disalin, karena halaman memakai berkas lokal, bukan path berkas.

Obfuscate tidak dipakai. Hasilnya sudah diuji identik byte-per-byte pada
tiga kasus uji, tetapi ukuran berkas naik dari 38.914 byte menjadi
114.125 byte.

## 5. Keadaan yang harus ditangani

| Keadaan | Perilaku |
| --- | --- |
| Belum ada berkas | Petunjuk singkat dan tombol pilih berkas |
| Sedang membaca berkas | Indikator, dan penolakan bila format tidak dikenal |
| Gambar diperkecil | Dikerjakan tanpa pemberitahuan tersendiri. Ajakan mengunduh aplikasi desktop di bawah pembanding menyebut keunggulan mesin berbasis AI di sana, tempat ukuran penuh dipakai. |
| Sedang memproses | Nama tahap dan kemajuan sebenarnya |
| Selesai | Pembanding sebelum-sesudah, tombol simpan dan mulai ulang |
| Berkas terlalu besar | Pesan yang menyebut batas 5 MB |
| Gambar terlalu besar | Pesan yang menyebut batas 40 MP |
| Gagal diproses | Pesan kegagalan dan tombol coba lagi |

## 6. Kriteria penerimaan

Halaman dianggap selesai bila seluruh butir berikut terbukti, bukan
diasumsikan:

1. Percobaan pada gambar garis, logo, dan foto berhasil dengan hasil yang
   terlihat benar.
2. Hasil pada berkas yang sama identik dengan hasil aplikasi desktop.
3. Gambar di atas 2 MP diperkecil dan tetap berhasil.
4. Berkas di atas 5 MB dan di atas 40 MP ditolak dengan pesan yang
   menyebut batasnya.
5. Penggeser bekerja dengan tetikus, sentuhan, dan tombol panah.
6. Halaman tidak membeku selama pemrosesan.
7. SVG hasil dapat disimpan dan dibuka ulang.
8. Seluruh test lulus, dan halaman dijalankan serta dicoba langsung pada
   lebih dari satu ukuran layar.
9. Pratinjau jendela aplikasi sama dengan jendela aslinya pada ukuran,
   susunan bagian, dan tulisan setiap sel, serta tidak memuat baris gagal.
10. `xixlabs.net/vectorizer` membuka halaman, dan halaman Animotion serta
    landing pusat tidak terganggu.

## 7. Pekerjaan deployment

1. Repo private `mfahryf/XIX-Vectorizer-web` di GitHub.
2. Aplikasi `frontend-vectorizer` di Coolify, project `XIXLabs`,
   environment `production`, health check `200`.
3. Blok `location` baru pada nginx landing pusat, mengikuti pola
   `/animotion/`.
4. Pengalihan `301` dari `/vectorizer` ke `/vectorizer/`.
5. `base` aset diatur ke `/vectorizer/`.
6. Kartu Vectorizer di landing pusat diberi tautan.
7. Entri registry `xix-vectorizer` diperbarui dari `planned` menjadi
   status yang sesuai, dan `frontend_url` diisi.

## 8. Keputusan terbuka

1. **Alamat unduhan installer.** Belum ada tempat penyimpanan installer
   yang disepakati. Bagian unduhan tidak dapat diselesaikan sebelum ini
   ditentukan.
2. **Nama berkas mesin di browser.** Penamaan netral mengurangi jejak
   yang menunjuk pihak ketiga, tetapi mengubah nama berarti menyentuh
   pemanggilan di aplikasi desktop juga.
3. **Isi teks harga.** Nominal dan kuota harus dibaca dari katalog, bukan
   ditulis di halaman, supaya perubahan harga tidak memerlukan redeploy
   dua tempat. Cara pembacaannya perlu ditentukan: saat build, atau lewat
   endpoint publik gateway.

## 9. Catatan yang belum diverifikasi

Bagian ini mencatat hal yang belum terbukti supaya tidak diperlakukan
sebagai fakta.

- Waktu proses diukur pada mesin pengembang, bukan pada perangkat
  pengunjung. Perangkat kelas bawah dapat jauh lebih lambat, dan angka
  ini perlu diuji ulang pada perangkat nyata.
- Perilaku Safari belum diuji. Batas luas canvas dan cara memperkecil
  saat decode berbeda dari Chromium.
- Tampilan pada layar sentuh belum diuji.
