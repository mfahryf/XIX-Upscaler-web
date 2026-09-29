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

// Catatan: `ort.env.logLevel` tidak menyenyapkan peringatan powerPreference di
// Windows. Pesan itu dipancarkan dari WASM lewat callback JavaScript langsung,
// jadi tidak ada opsi runtime yang bisa menurunkannya.

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

// Satu antrean petak boleh berjalan paralel, tetapi satu sesi tidak: runtime
// menyimpan keadaan bersama per sesi, dan menjalankan dua `run()` sekaligus di
// dalamnya membuat proses berhenti tanpa progres. Tiap antrean karena itu
// memakai sesi sendiri, dibuat sesuai kebutuhan lalu dipakai ulang.
const sessionPools = new Map();

function sessionFor(scale, pageBase, lane) {
  const spec = MODELS[scale];
  if (!spec) return Promise.reject(new Error("Unsupported scale: " + scale));
  let pool = sessionPools.get(scale);
  if (!pool) {
    pool = [];
    sessionPools.set(scale, pool);
  }
  // Yang disimpan adalah promise-nya, bukan hasilnya, supaya dua antrean yang
  // meminta jalur yang sama bersamaan tetap berbagi satu sesi.
  if (!pool[lane]) {
    pool[lane] = ort.InferenceSession.create(modelBase(pageBase) + spec.file, {
      // WebGPU first, with the CPU build as the fallback for a browser or device
      // that cannot provide a GPU adapter. It matters because the model takes
      // about 1.6 seconds per tile on a single CPU thread — the runtime's
      // multi-threaded build needs cross-origin isolation, which this page does
      // not have — so a two-megapixel photo would take minutes.
      executionProviders: ["webgpu", "wasm"],
      graphOptimizationLevel: "all",
    });
  }
  return pool[lane];
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

// Berapa antrean berjalan bersamaan. Tiap antrean butuh sesinya sendiri, jadi
// angka ini menentukan berapa salinan model yang ditahan di memori dan VRAM.
const LANES = 3;

async function upscale(rgba, width, height, scale, onProgress, pageBase) {
  const cols = Math.ceil(width / CORE);
  const rows = Math.ceil(height / CORE);
  const total = cols * rows;
  const laneCount = Math.min(LANES, total);
  // Semua sesi disiapkan lebih dulu supaya waktunya masuk ke tahap pemuatan
  // model, bukan ke sela-sela pemrosesan petak.
  const pool = await Promise.all(
    Array.from({ length: laneCount }, (unused, lane) => sessionFor(scale, pageBase, lane)),
  );
  const outputWidth = width * scale;
  const outputHeight = height * scale;
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  const outSide = TILE * scale;
  const expected = outSide * outSide;
  const srcX = OVERLAP * scale;
  let completed = 0;
  let next = 0;

  // Tiap antrean mengambil petak berikutnya sampai habis, dan tiap petak
  // menulis ke wilayahnya sendiri di `output`, jadi beberapa petak boleh
  // selesai bersamaan tanpa saling menimpa.
  async function runTile(session, laneTiles) {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= total) return;

      const originX = (index % cols) * CORE;
      const originY = Math.floor(index / cols) * CORE;
      const copyWidth = Math.min(CORE, width - originX);
      const copyHeight = Math.min(CORE, height - originY);

      for (let ty = 0; ty < TILE; ty += 1) {
        const sy = reflected(originY + ty - OVERLAP, height);
        for (let tx = 0; tx < TILE; tx += 1) {
          const sx = reflected(originX + tx - OVERLAP, width);
          const src = (sy * width + sx) * 4;
          const dst = (ty * TILE + tx) * 3;
          laneTiles[dst] = rgba[src];
          laneTiles[dst + 1] = rgba[src + 1];
          laneTiles[dst + 2] = rgba[src + 2];
        }
      }

      const input = new ort.Tensor("float32", toChw(laneTiles), [1, 3, TILE, TILE]);
      const results = await session.run({ [session.inputNames[0]]: input });
      const out = results[session.outputNames[0]];
      const values = out.data;
      if (out.dims[0] !== 1 || out.dims[1] !== 3 || out.dims[2] !== outSide || out.dims[3] !== outSide) {
        throw new Error("Unexpected model output shape: " + out.dims.join("x"));
      }

      for (let y = 0; y < copyHeight * scale; y += 1) {
        const srcRow = (OVERLAP * scale + y) * outSide;
        const dstRow = (originY * scale + y) * outputWidth;
        for (let x = 0; x < copyWidth * scale; x += 1) {
          const pick = srcRow + srcX + x;
          const target = (dstRow + originX * scale + x) * 4;
          output[target] = toByte(values[pick]);
          output[target + 1] = toByte(values[expected + pick]);
          output[target + 2] = toByte(values[expected * 2 + pick]);
          output[target + 3] = 255;
        }
      }

      completed += 1;
      onProgress({
        label: "Upscaling " + Math.round((completed / total) * 100) + "%",
        fraction: completed / total,
      });
    }
  }

  await Promise.all(
    pool.map((session) =>
      // Buffer petak milik tiap antrean: dipakai ulang antar petak, tetapi tidak
      // boleh dibagi antar antrean yang berjalan bersamaan.
      runTile(session, new Uint8ClampedArray(TILE * TILE * 3)),
    ),
  );

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
