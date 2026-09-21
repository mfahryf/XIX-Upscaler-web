import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Halaman ini dilayani di bawah xixlabs.net/upscaler, jadi base harus
// memakai path halaman supaya aset tidak dimuat dari akar domain.
export default defineConfig({
  base: "/upscaler/",
  plugins: [react()],
  // globals diaktifkan supaya Testing Library membersihkan DOM antar uji
  // secara otomatis; tanpa itu hasil render menumpuk dan pencarian elemen
  // menemukan lebih dari satu kecocokan.
  test: { environment: "jsdom", setupFiles: "./src/test/setup.js", css: true, globals: true },
});
