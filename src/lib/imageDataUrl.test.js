
import { afterEach, describe, expect, it, vi } from "vitest";
import { imageDataToDataUrl } from "./image";

// Kanvas palsu yang meniru elemen <canvas> di peramban sungguhan.
function fakeCanvas() {
  const context = {
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
    fillStyle: "",
  };
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toDataURL: vi.fn(() => "data:image/png;base64,DARIKANVAS"),
  };
}

describe("imageDataToDataUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.OffscreenCanvas;
  });

  it("menghasilkan data URL dari kanvas elemen", () => {
    const canvas = fakeCanvas();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") return canvas;
      return document.createElement(tag);
    });

    const image = {
      data: new Uint8ClampedArray(100 * 50 * 4),
      width: 100,
      height: 50,
    };
    expect(imageDataToDataUrl(image)).toBe("data:image/png;base64,DARIKANVAS");
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
  });

  // Uji ini menjaga kegagalan yang pernah terjadi: peramban menyediakan
  // OffscreenCanvas, dan OffscreenCanvas tidak memiliki toDataURL. Ketika
  // kanvas dipilih ke OffscreenCanvas, gambar hasil tidak dapat ditampilkan dan
  // halaman berhenti dengan pesan "target.toDataURL is not a function".
  it("tetap bekerja pada peramban yang menyediakan OffscreenCanvas", () => {
    const dibuat = vi.fn();
    globalThis.OffscreenCanvas = class {
      constructor(...args) {
        dibuat(...args);
        throw new Error("OffscreenCanvas tidak boleh dipakai di sini");
      }
    };
    const canvas = fakeCanvas();
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") return canvas;
      return document.createElement(tag);
    });

    const image = {
      data: new Uint8ClampedArray(64 * 64 * 4),
      width: 64,
      height: 64,
    };
    expect(() => imageDataToDataUrl(image)).not.toThrow();
    expect(imageDataToDataUrl(image)).toBe("data:image/png;base64,DARIKANVAS");
    expect(dibuat).not.toHaveBeenCalled();
  });

  it("memperkecil gambar lebar untuk keperluan tampilan", () => {
    const canvases = [];
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        const canvas = fakeCanvas();
        canvases.push(canvas);
        return canvas;
      }
      return document.createElement(tag);
    });

    const image = {
      data: new Uint8ClampedArray(4000 * 100 * 4),
      width: 4000,
      height: 100,
    };
    imageDataToDataUrl(image, 1200);
    expect(canvases).toHaveLength(2);
    expect(canvases[1].width).toBe(1200);
    expect(canvases[1].height).toBe(30);
  });
});

