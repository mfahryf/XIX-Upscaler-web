
import { describe, expect, it } from "vitest";
import {
  HARD_MAX_PIXELS,
  MAX_FILE_BYTES,
  MAX_PIXELS,
  checkFile,
  formatBytes,
  formatMegapixels,
  targetSize,
} from "./image";

describe("checkFile", () => {
  it("menerima png, jpeg, dan webp", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(() => checkFile({ type, size: 1024 })).not.toThrow();
    }
  });

  it("menolak berkas tanpa berkas", () => {
    expect(() => checkFile(null)).toThrowError(/No file selected/);
  });

  it("menolak format yang belum didukung", () => {
    expect(() => checkFile({ type: "image/gif", size: 1024 })).toThrowError(/is not supported/);
  });

  it("menolak berkas di atas 5 MB dan menyebut batasnya", () => {
    expect(() => checkFile({ type: "image/png", size: MAX_FILE_BYTES + 1 })).toThrowError(/5.0 MB/);
    expect(() => checkFile({ type: "image/png", size: MAX_FILE_BYTES })).not.toThrow();
  });
});

describe("targetSize", () => {
  it("membiarkan gambar kecil apa adanya", () => {
    expect(targetSize(800, 600)).toMatchObject({ width: 800, height: 600, downscaled: false });
  });

  it("memperkecil gambar besar sampai masuk batas, bukan menolaknya", () => {
    const result = targetSize(4000, 3000);
    expect(result.downscaled).toBe(true);
    expect(result.width * result.height).toBeLessThanOrEqual(MAX_PIXELS);
    expect(result.width).toBeGreaterThan(1500);
    expect(result.height).toBeGreaterThan(1100);
  });

  it("menjaga perbandingan sisi saat memperkecil", () => {
    const result = targetSize(4000, 2000);
    expect(result.width / result.height).toBeCloseTo(2, 1);
  });

  it("memperkecil full HD sedikit saja", () => {
    const result = targetSize(1920, 1080);
    expect(result.downscaled).toBe(true);
    expect(result.width).toBeGreaterThan(1800);
  });

  it("menolak gambar di atas batas keras", () => {
    const side = Math.ceil(Math.sqrt(HARD_MAX_PIXELS)) + 200;
    expect(() => targetSize(side, side)).toThrowError(/hard limit/);
  });

  it("menolak ukuran yang tidak masuk akal", () => {
    expect(() => targetSize(0, 0)).toThrowError(/could not be read/);
  });
});

describe("format", () => {
  it("membaca ukuran berkas", () => {
    expect(formatBytes(0)).toBe("0 KB");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("membaca megapiksel dengan koma", () => {
    expect(formatMegapixels(2_000_000)).toBe("2.00 MP");
  });
});
