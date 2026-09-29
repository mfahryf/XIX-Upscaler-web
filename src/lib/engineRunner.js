// Runs the offline ESRGAN engine in a worker and keeps the panel informed.
//
// The expensive part of a run is the worker itself: it loads and compiles about
// 24 MB of WASM runtime before the first tile, while every later tile costs a
// small fraction of that. The worker is therefore kept between runs and reused
// instead of being built and thrown away per picture.
//
// Runs are queued, so one picture is in flight at a time. The parallelism that
// matters lives inside the worker, which spreads the tiles of a picture over
// several model sessions.
//
// The engine worker is a native ES module worker. It has to be, because
// onnxruntime-web loads its WASM binary through a dynamic import, which a
// classic worker cannot do. Vite bundles it as its own chunk and rewrites this
// URL to the emitted asset, so it keeps working under the /upscaler/ base path.

// How long a run may go without any sign of progress before it is treated as
// stuck.
const STALL_TIMEOUT = 120_000;
// The worker holds the runtime and the model sessions in memory, so it is
// released once the page has been idle for a while.
const IDLE_SHUTDOWN = 60_000;

let worker = null;
let shutdownTimer = null;
let queue = Promise.resolve();
let nextJobId = 0;

function ensureWorker() {
  if (!worker) {
    worker = new Worker(new URL("./upscaleWorker.js", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

// Drops the worker and everything it holds. The next run builds a fresh one.
function retireWorker() {
  clearTimeout(shutdownTimer);
  shutdownTimer = null;
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

function scheduleShutdown() {
  clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(retireWorker, IDLE_SHUTDOWN);
}

// Turns the raw RGBA the worker returns into a PNG the page can display.
function pixelsToDataUrl(pixels, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  image.data.set(pixels);
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function runJob(image, scale, onProgress) {
  return new Promise((resolve, reject) => {
    const active = ensureWorker();
    clearTimeout(shutdownTimer);
    shutdownTimer = null;

    const id = (nextJobId += 1);
    let stallTimer = null;
    const settle = (fn, value, keepWorker = true) => {
      clearTimeout(stallTimer);
      active.onmessage = null;
      active.onerror = null;
      if (keepWorker) scheduleShutdown();
      else retireWorker();
      fn(value);
    };

    const arm = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        // The run may still be going inside the worker, and its late messages
        // would otherwise be read as the next run's result, so the worker is
        // dropped along with it.
        settle(reject, new Error("The upscaler stopped responding."), false);
      }, STALL_TIMEOUT);
    };

    // Surface the worker's own reason: an opaque failure here is the difference
    // between "it did not work" and a real diagnosis.
    active.onerror = (event) =>
      settle(reject, new Error(event?.message || "The upscaler could not be started."), false);

    active.onmessage = (event) => {
      const data = event.data || {};
      // A retired worker's late messages must not settle the current run.
      if (data.id !== id) return;
      if (data.type === "progress") {
        arm();
        onProgress({ label: data.label, fraction: data.fraction });
        return;
      }
      if (data.type === "error") {
        // The worker caught this one, so it is still usable for the next run.
        settle(reject, new Error(data.message || "The upscaler failed."));
        return;
      }
      if (data.type === "done") {
        arm();
        onProgress({ label: "Encoding PNG", fraction: 0.99 });
        const url = pixelsToDataUrl(data.pixels, data.width, data.height);
        settle(resolve, { url, width: data.width, height: data.height });
      }
    };

    arm();
    // The pixel buffer is copied into the worker rather than transferred. The
    // panel still needs it afterwards to build the "before" layer of the
    // comparison, and a transferred buffer is detached, which would leave that
    // layer with nothing to draw. The copy is one image, made once per run.
    active.postMessage({
      id,
      rgba: image.data,
      width: image.width,
      height: image.height,
      scale,
      // The worker cannot derive the page's base path from its own location,
      // because it lives in an asset subdirectory, so the page supplies it.
      base: import.meta.env.BASE_URL,
    });
  });
}

export function upscale(image, { scale = 4, onProgress = () => {} } = {}) {
  // Each run waits for the previous one to settle. A failed run must not stop
  // the queue, so the chain is continued on a handled copy of the promise.
  const job = queue.then(() => runJob(image, scale, onProgress));
  queue = job.catch(() => {});
  return job;
}
