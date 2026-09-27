// Runs the offline ESRGAN engine in a worker and keeps the panel informed.
//
// The worker module pulls in the ONNX runtime and its WASM binary, so it is
// created only when a visitor actually starts a trial. Vite emits it as its own
// chunk; the page stays light for everyone who is just reading.
// The engine worker is a native ES module worker. It has to be, because
// onnxruntime-web loads its WASM binary through a dynamic import, which a
// classic worker cannot do. Vite bundles it as its own chunk and rewrites this
// URL to the emitted asset, so it keeps working under the /upscaler/ base path.

const IDLE_TIMEOUT = 120_000;

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

export function upscale(image, { scale = 4, onProgress = () => {} } = {}) {
  const worker = new Worker(new URL("./upscaleWorker.js", import.meta.url), {
    type: "module",
  });

  return new Promise((resolve, reject) => {
    let timer = null;
    const settle = (fn, value) => {
      clearTimeout(timer);
      worker.terminate();
      fn(value);
    };

    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        settle(reject, new Error("The upscaler stopped responding."));
      }, IDLE_TIMEOUT);
    };

    // Surface the worker's own reason: an opaque failure here is the difference
    // between "it did not work" and a real diagnosis.
    worker.onerror = (event) =>
      settle(reject, new Error(event?.message || "The upscaler could not be started."));
    worker.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === "progress") {
        arm();
        onProgress({ label: data.label, fraction: data.fraction });
        return;
      }
      if (data.type === "error") {
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
    worker.postMessage({
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
