// Page copy and display values.

export const SITE = {
  name: "XIXLabs",
  product: "XIX Vectorizer",
  byline: "by XIXLabs.net",
  tagline: "Turn images into clean SVG with three vector engines, all running on your own computer.",
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

export const FEATURES = [
  {
    title: "Three vector engines",
    detail:
      "Pick the engine that fits the job: V1 and V2 process online, V3 gives the smoothest result and runs fully offline.",
  },
  {
    title: "Clean output",
    detail:
      "SVG without watermarks, on a transparent background, with paths you can edit straight in a design app.",
  },
  {
    title: "Batch work lives in the app",
    detail:
      "This page processes a single file as a trial. The desktop app handles long queues with pause, resume, and stop.",
  },
];

export const PLAN_POINTS = [
  "Three vector engines, each with " + CATALOG.filesPerEngine + " successful files before a licence is required",
  "Valid for " + CATALOG.durationDays + " days from payment",
  "One licence active on " + CATALOG.maxActiveDevices + " device",
  "After activation the app keeps working without internet for up to " + CATALOG.offlineLeaseDays + " days",
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
    { href: "#pricing", label: "Pricing" },
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
