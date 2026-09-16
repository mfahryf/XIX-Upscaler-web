# XIX-Vectorizer-web

Halaman publik XIX Vectorizer di `https://xixlabs.net/vectorizer`.

Halaman ini menjelaskan produk, menyediakan percobaan vektor gratis yang berjalan
di komputer pengunjung, dan mengarahkan ke unduhan serta pembelian. Ia bukan
aplikasi desktopnya dan bukan halaman hasil pembayaran.

## Dokumen

| Dokumen | Isi |
| --- | --- |
| `docs/DESKTOP-WEB-PAGE-STANDARD.md` | Acuan membangun halaman web untuk aplikasi desktop `XIX-*` |
| `docs/superpowers/specs/2026-09-16-xix-vectorizer-web-page-design.md` | Rancangan halaman ini |

## Menjalankan secara lokal

```powershell
npm install
npm run engine:sync   # sekali, atau setiap kali mesin di XIX-Vectorizer berubah
npm run dev           # http://localhost:5173/vectorizer/
```

`npm run engine:sync` menyalin mesin vektor dari repo `XIX-Vectorizer` yang
berada di sebelah repo ini. Bila letaknya berbeda, set
`XIX_VECTORIZER_ENGINE_DIR` ke folder `pngtosvg-runtime` milik repo itu.

## Mesin vektor

Mesin adalah milik aplikasi desktop, dan halaman ini hanya memakai salinannya.
Karena itu salinan tidak boleh menyimpang tanpa disadari:

- `scripts/sync-engine.mjs` menyalin `worker.js` dan `detect.js` ke `src/engine/`;
- `detect.js` di sumber berbentuk CommonJS, sedangkan halaman ini ESM. Salinannya
  dibungkus menjadi modul ESM di dalam skrip itu, sehingga berkas sumber tidak
  perlu diubah;
- `scripts/engine.lock.json` menyimpan sidik jari dua sisi: sidik jari sumber,
  dan sidik jari berkas hasil;
- `npm run engine:verify` memeriksa sidik jari sumber, dipakai saat mengembangkan
  ketika repo sumber tersedia;
- `npm run engine:verify-generated` memeriksa berkas hasil, dipakai di dalam
  build image ketika repo sumber tidak tersedia;
- berkas hasil ikut disimpan di repo supaya build image tidak memerlukan repo
  lain. Kesegarannya dijaga sidik jari, bukan larangan menyimpan.

Runner Node milik aplikasi desktop tidak ikut, karena halaman bekerja dengan
berkas yang dipilih pengunjung, bukan path berkas.

Obfuscate tidak dipakai. Pengujian menunjukkan hasil vektor identik, tetapi
ukuran berkas naik hampir tiga kali sehingga waktu muat halaman bertambah tanpa
melindungi apa pun.

## Perintah

| Perintah | Isi |
| --- | --- |
| `npm run dev` | Server pengembangan di path `/vectorizer/` |
| `npm run build` | Build produksi ke `dist/` |
| `npm test` | Seluruh uji |
| `npm run engine:sync` | Salin ulang mesin dan perbarui sidik jari |
| `npm run engine:verify` | Periksa sidik jari mesin sumber |
| `npm run engine:verify-generated` | Periksa sidik jari berkas mesin hasil |

## Keadaan

Halaman berjalan di lokal dan belum di-deploy. Yang belum ada: aplikasi di
Coolify, blok pengarah di landing pusat, dan tempat penyimpanan installer.
Tanpa tautan pembelian dan tautan unduhan, kedua bagian itu menampilkan
keterangan, bukan tombol yang tidak punya tujuan.

