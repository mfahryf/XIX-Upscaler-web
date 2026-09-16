
// Isi teks dan nilai tampilan halaman.

export const SITE = {
  name: "XIXLabs",
  product: "XIX Vectorizer",
  byline: "by XIXLabs.net",
  tagline: "Ubah gambar menjadi SVG dengan tiga mesin vektor, semuanya berjalan di komputer Anda.",
};

// Disalin dari katalog gateway untuk keperluan teks. Sumber kebenarannya tetap
// katalog gateway; bila harga atau kuota berubah di sana, samakan di sini.
export const CATALOG = {
  productId: "xix-vectorizer",
  priceAmount: 99000,
  currency: "IDR",
  durationDays: 30,
  filesPerEngine: 5,
  maxActiveDevices: 1,
  offlineLeaseDays: 14,
  engines: ["Vectorize V1", "Vectorize V2", "Vectorize V3"],
};

// Tautan pembelian diambil dari konfigurasi, bukan ditulis di kode, supaya
// halaman dan katalog tidak pernah menunjuk produk yang berbeda. Nilainya
// diisi saat build dari katalog gateway.
export const CHECKOUT_URL = (import.meta.env?.VITE_CHECKOUT_URL || "").trim();

// Installer belum punya tempat penyimpanan. Selama kosong, bagian unduh
// menampilkan penjelasan singkat, bukan tombol yang tidak punya tujuan.
export const DOWNLOAD_URL = (import.meta.env?.VITE_DOWNLOAD_URL || "").trim();

export const PLAN_LABEL = (() => {
  const amount = CATALOG.priceAmount.toLocaleString("id-ID");
  return "Rp" + amount + " / bulan";
})();

export const FEATURES = [
  {
    title: "Tiga mesin vektor",
    detail:
      "Pilih mesin sesuai kebutuhan: V1 dan V2 untuk pemrosesan online, V3 untuk hasil paling halus dan sepenuhnya offline.",
  },
  {
    title: "Hasil bersih",
    detail:
      "SVG tanpa watermark, dengan latar transparan dan jalur yang bisa langsung disunting di aplikasi desain.",
  },
  {
    title: "Proses borongan di aplikasi",
    detail:
      "Halaman ini memproses satu berkas untuk dicoba. Aplikasi desktop menangani antrean banyak berkas dengan jeda, lanjut, dan berhenti.",
  },
];

export const PLAN_POINTS = [
  "Tiga mesin vektor, masing-masing " + CATALOG.filesPerEngine + " berkas berhasil sebelum lisensi aktif",
  "Berlaku " + CATALOG.durationDays + " hari sejak pembayaran",
  "Satu lisensi aktif pada " + CATALOG.maxActiveDevices + " perangkat",
  "Setelah aktivasi, aplikasi tetap dapat dipakai tanpa internet sampai " + CATALOG.offlineLeaseDays + " hari",
  "Pemrosesan borongan tanpa batas selama langganan aktif",
];

// Gambar contoh yang diukur halaman saat pertamakali dibuka tidak dipakai.
// Percobaan selalu berawal dari berkas pilihan pengunjung.
export const DEMO_LIMITS = {
  fileBytes: 5 * 1024 * 1024,
  maxPixels: 2_000_000,
  accepted: "PNG, JPG, atau WebP",
};

