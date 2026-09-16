# Standar Halaman Web untuk Aplikasi Desktop XIXLabs

Dokumen ini adalah acuan untuk membangun halaman publik aplikasi desktop
`XIX-*` di domain pusat. Implementasi pertama dan referensinya adalah
XIX-Vectorizer. Padanan untuk aplikasi web ada di
`XIX-AnimotionV2/docs/WEB-APP-INTEGRATION-STANDARD.md`, dan padanan untuk
aplikasi desktopnya sendiri ada di
`XIX-Vectorizer/docs/XIX-DESKTOP-UI-STANDARD.md`.

Dokumen ini tidak mengulang kontrak yang sudah dimiliki layanan pusat.
Fungsinya adalah pintu masuk: memetakan di mana setiap kontrak tinggal,
lalu menetapkan peran halaman, urutan kerja, dan batas tanggung jawab.

## 1. Kapan dokumen ini dipakai

Dipakai ketika sebuah aplikasi desktop membutuhkan halaman publik di
`xixlabs.net`. Halaman itu bukan aplikasinya dan bukan halaman hasil
pembayaran. Ia menjelaskan produk, memberi percobaan gratis, dan
menyediakan unduhan.

## 2. Peta dokumen

Baca dokumen berikut sebelum mulai. Jangan menyalin isinya ke dokumen
aplikasi baru, karena salinan akan menyimpang dari sumbernya.

| Topik | Dokumen |
| --- | --- |
| Metadata operasional dan gate sebelum production | `XIXLabs.net/docs/integration-template.md` |
| Sistem UI bersama | `XIXLabs.net/docs/design-system.md` |
| Struktur landing, katalog kartu, dan tabel routing | `XIXLabs.net/docs/landing-page-spec.md` |
| Model monetisasi dan entitlement | `XIXLabs.net/docs/licensing-and-monetization.md` |
| Kontrak lisensi desktop | `XIX-Vectorizer/docs/DESKTOP-LICENSING-CONTRACT.md` |
| Standar UI dan modal lisensi aplikasi desktop | `XIX-Vectorizer/docs/XIX-DESKTOP-UI-STANDARD.md` |
| Menambah produk dan route webhook | `XIX-Payment-Gateway/docs/ADDING-APPLICATION.md` |
| Pindah dari sandbox ke production | `XIX-Payment-Gateway/docs/PRODUCTION-CUTOVER.md` |
| Registry aplikasi platform | `XIXLabs.net/registry/applications.yaml` |

## 3. Peran dan batas halaman

Halaman desktop berperan sebagai **penjelasan produk, percobaan gratis, dan
unduhan**. Ia bukan aplikasinya, karena aplikasi desktop berjalan di
perangkat pengguna dan tidak memiliki antarmuka web.

Bagian yang tetap berada di halaman lain:

| Urusan | Pemiliknya |
| --- | --- |
| Kode lisensi dan tiga langkah aktivasi setelah bayar | Halaman `/payment/complete` milik landing pusat |
| Harga dan keputusan pembelian | Halaman checkout provider |
| Pemrosesan berkas sungguhan dalam jumlah banyak | Aplikasi desktop |

Halaman desktop tidak menampilkan kode lisensi, tidak menerima kode
lisensi, dan tidak menebak status pembayaran. Ia berhenti pada tombol
menuju checkout.

## 4. Rute dan deployment

Setiap halaman desktop memakai satu path di bawah domain pusat, bukan
subdomain sendiri.

```text
xixlabs.net/
|-- landing pusat (xixlabs-landing)
|-- animotion/    -> frontend-animotion
|-- vectorizer/   -> frontend-vectorizer
```

Konsekuensi yang harus dikerjakan, dan ini berlaku untuk setiap halaman
desktop baru:

1. Aplikasi baru di Coolify pada project `XIXLabs`, environment
   `production`, dengan health check yang mengembalikan `200`.
2. Blok `location` baru pada konfigurasi nginx landing pusat, mengikuti
   pola blok `/animotion/`.
3. `base` build aset diatur ke path halaman, misalnya `/vectorizer/`,
   supaya berkas tidak dimuat dari akar domain.
4. Blok `location = /<app>` mengembalikan `301` ke `/<app>/`.
5. Aset yang tidak ada tetap mengembalikan `404`, bukan fallback HTML.

Konfigurasi nginx memakai alamat sslip.io milik aplikasi sebagai
upstream, bukan nama domain publik. Alasannya, Cloudflare dapat
mengarahkan upstream kembali ke landing pusat bila permintaan memakai
Host publik. Pola ini sudah dipakai blok `/animotion/`.

## 5. Mesin di browser

