import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { obfuscateEngine } from "./vite.obfuscate.js";

// Halaman ini dilayani di bawah xixlabs.net/upscaler, jadi base harus
// memakai path halaman supaya aset tidak dimuat dari akar domain.
export default defineConfig({
  base: "/upscaler/",
  plugins: [react(), obfuscateEngine(["engineRunner", "upscaleWorker"])],
  // Worker mesin memakai bentuk ESM supaya onnxruntime-web dapat memuat berkas
  // wasm-nya lewat impor dinamis; bentuk klasik gagal saat dijalankan.
  worker: { format: "es" },
  // globals diaktifkan supaya Testing Library membersihkan DOM antar uji
  // secara otomatis; tanpa itu hasil render menumpuk dan pencarian elemen
  // menemukan lebih dari satu kecocokan.
  test: { environment: "jsdom", setupFiles: "./src/test/setup.js", css: true, globals: true },
});
