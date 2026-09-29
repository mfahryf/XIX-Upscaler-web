// Upscales one image with the ESRGAN Slim models the desktop app ships.
//
// This is a direct port of the desktop engine (`engines/tile.rs` plus
// `engines/onnx.rs`), so a file that goes through the page comes out the way the
// app would produce it:
//
// - the model takes a fixed 128x128 RGB tile and returns 128 * scale;
// - tiles are laid out on a 96-pixel core (128 minus a 16-pixel overlap on each
//   side) and the image edges are mirrored, never clamped or filled with black;
// - only the middle of each result is copied back, which is what makes the
//   overlapping borders disappear;
// - pixels are normalised to 0..1 planes in RGB order and rounded back with the
//   same formula the app uses.
//
// Running in a worker keeps the page responsive while the model works.

// The WebGPU build of the runtime is imported rather than the default one: it
// carries the same runtime plus the WebGPU execution provider, which is the
// only way the model can run on the visitor's GPU from a page.
import * as ort from "onnxruntime-web/webgpu";

const TILE = 128;
const OVERLAP = 16;
const CORE = TILE - OVERLAP * 2;

const MODELS = {
  2: { file: "esrgan-slim-x2.onnx", scale: 2 },
  4: { file: "esrgan-slim-x4.onnx", scale: 4 },
};

// Where the model files are served from. The page is served under a path such
// as /upscaler/, so the base cannot be assumed to be the domain root, and this
// worker's own URL sits in an asset subdirectory — the page therefore sends its
// base path with each job instead of the worker guessing one.
function modelBase(pageBase) {
  const base = pageBase || "/";
  return new URL("models/", new URL(base, self.location.origin)).href;
}

const sessions = new Map();

async function sessionFor(scale, pageBase) {
  if (sessions.has(scale)) return sessions.get(scale);
  const spec = MODELS[scale];
  if (!spec) throw new Error("Unsupported scale: " + scale);
  const created = ort.InferenceSession.create(modelBase(pageBase) + spec.file, {
    // WebGPU first, with the CPU build as the fallback for a browser or device
    // that cannot provide a GPU adapter. It matters because the model takes
    // about 1.6 seconds per tile on a single CPU thread — the runtime's
    // multi-threaded build needs cross-origin isolation, which this page does
    // not have — so a two-megapixel photo would take minutes.
    executionProviders: ["webgpu", "wasm"],
    graphOptimizationLevel: "all",
  });
  sessions.set(scale, created);
  return created;
}

// Mirrors the app's `reflected`: the image edge folds back on itself rather than
// repeating or clamping the last row.
function reflected(value, length) {
  if (length <= 1) return 0;
  const period = (length - 1) * 2;
  const folded = ((value % period) + period) % period;
  return folded < length ? folded : period - folded;
}

function toChw(tile) {
  const plane = TILE * TILE;
  const chw = new Float32Array(plane * 3);
  for (let i = 0; i < plane; i += 1) {
    chw[i] = tile[i * 3] / 255;
    chw[plane + i] = tile[i * 3 + 1] / 255;
    chw[plane * 2 + i] = tile[i * 3 + 2] / 255;
  }
  return chw;
}

function toByte(value) {
  const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
  return Math.round(clamped * 255);
}

// Beberapa petak dikerjakan bersamaan supaya GPU tidak menganggur menunggu satu
// petak selesai sebelum menyusun petak berikutnya. Tiga cukup untuk menutupi
// latensi tanpa menumpuk memori; pada backend CPU yang satu utas hasilnya sama
// saja karena runtime menjalankan permintaan secara berurutan.
const CONCURRENCY = 3;

async function upscale(rgba, width, height, scale, onProgress, pageBase) {
  const session = await sessionFor(scale, pageBase);
  const cols = Math.ceil(width / CORE);
  const rows = Math.ceil(height / CORE);
  const total = cols * rows;
  const outputWidth = width * scale;
  const outputHeight = height * scale;
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  const outSide = TILE * scale;
  const expected = outSide * outSide;
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const srcX = OVERLAP * scale;
  let completed = 0;
  let next = 0;

  async function runTile(index) {
    const originX = (index % cols) * CORE;
    const originY = Math.floor(index / cols) * CORE;
    const copyWidth = Math.min(CORE, width - originX);
    const copyHeight = Math.min(CORE, height - originY);
    // Buffer petak dibuat per petak, bukan dipakai bersama: beberapa petak
    // berjalan bersamaan dan yang satu tidak boleh menimpa isi yang lain saat
    // menunggu model selesai.
    const tile = new Uint8ClampedArray(TILE * TILE * 3);

    for (let ty = 0; ty < TILE; ty += 1) {
      const sy = reflected(originY + ty - OVERLAP, height);
      for (let tx = 0; tx < TILE; tx += 1) {
        const sx = reflected(originX + tx - OVERLAP, width);
        const src = (sy * width + sx) * 4;
        const dst = (ty * TILE + tx) * 3;
        tile[dst] = rgba[src];
        tile[dst + 1] = rgba[src + 1];
        tile[dst + 2] = rgba[src + 2];
      }
    }

    const input = new ort.Tensor("float32", toChw(tile), [1, 3, TILE, TILE]);
    const results = await session.run({ [inputName]: input });
    const out = results[outputName];
    const values = out.data;
    if (out.dims[0] !== 1 || out.dims[1] !== 3 || out.dims[2] !== outSide || out.dims[3] !== outSide) {
      throw new Error("Unexpected model output shape: " + out.dims.join("x"));
    }

    for (let y = 0; y < copyHeight * scale; y += 1) {
      const srcRow = (OVERLAP * scale + y) * outSide;
      const dstRow = (originY * scale + y) * outputWidth;
      for (let x = 0; x < copyWidth * scale; x += 1) {
        const index = srcRow + srcX + x;
        const target = (dstRow + originX * scale + x) * 4;
        output[target] = toByte(values[index]);
        output[target + 1] = toByte(values[expected + index]);
        output[target + 2] = toByte(values[expected * 2 + index]);
        output[target + 3] = 255;
      }
    }
  }

  // Tiap pengambil mengambil petak berikutnya sampai habis; dengan begitu
  // petak dibagi rata tanpa daftar tunggu terpisah.
  async function drain() {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= total) return;
      await runTile(index);
      completed += 1;
      onProgress({
        label: "Upscaling " + Math.round((completed / total) * 100) + "%",
        fraction: completed / total,
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, drain));

  return { pixels: output, width: outputWidth, height: outputHeight };
}

self.onmessage = async (event) => {
  const { id, rgba, width, height, scale, base } = event.data || {};
  try {
    // Sesi model dibuat di dalam upscale() dengan base halaman yang sama,
    // jadi tidak perlu disiapkan lagi di sini.
    const result = await upscale(rgba, width, height, scale, (progress) => {
      self.postMessage({ id, type: "progress", ...progress });
    }, base);
    self.postMessage(
      { id, type: "done", width: result.width, height: result.height, pixels: result.pixels },
      [result.pixels.buffer]
    );
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