Percobaan gratis berjalan sepenuhnya di komputer pengunjung. Pilihan ini
diambil karena biaya server nol, tidak ada antrean, dan halaman tetap
hidup walau layanan lain sedang gangguan. Harga dari pilihan ini: kode
mesin ikut terkirim ke browser dan dapat dibaca siapa pun.

### Satu sumber mesin

Mesin vektor juga dimiliki aplikasi desktop. Menyalinnya secara manual
ke repo halaman akan menghasilkan dua salinan yang menyimpang. Aturannya:

- sumber kebenaran adalah repo aplikasi desktop;
- repo halaman menyalinnya lewat script saat build, bukan disimpan
  sebagai berkas yang dirawat tangan;
- script mencatat sidik jari berkas sumber, dan build gagal bila sidik
  jari berbeda dari yang tercatat;
- hanya bagian yang berjalan di browser yang disalin. Runner Node milik
  aplikasi desktop tidak ikut, karena halaman memakai berkas lokal.

### Bentuk berkas mesin

Berkas mesin sudah terminifikasi sejak awal. Pada XIX-Vectorizer,
`worker.js` berukuran 38.914 byte tetapi hanya berisi dua baris, dengan
baris terpanjang 31.134 karakter. Artinya sumber asli yang dapat dibaca
tidak berada di repo aplikasi, dan repo halaman juga tidak akan
memilikinya.

Obfuscate tidak dipakai. Pengujian pada XIX-Vectorizer menunjukkan hasil
vektor identik byte-per-byte pada tiga kasus uji, tetapi ukuran berkas
naik dari 38.914 byte menjadi 114.125 byte. Kenaikan itu langsung
menambah waktu muat halaman tanpa melindungi apa pun, karena berkasnya
sudah tidak terbaca. Perlindungan yang dipakai adalah penamaan: folder
dan berkas mesin diberi nama netral, serta komentar yang menunjuk pihak
ketiga dihapus.

### Cara memanggil mesin

Mesin dijalankan sebagai worker, bukan di alur utama, supaya halaman
tidak membeku. Mesin mengirim kemajuan bertahap lewat `postMessage`
dengan nama tahap dalam bahasa Inggris dan nilai pecahan nol sampai
satu. Nama tahap itu diterjemahkan di tampilan, bukan di dalam mesin.

Mesin mengembalikan SVG mentah. Penyesuaian akhir yang dilakukan
aplikasi desktop setelah itu tetap perlu ditiru agar hasil halaman dan
aplikasi sama: memastikan `viewBox` ada, menyesuaikan bingkai, dan
menyelaraskan dimensi.

## 6. Batas masukan berkas dan piksel

Dua batas ini berbeda dan keduanya diperlukan.

**Batas ukuran berkas** melindungi dari berkas yang terlalu besar untuk
dibaca dengan nyaman. Nilai yang dipakai: 5 MB.

**Batas piksel** melindungi dari gambar yang membekukan browser.
Ukuran berkas tidak membatasinya. JPEG 5 MB dapat mengembang menjadi
belasan megapiksel saat dibuka. Nilai yang dipakai: 2 megapiksel.

Gambar di atas 2 megapiksel **diperkecil** ke 2 megapiksel, bukan
ditolak. Alasan memilih memperkecil daripada menolak: pengunjung yang
ditolak akan pergi, sedangkan pengunjung yang gambarnya dikecilkan tetap
mendapat hasil yang baik. Untuk dilihat di layar, hasil vektor pada 2
megapiksel tidak kehilangan ketajaman saat diperbesar.

Patokan 2 megapiksel:

| Bentuk | Ukuran | Total |
| --- | --- | --- |
| Persegi | 1414 x 1414 | 2,00 MP |
| 4:3 | 1600 x 1250 | 2,00 MP |
| 3:2 | 1732 x 1155 | 2,00 MP |
| 16:9 | 1886 x 1061 | 2,00 MP |
| Full HD | 1920 x 1080 | 2,07 MP, ikut diperkecil |

Yang perlu diperhatikan saat memilih nilai batas:

- sisi panjang dibatasi sama seperti sisi pendek; 2 megapiksel adalah
  luas, bukan panjang sisi, sehingga gambar sangat lebar tetap masuk;
- `createImageBitmap` dengan `resizeWidth` mengecilkan saat decode,
  sehingga tidak ada canvas perantara berukuran penuh di memori;
- tanpa `resizeWidth`, canvas perantara dapat gagal pada Safari karena
  batas luas canvas sekitar 16,7 megapiksel, dan gagal senyap: terjadi
  `security error` atau bitmap kosong, bukan kesalahan yang jelas;
