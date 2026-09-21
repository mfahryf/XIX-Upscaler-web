# XIX-Upscaler-web

Halaman publik untuk aplikasi desktop XIX Upscaler di
`https://xixlabs.net/upscaler/`.

Halaman ini menjelaskan aplikasi, menampilkan pratinjau non-interaktif,
menyediakan unduhan installer Windows, serta mengarahkan pembelian ke checkout
Mayar produksi. Proses trial, aktivasi lisensi, dan pemrosesan file tetap
berjalan di aplikasi desktop.

## Konfigurasi

Atur `VITE_CHECKOUT_URL` di Coolify setelah produk Mayar produksi tersedia.
`VITE_DOWNLOAD_URL` bersifat opsional untuk mengganti URL installer stabil.

Tidak ada API key Mayar atau token rahasia di halaman ini. Harga selalu diambil
dari halaman checkout.

## Menjalankan dan memeriksa

```powershell
npm install
npm run dev       # http://localhost:5173/upscaler/
npm test
npm run build
```

Installer desktop dirilis dari repo publik
`mfahryf/XIX-Upscaler-release` dengan nama aset stabil
`Upscaler-latest-x64-setup.exe`.

`docs/DESKTOP-WEB-PAGE-STANDARD.md` adalah standar bersama untuk semua halaman
publik aplikasi desktop XIXLabs.
