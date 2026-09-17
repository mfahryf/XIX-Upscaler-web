
import { useCallback, useEffect, useRef, useState } from "react";
import { BeforeAfterSlider, DISPLAY_MAX_HEIGHT } from "./BeforeAfterSlider";
import {
  ImageInputError,
  checkFile,
  formatBytes,
  formatMegapixels,
  imageDataToDataUrl,
  loadImage,
} from "../lib/image";
import { vectorize } from "../lib/engineRunner";
import { byteLength, downloadSvg, outputName, rasterize, readSize } from "../lib/svg";
import { DEMO_LIMITS } from "../content/site";

// Lebar gambar yang disiapkan untuk ditampilkan. Batasnya diturunkan dari
// batas tinggi tampilan, bukan dari lebar panel, supaya hasil tidak dibuat
// jauh lebih besar daripada ukuran yang benar-benar terlihat.
const PREVIEW_MAX_WIDTH = 1200;
const PREVIEW_MIN_WIDTH = 320;
// Tampilan pada layar rapat piksel tetap tajam dengan cadangan ini, tanpa
// membuat gambar menjadi berat.
const PREVIEW_SHARPNESS = 1.5;

function previewWidthFor(ratio) {
  if (!(ratio > 0)) return PREVIEW_MIN_WIDTH;
  const byHeight = Math.round(DISPLAY_MAX_HEIGHT * ratio * PREVIEW_SHARPNESS);
  return Math.min(PREVIEW_MAX_WIDTH, Math.max(PREVIEW_MIN_WIDTH, byHeight));
}

