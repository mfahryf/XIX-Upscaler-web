
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectImageType } from "./detect.js";

const here = dirname(fileURLToPath(import.meta.url));
const lock = JSON.parse(readFileSync(join(here, "..", "..", "scripts", "engine.lock.json"), "utf8"));
const workerSource = readFileSync(join(here, "worker.js"), "utf8");

function lineArt(size = 64) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const ink = Math.abs(y - size * 0.3) < 2 || Math.abs(x - size * 0.5) < 2;
      const value = ink ? 0 : 255;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}

describe("berkas mesin yang disalin", () => {
  it("detect.js dapat diimpor sebagai modul ESM", () => {
    expect(typeof detectImageType).toBe("function");
  });

  it("mengenali gambar garis sebagai sketsa", () => {
    expect(detectImageType(lineArt())).toMatchObject({ type: "sketch", colors: 3 });
  });

  it("worker.js siap dijalankan sebagai worker browser", () => {
    expect(workerSource).toContain("self.onmessage");
    expect(workerSource).toContain("postMessage");
  });

  it("tidak menyebut pihak ketiga pada berkas mesin", () => {
    const detectSource = readFileSync(join(here, "detect.js"), "utf8");
    for (const text of [workerSource, detectSource]) {
      expect(text).not.toMatch(/pngtosvg\.com/i);
      expect(text).not.toMatch(/ported from/i);
    }
  });

  it("sesuai sidik jari yang tercatat, sehingga salinan tidak dapat menyimpang diam-diam", () => {
    for (const name of ["worker.js", "detect.js"]) {
      const digest = createHash("sha256").update(readFileSync(join(here, name))).digest("hex");
      expect(digest).toBe(lock.generated[name]);
    }
  });
});