- batas 40 megapiksel tetap dipasang sebagai pembatas keras untuk
  berkas yang lebih besar dari 5 MB, dan ditolak dengan pesan jelas;
- gambar dengan transparansi harus diletakkan di atas putih, karena
  mesin memperlakukan alpha sebagai campuran ke putih;
- rasterisasi SVG hasil memakai ukuran piksel, bukan resolusi fisik,
  supaya tampilan sama di semua perangkat;
- orientasi dari EXIF harus dihormati, supaya foto ponsel tidak muncul
  menyamping.

## 7. Menampilkan hasil

Hasil ditampilkan sebagai satu gambar pembanding sebelum-sesudah dengan
penggeser, bukan sebagai elemen SVG langsung. Alasan: hasil dapat berisi
ribuan potongan, dan menyisipkannya langsung membuat halaman berat.
Rasterisasi untuk tampilan memakai skala yang mengikuti lebar area.

Ketentuan tampilan:

- bentuk bingkai mengikuti bentuk gambar asli, bukan dipaksa 16:9,
  supaya logo persegi tidak terpotong;
- penggeser dapat dioperasikan dengan tetikus, sentuhan, dan tombol
  panah, dengan peran pembaca layar yang benar;
- disediakan tombol tahan-untuk-melihat-asli, karena menggeser garis
  pembatas di layar sentuh tidak nyaman;
- disediakan tombol simpan SVG, dan ukuran berkasnya disebutkan;
- disediakan tombol mulai ulang.

## 8. Monetisasi dan tombol pembelian

Halaman tidak pernah menampilkan kunci API provider, tidak membuat
invoice sendiri, dan tidak menebak status pembayaran. Tombol pembelian
mengarah ke URL checkout publik yang sudah terverifikasi.

**URL checkout hanya boleh punya satu sumber.** Nilai yang benar adalah
yang tercatat di katalog gateway. Menyalin URL itu ke beberapa tempat
sudah pernah menimbulkan kegagalan nyata: katalog gateway menunjuk satu
produk Mayar, sementara aplikasi dan halaman menunjuk produk sandbox
lain, sehingga kode lisensi yang terbit tidak dikenali gateway. Ambil
nilai itu dari katalog pada saat build, dan jangan menuliskannya di
dalam kode.

## 9. Palet dan UI

Halaman memakai shell dan komponen dasar yang sama dengan Animotion,
sesuai `XIXLabs.net/docs/design-system.md`. Perbedaan antar aplikasi
hanya palet warna, ikon, nama, dan konten.

Palet halaman harus sama dengan palet aplikasi desktopnya, supaya
pengunjung yang baru mengunduh merasa melanjutkan hal yang sama. Untuk
XIX-Vectorizer, paletnya sunset: aksen `#ffb36b`, aksen kedua `#ff6b9d`,
aksen ketiga `#ffd166`.

Setiap halaman wajib memiliki state loading, empty, error, dan success.
Semua kontrol keyboard memiliki focus ring, dan gerakan animasi dapat
dikurangi pada perangkat yang meminta `prefers-reduced-motion`.

## 10. Nilai yang perlu ditentukan per aplikasi

| Nilai | Contoh | Catatan |
| --- | --- | --- |
| `app_key` | `xix-vectorizer` | Sama dengan `product_id` di katalog |
| Path halaman | `/vectorizer` | Path di domain pusat |
| Repo halaman | `mfahryf/XIX-Vectorizer-web` | Private, repo terpisah |
| `base` aset | `/vectorizer/` | Bukan akar domain |
| Nama aplikasi Coolify | `frontend-vectorizer` | Project `XIXLabs` |
| Sumber mesin | `XIX-Vectorizer/src-tauri/` | Disalin saat build |
| Berkas mesin di browser | `worker.js`, `detect.js` | Runner Node tidak ikut |
| Batas ukuran berkas | 5 MB | Ditolak bila lebih |
| Batas piksel | 2 MP | Diperkecil, bukan ditolak |
| Palet | Sunset | Sama dengan aplikasi desktop |
| URL checkout | Dari katalog gateway | Jangan ditulis di kode |
| Halaman bantuan setelah bayar | `/payment/complete` | Milik landing pusat |

## 11. Checklist QA sebelum produksi

### Percobaan gratis

