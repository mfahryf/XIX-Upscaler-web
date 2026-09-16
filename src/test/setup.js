
import "@testing-library/jest-dom/vitest";

// jsdom belum menyediakan ImageData, sedangkan peramban menyediakannya.
// Penambal ini hanya untuk lingkungan uji, supaya kode yang memakai ImageData
// dapat diuji tanpa mengubah kode produksinya.
if (typeof globalThis.ImageData !== "function") {
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) {
      if (typeof width === "number" && typeof height === "number") {
        this.data = data;
        this.width = width;
        this.height = height;
      } else {
        this.width = data;
        this.height = width;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      }
    }
  };
}