// Kotak percobaan gratis. Satu berkas per percobaan, diproses di komputer
// pengunjung, dengan kemajuan yang ditampilkan apa adanya dari tahap yang
// dilaporkan mesin.
export function DemoPanel() {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("");
  const [fraction, setFraction] = useState(0);
  const [result, setResult] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [dropping, setDropping] = useState(false);
  const inputRef = useRef(null);
  const runRef = useRef(0);

  useEffect(() => () => { runRef.current += 1; }, []);

  const reset = useCallback(() => {
    runRef.current += 1;
    setState("idle");
    setMessage("");
    setStage("");
    setFraction(0);
    setResult(null);
    setShowOriginal(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleFile = useCallback(async (file) => {
    const run = (runRef.current += 1);
    const alive = () => run === runRef.current;
    setMessage("");
    setResult(null);
    setShowOriginal(false);
    setStage("");
    setFraction(0);

    try {
      checkFile(file);
      setState("reading");
      const image = await loadImage(file);
      if (!alive()) return;

      setState("processing");
      setStage("Menyiapkan berkas");
      const started = Date.now();
      const output = await vectorize(image, {
        onProgress: ({ label, fraction: value }) => {
          if (!alive()) return;
          setStage(label);
          setFraction(Number.isFinite(value) ? value : 0);
        },
      });
      if (!alive()) return;
      const elapsed = Date.now() - started;

      const size = readSize(output.svg) || { width: image.width, height: image.height };
      const previewWidth = previewWidthFor(size.width / size.height);
      const previewHeight = Math.max(1, Math.round((previewWidth * size.height) / size.width));
      const beforeSrc = imageDataToDataUrl(image, previewWidth);
      const afterSrc = await rasterize(output.svg, previewWidth, previewHeight);
      if (!alive()) return;

      setResult({
        beforeSrc,
        afterSrc,
        width: size.width,
        height: size.height,
        svgBytes: byteLength(output.svg),
        svg: output.svg,
        sourceName: file.name,
        sourceBytes: file.size,
        sourcePixels: image.originalWidth * image.originalHeight,
        processedPixels: image.width * image.height,
        downscaled: image.downscaled,
        elapsed,
        colors: output.settings?.colors ?? null,
      });
      setFraction(1);
      setState("done");
    } catch (error) {
      if (!alive()) return;
      const text =
        error instanceof ImageInputError || typeof error?.message === "string"
          ? error.message
          : "Berkas tidak dapat diproses.";
      setMessage(text);
      setState("error");
    }
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDropping(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const busy = state === "reading" || state === "processing";

  return (
    <section className="panel demo" id="coba" aria-labelledby="demo-title">
      <div className="demo-head">
        <div>
          <p className="section-label">Coba gratis</p>
          <h2 id="demo-title">Vektorkan satu gambar, langsung di sini</h2>
          <p className="demo-lede">
            Berkas tidak diunggah ke mana pun. Mesin V3 berjalan di peramban Anda, dan hasilnya
            bisa langsung dibandingkan dengan gambar aslinya.
          </p>
        </div>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          Pilih gambar
        </button>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {state === "idle" && (
        <div
          className="dropzone"
          data-dropping={dropping ? "true" : "false"}
          onDragOver={(event) => {
            event.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={onDrop}
        >
          <span className="dropzone-mark" aria-hidden="true">SVG</span>
          <p className="dropzone-title">Letakkan satu gambar di sini</p>
          <p className="dropzone-detail">
            {DEMO_LIMITS.accepted}, maksimal {formatBytes(DEMO_LIMITS.fileBytes)}. Gambar di atas{" "}
            {formatMegapixels(DEMO_LIMITS.maxPixels)} dikecilkan otomatis, dan ukuran aslinya tetap
            dipakai oleh aplikasi desktop.
          </p>
          <button type="button" className="button button-primary" onClick={() => inputRef.current?.click()}>
            Pilih gambar
          </button>
        </div>
      )}

      {busy && (
        <div className="progress" role="status" aria-live="polite">
          <div className="progress-head">
            <span className="progress-stage">{state === "reading" ? "Membaca berkas" : stage}</span>
            <span className="progress-value">
              {state === "reading" ? "" : Math.round(fraction * 100) + "%"}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-bar"
              data-indeterminate={state === "reading" ? "true" : "false"}
              style={state === "reading" ? undefined : { width: Math.round(fraction * 100) + "%" }}
            />
          </div>
          <p className="progress-note">
            Gambar yang rapat garis dan teksturnya memerlukan waktu paling lama. Biarkan halaman ini
            terbuka sampai selesai.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="alert" role="alert">
          <strong>Gambar belum bisa diproses.</strong>
          <p>{message}</p>
          <button type="button" className="button button-secondary" onClick={reset}>
            Coba lagi
          </button>
        </div>
      )}

      {state === "done" && result && (
        <div className="result">
          <BeforeAfterSlider
            beforeSrc={result.beforeSrc}
            afterSrc={result.afterSrc}
            width={result.width}
            height={result.height}
            showOriginal={showOriginal}
          />
          <div className="result-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => downloadSvg(result.svg, outputName(result.sourceName))}
            >
              Simpan SVG
            </button>
            <button
              type="button"
              className="button button-secondary"
              onPointerDown={() => setShowOriginal(true)}
              onPointerUp={() => setShowOriginal(false)}
              onPointerLeave={() => setShowOriginal(false)}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") setShowOriginal(true);
              }}
              onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") setShowOriginal(false);
              }}
              onBlur={() => setShowOriginal(false)}
            >
              Tahan untuk lihat asli
            </button>
            <button type="button" className="button button-secondary" onClick={reset}>
              Mulai ulang
            </button>
          </div>
          <dl className="result-stats">
            <div>
              <dt>Ukuran berkas</dt>
              <dd>{formatBytes(result.svgBytes)}</dd>
            </div>
            <div>
              <dt>Waktu proses</dt>
              <dd>{(result.elapsed / 1000).toFixed(1).replace(".", ",")} detik</dd>
            </div>
            <div>
              <dt>Dimensi vektor</dt>
              <dd>
                {Math.round(result.width)} x {Math.round(result.height)} px
              </dd>
            </div>
            <div>
              <dt>Warna</dt>
              <dd>{result.colors ?? "otomatis"}</dd>
            </div>
          </dl>
          <p className="result-note">
            {result.downscaled
              ? "Gambar Anda " +
                formatMegapixels(result.sourcePixels) +
                " dan diproses pada " +
                formatMegapixels(result.processedPixels) +
                " supaya selesai cepat. Aplikasi desktop memakai ukuran aslinya."
              : "Gambar diproses pada ukuran aslinya (" +
                formatMegapixels(result.processedPixels) +
                "), sama seperti aplikasi desktop."}
          </p>
        </div>
      )}
    </section>
  );
}

export default DemoPanel;
