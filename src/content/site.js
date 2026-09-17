// Page copy and display values.

export const SITE = {
  name: "XIXLabs",
  product: "XIX Vectorizer",
  byline: "by XIXLabs.net",
};

// Mirrors the gateway catalog for display copy. The gateway catalog stays the
// source of truth; when price or quota changes there, match it here.
export const CATALOG = {
  productId: "xix-vectorizer",
  priceAmount: 99000,
  currency: "IDR",
  durationDays: 30,
  filesPerEngine: 5,
  maxActiveDevices: 1,
  // Ikut dicatat karena gateway memilikinya, tetapi tidak lagi ditampilkan di
  // halaman: keterangan masa pakai tanpa internet di daftar keuntungan lisensi
  // dihapus agar daftarnya tidak memuat urusan teknis aktivasi.
  offlineLeaseDays: 14,
  engines: ["Vectorize V1", "Vectorize V2", "Vectorize V3"],
};

// The purchase link comes from configuration rather than source, so the page
// and the catalog can never point at different products. It is filled at build
// time from the gateway catalog.
export const CHECKOUT_URL = (import.meta.env?.VITE_CHECKOUT_URL || "").trim();

// The installer has no hosting yet. While this is empty the download section
// explains that, instead of showing a button that leads nowhere.
export const DOWNLOAD_URL = (import.meta.env?.VITE_DOWNLOAD_URL || "").trim();

export const PLAN_LABEL = (() => {
  const amount = CATALOG.priceAmount.toLocaleString("en-US");
  return "IDR " + amount + " / month";
})();

// Keunggulan aplikasi desktop, ditampilkan di hero tepat setelah judul dan
// sebelum tombol percobaan gratis. Setiap butir hanya menyebut hal yang
// benar-benar dikerjakan aplikasi: tiga mesin (dua daring, satu lokal),
// artboard yang dapat diatur, ekspor SVG/AI/DXF, keluaran siap spesifikasi
// Adobe Stock, proses paralel, mode Tor bawaan, padding otomatis, dan
// installer yang kecil. Butir terakhir menyebut tampilannya: kerangka aplikasi
// ini meniru pemutar musik Winamp klasik, tetapi digarap ulang dengan lapisan
// kaca yang modern.
export const HERO_HIGHLIGHTS = [
  "Three vector engines — two AI-powered online, one fully local and offline",
  "AI vectorizing that returns clean, tidy artwork",
  "Artboard size you set yourself, or fitted to the artwork",
  "Export to SVG, AI, and DXF",
  "Output prepared to the Adobe Stock spec, ready for stock uploads",
  "Runs several files at once instead of one by one",
  "Built-in Tor mode — route the online engines through Tor when you need it",
  "Automatic padding: full-bleed, or +7% breathing room",
  "Lightweight — the installer is about 7 MB",
  "A nostalgic Winamp-style shell, rebuilt with a modern glass finish",
];

export const PLAN_POINTS = [
  "Three vector engines, each with " + CATALOG.filesPerEngine + " successful files before a licence is required",
  "Valid for " + CATALOG.durationDays + " days from payment",
  "One licence active on " + CATALOG.maxActiveDevices + " device",
  "Unlimited batch processing while the subscription is active",
];

// No sample image is shipped with the page. Every trial starts from a file the
// visitor chooses.
export const DEMO_LIMITS = {
  fileBytes: 5 * 1024 * 1024,
  maxPixels: 2_000_000,
  accepted: "PNG, JPG, or WebP",
};

// Footer destinations. Only links that actually resolve are listed, so nothing
// in the footer leads nowhere.
//
// The social row is empty until XIXLabs has accounts to point at. The footer
// hides the row while the list is empty, and it takes the same shape the shared
// footer uses, so filling it in later needs no layout change.
export const FOOTER_LINKS = {
  social: [],
  main: [
    { href: "#try", label: "Try free" },
    { href: "#download", label: "Download" },
    { href: "mailto:hello@xixlabs.net", label: "Support" },
  ],
  legal: [
    { href: "/healthz", label: "Service status" },
    { href: "https://xixlabs.net", label: "XIXLabs" },
  ],
};

export const COPYRIGHT = {
  text: "\u00a9 " + new Date().getFullYear() + " XIXLabs",
  license: "All rights reserved",
};