- [ ] Satu berkas per percobaan, dan percobaan dapat diulang tanpa batas.
- [ ] Gambar garis, logo, dan foto menghasilkan vektor yang benar.
- [ ] Gambar di atas 2 megapiksel diperkecil dan tetap berhasil.
- [ ] Berkas di atas 5 MB ditolak dengan pesan yang menyebut batasnya.
- [ ] Berkas yang bukan gambar ditolak dengan pesan yang dapat dipahami.
- [ ] Kemajuan tampil bertahap dan sesuai tahap mesin yang sebenarnya.
- [ ] Halaman tidak membeku selama pemrosesan pada perangkat kelas bawah.
- [ ] Hasil sama dengan hasil aplikasi desktop pada berkas yang sama.
- [ ] Penggeser bekerja dengan tetikus, sentuhan, dan tombol panah.
- [ ] Tombol simpan menghasilkan SVG yang dapat dibuka ulang.

### Deployment

- [ ] `xixlabs.net/<app>` membuka halaman, dan `/<app>/` juga.
- [ ] Refresh langsung pada path halaman tetap membuka halaman.
- [ ] Aset dimuat dari path halaman, bukan dari akar domain.
- [ ] Aset yang tidak ada mengembalikan `404`, bukan fallback HTML.
- [ ] Health check aplikasi mengembalikan `200`.
- [ ] Halaman Animotion dan landing pusat tidak terganggu.

### Keamanan dan isi

- [ ] Tidak ada kunci API provider, client secret, atau token admin di
      source, bundle, log, atau screenshot.
- [ ] Tombol pembelian menunjuk produk yang sama dengan katalog gateway.
- [ ] Halaman tidak menampilkan atau menerima kode lisensi.
- [ ] Entri registry aplikasi diperbarui.

## 12. Kegagalan yang sudah pernah terjadi

Bagian ini mencatat kejadian nyata pada integrasi XIX-Vectorizer supaya
tidak terulang, dan supaya halaman aplikasi desktop berikutnya mengenali
gejalanya lebih cepat.

| Gejala | Penyebab | Penanganan |
| --- | --- | --- |
| Kode lisensi terbit tetapi ditolak gateway | URL checkout di halaman dan aplikasi menunjuk produk Mayar yang berbeda dari katalog | Ambil URL checkout dari katalog, jangan tulis di kode |
| Halaman pembelian kosong setelah menekan tombol | Produk Mayar belum dibuat di akun yang dipakai | Buat produk di akun yang benar, lalu simpan UUID-nya di katalog |
| Halaman menampilkan pesan sedang diproses selamanya | Provider belum menerbitkan kode untuk transaksi itu | Periksa transaksi di dasbor provider; ini bukan kegagalan halaman |
| Gambar tampak menyamping | Orientasi EXIF diabaikan saat decode | Hormati orientasi saat memuat gambar |
| Vektor kosong tanpa pesan kesalahan | Canvas gagal pada gambar sangat besar, dan kegagalannya senyap | Kecilkan saat decode, dan pasang batas luas keras |
| Halaman berat setelah menampilkan hasil | SVG berisi ribuan potongan disisipkan langsung ke halaman | Rasterisasi untuk tampilan, dan sediakan SVG lewat tombol simpan |
| Waktu tunggu jauh lebih lama dari perkiraan | Kerapatan gambar, bukan ukurannya, yang menentukan biaya | Ukur dengan gambar bertekstur, bukan hanya foto halus |

### Catatan waktu proses

Biaya proses ditentukan oleh kerapatan gambar, bukan hanya jumlah
piksel. Pengukuran pada mesin XIX-Vectorizer, dengan nomor warna dan
kerapatan detail yang sama seperti aplikasi:

| Luas gambar | Foto halus | Foto bertekstur padat |
| --- | --- | --- |
| 1 MP | 3,0 detik | 3,8 detik |
| 2 MP | 5,2 detik | 7,2 detik |
| 3 MP | 8,1 detik | 16,1 detik |
| 4 MP | 15,6 detik | 16,5 detik |

Pada 6 megapiksel, gambar bertekstur menghasilkan SVG sekitar 20 MB
dengan lebih dari 73.000 potongan. Angka ini yang menjadi dasar pemilihan
batas 2 megapiksel, dan alasan hasil ditampilkan sebagai raster:
pengunjung yang menunggu lebih dari sepuluh detik akan menutup halaman
sebelum melihat hasilnya.

### Catatan waktu perangkat

Versi desktop menolak jam perangkat yang berada di belakang waktu server
terakhir yang dipercaya, dan pemulihan online hanya menerima selisih
paling besar lima menit. Jam yang tampak benar belum tentu cukup: bila
jam perangkat berada lebih dari lima menit di belakang jam server,
menyambung ke internet tidak memperbaiki keadaan. Sinkronkan jam
perangkat lebih dulu. Aturan ini milik aplikasi desktop, dan halaman web
yang menyebutkan langkah pemulihan harus menyebut sinkronisasi jam.
