# XIX-Upscaler-web

Halaman publik untuk aplikasi desktop XIX Upscaler di
`https://xixlabs.net/upscaler/`.

Halaman ini menjelaskan aplikasi, menampilkan pratinjau non-interaktif,
menyediakan percobaan gratis di peramban, menyediakan unduhan installer Windows,
serta mengarahkan pembelian ke checkout Mayar produksi. Aktivasi lisensi dan
pemrosesan batch tetap berjalan di aplikasi desktop.

## Percobaan di peramban

Bagian `#try` memperbesar satu gambar di komputer pengunjung memakai model
ESRGAN Slim milik aplikasi desktop, dijalankan dengan `onnxruntime-web`. Mesinnya
dimuat saat dipakai, bukan saat halaman dibuka.

Ini bukan tiruan mesin desktop, melainkan salinan aturannya: petak 128x128 dengan
core 96 piksel dan tumpang tindih 16 piksel, tepi gambar dicerminkan seperti
`engines/tile.rs`, hanya bagian tengah hasil yang disalin kembali, dan piksel
dinormalkan ke 0..1 dalam urutan RGB. Angka-angka itu disalin dari sumber
aplikasi, bukan diperkirakan.

Model di `public/models/` adalah berkas yang sama dengan
`XIX-Upscaler/src-tauri/models/`, dengan SHA-256 yang cocok dengan `MODELS.json`
aplikasi. Lisensi pihak ketiga ikut disalin sebagai
`public/models/THIRD_PARTY_NOTICES.md`.

Karena berkas model berada di repo ini, menggantinya di aplikasi desktop tidak
otomatis mengubah halaman. Samakan keduanya dan periksa ulang hash-nya setiap
kali `models/` aplikasi berubah.

## Konfigurasi

`VITE_CHECKOUT_URL` bersifat opsional untuk mengganti checkout URL produksi
Upscaler yang sudah disediakan. `VITE_DOWNLOAD_URL` juga opsional untuk
mengganti URL installer stabil.

Tidak ada API key Mayar atau token rahasia di halaman ini. Harga selalu diambil
dari halaman checkout.

## Menjalankan dan memeriksa

```powershell
npm install
npm run dev       # http://localhost:5173/upscaler/
npm test
npm run build
```

Worker mesin memakai bentuk ESM (`worker.format: "es"` di `vite.config.js`),
karena onnxruntime-web memuat wasm-nya lewat impor dinamis dan worker klasik
tidak dapat melakukannya.

Installer desktop dirilis dari repo publik
`mfahryf/XIX-Upscaler-release` dengan nama aset stabil
`Upscaler-latest-x64-setup.exe`.

Deployment production memakai resource Coolify `upscaler-web`, GitHub App
`fahry-github`, branch `main`, port `80`, dan route
`https://xixlabs.net/upscaler/`. Push ke `main` memicu deployment otomatis.

`docs/DESKTOP-WEB-PAGE-STANDARD.md` adalah standar bersama untuk semua halaman
publik aplikasi desktop XIXLabs.
