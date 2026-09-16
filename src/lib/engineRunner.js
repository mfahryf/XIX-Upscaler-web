// Menjalankan mesin vektor di worker terpisah supaya antarmuka tidak membeku.
//
// Berkas mesin disalin dari repositori aplikasi desktop oleh
// scripts/sync-engine.mjs. Halaman tidak memakai runner Node milik aplikasi,
// karena halaman bekerja dengan berkas yang dipilih pengunjung.

import { detectImageType } from "../engine/detect.js";
import workerUrl from "../engine/worker.js?url";

// Tahap yang dilaporkan mesin, diterjemahkan untuk tampilan.
const STAGE_LABELS = {
  "Analyzing colors": "Membaca warna",
  "Segmenting regions": "Memisahkan bidang",
  "Tracing boundaries": "Menelusuri garis",
  "Building SVG": "Menyusun SVG",
};

const IDLE = 30_000;
const HARD_TIMEOUT = 120_000;

export function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage;
}

let worker = null;
let sequence = 0;

function ensureWorker() {
  if (!worker) worker = new Worker(workerUrl, { type: "classic" });
  return worker;
}

function terminate() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

// Warna otomatis memakai deteksi yang sama dengan aplikasi desktop, sehingga
// halaman dan aplikasi memperlakukan gambar yang sama dengan cara yang sama.
export function resolveColors(image, requested = 0) {
  if (Number.isFinite(requested) && requested > 0) return requested;
  return detectImageType(image).colors;
}

export function vectorize(image, { onProgress, colors = 0, detail = 60, smoothing = 1, speckleSize = 8 } = {}) {
  const target = ensureWorker();
  const id = ++sequence;
  const settings = {
    colors: resolveColors(image, colors),
    detail,
    smoothing,
    speckleSize,
  };

  return new Promise((resolve, reject) => {
    let idleTimer = null;
    let hardTimer = null;

    const cleanup = () => {
      clearTimeout(idleTimer);
      clearTimeout(hardTimer);
      target.removeEventListener("message", onMessage);
      target.removeEventListener("error", onError);
    };
    const fail = (error) => {
      cleanup();
      terminate();
      reject(error);
    };
    const bumpIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => fail(new Error("Mesin berhenti merespons.")), IDLE);
    };

    const onMessage = (event) => {
      const message = event.data || {};
      if (message.id !== id) return;
      bumpIdle();
      if (message.type === "progress") {
        onProgress?.({ stage: message.stage, label: stageLabel(message.stage), fraction: message.fraction });
        return;
      }
      if (message.type === "error") {
        fail(new Error(message.message || "Mesin gagal memproses gambar."));
        return;
      }
      if (message.type === "done") {
        cleanup();
        const svg = typeof message.result?.svg === "string" ? message.result.svg : String(message.result?.svg ?? "");
        if (!svg.trim()) {
          terminate();
          reject(new Error("Mesin tidak menghasilkan SVG."));
          return;
        }
        resolve({ svg, stats: message.result?.stats || null, settings });
      }
    };
    const onError = () => fail(new Error("Mesin tidak dapat dijalankan."));

    target.addEventListener("message", onMessage);
    target.addEventListener("error", onError);
    hardTimer = setTimeout(() => fail(new Error("Pemrosesan melewati batas waktu.")), HARD_TIMEOUT);
    bumpIdle();

    try {
      target.postMessage({ id, image, settings });
    } catch (error) {
      fail(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
