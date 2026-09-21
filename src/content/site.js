// Product copy and public configuration for the XIX-Upscaler desktop page.

export const SITE = Object.freeze({
  name: "XIXLabs",
  product: "XIX Upscaler",
  shortName: "Upscaler",
  path: "/upscaler/",
  byline: "by XIXLabs.net",
  title: "Bring small images back into focus",
  accentTitle: "with more detail",
});

export const CATALOG = Object.freeze({
  productId: "xix-upscaler",
  durationDays: 30,
  trialQuota: 10,
  maxActiveDevices: 1,
  engines: ["Image Online", "Image ESRGAN Offline", "Video Colab Experimental"],
});

// Coolify supplies VITE_CHECKOUT_URL after the production Mayar product exists.
export const CHECKOUT_URL = (import.meta.env?.VITE_CHECKOUT_URL || "").trim();
export const DOWNLOAD_URL = (
  import.meta.env?.VITE_DOWNLOAD_URL ||
  "https://github.com/mfahryf/XIX-Upscaler-release/releases/latest/download/Upscaler-latest-x64-setup.exe"
).trim();

export const PLAN_LABEL = "Price shown at checkout";
export const PLAN_POINTS = [
  `${CATALOG.trialQuota} successful files total before a licence is required`,
  `Valid for ${CATALOG.durationDays} days from payment`,
  `One licence active on ${CATALOG.maxActiveDevices} device`,
  "Image enhancement locally or through the supported online engine",
];

export const HERO_HIGHLIGHTS = [
  "Upscale small images for product pages, social posts, and print",
  "Choose an online engine or keep image processing on your computer",
  "Use ESRGAN locally when source files should remain private",
  "Process an image playlist with clear progress and output controls",
  "Video workflow is clearly marked as experimental before use",
];

export const PREVIEW = Object.freeze({
  palette: { accent: "#9fe7ff", accent2: "#b487ff", accent3: "#d7f7ff", bgOne: "#196d96", bgTwo: "#553d91", bgThree: "#7ec8ed", bgBase: "#101a38" },
  brand: "UPSCALER",
  count: "6/8",
  totalFiles: 8,
  format: "AUTO",
  fit: "Keep",
  timer: "2:08",
  status: "UPSCALE 64%",
  progress: 64,
  selectedEngine: "Image ESRGAN Offline",
  engines: [{ name: "Image Online", mode: "online" }, { name: "Image ESRGAN Offline", mode: "offline" }, { name: "Video Colab Experimental", mode: "experimental" }],
  advancedRows: [{ id: "scale", label: "SCALE", value: "4x", percent: 65 }, { id: "quality", label: "QUALITY", value: "92", percent: 78 }],
  files: [
    ["product-small.jpg", "done", "4x"], ["portrait-lowres.png", "done", "4x"], ["catalog-detail.webp", "done", "4x"],
    ["poster-preview.jpg", "done", "4x"], ["texture-source.png", "done", "4x"], ["shoe-detail.jpg", "processing", "64%"],
    ["banner-small.webp", "queued", "4x"], ["avatar-source.png", "queued", "4x"],
  ],
});

export const FOOTER_LINKS = Object.freeze({
  social: [],
  main: [{ href: "#download", label: "Download" }, { href: "mailto:hello@xixlabs.net", label: "Support" }],
  legal: [{ href: "/healthz", label: "Service status" }, { href: "https://xixlabs.net", label: "XIXLabs" }],
});

export const COPYRIGHT = Object.freeze({ text: "© " + new Date().getFullYear() + " XIXLabs", license: "All rights reserved" });
